-- Source snapshots sit below stable public cards. All management is server-only.
create table public.directory_sources (
 id bigint generated always as identity primary key,
 name text not null, feed_url text not null unique check(length(feed_url)<=2048),
 enabled boolean not null default true, removed_at timestamptz,
 next_feed_at timestamptz not null default now(), last_feed_at timestamptz,
 last_error text, last_seen_count integer not null default 0,
 created_at timestamptz not null default now()
);
alter table public.directory_sources enable row level security;
revoke all on public.directory_sources from anon,authenticated;
grant all on public.directory_sources to service_role;
grant usage,select on sequence public.directory_sources_id_seq to service_role;
create index directory_sources_due on public.directory_sources(next_feed_at) where enabled and removed_at is null;
insert into public.directory_sources(name,feed_url,next_feed_at,last_feed_at,last_seen_count)
 select 'EnvironmentJob','https://environmentjob.co.uk/jobs.rss',next_feed_at,last_feed_at,
 (select count(*) from public.directory_jobs where is_active) from public.directory_settings;

alter table public.directory_jobs add column primary_source_id bigint references public.directory_sources(id);
alter table public.directory_jobs add column primary_external_id text;
alter table public.directory_jobs add column source_name text not null default 'EnvironmentJob';
alter table public.directory_jobs add column canonical_url text;
alter table public.directory_jobs add column identity_key text;
alter table public.directory_jobs add column merged_into bigint references public.directory_jobs(id);
create index directory_jobs_canonical_url on public.directory_jobs(canonical_url) where merged_into is null;
create index directory_jobs_identity on public.directory_jobs(identity_key) where identity_key is not null and merged_into is null;
create index directory_jobs_primary_source on public.directory_jobs(primary_source_id);
create index directory_jobs_merged_into on public.directory_jobs(merged_into) where merged_into is not null;

create table public.directory_source_jobs (
 source_id bigint not null references public.directory_sources(id),
 external_id text not null, job_id bigint not null references public.directory_jobs(id),
 content_hash text not null, payload jsonb not null check(jsonb_typeof(payload)='object'),
 is_present boolean not null default true, last_seen_at timestamptz not null default now(),
 primary key(source_id,external_id)
);
create index directory_source_jobs_card on public.directory_source_jobs(job_id);
alter table public.directory_source_jobs enable row level security;
revoke all on public.directory_source_jobs from anon,authenticated;
grant all on public.directory_source_jobs to service_role;

create or replace function private.directory_normalise(value text) returns text language sql immutable set search_path='' as $$
 select trim(regexp_replace(lower(replace(coalesce(value,''),'&',' and ')),'[^[:alnum:]]+',' ','g'))
$$;
create or replace function private.directory_org(value text) returns text language sql immutable set search_path='' as $$
 select regexp_replace(regexp_replace(private.directory_normalise(value),'^the ',''),' (limited|ltd|plc|cio|cic|llp)$','')
$$;
create or replace function private.directory_place(value text) returns text language sql immutable set search_path='' as $$
 select regexp_replace(regexp_replace(private.directory_normalise(split_part(value,',',1)),' (united kingdom|great britain|uk|gb|england|scotland|wales)$',''),'^(home based|homebased|working from home)$','remote')
$$;
create or replace function private.directory_identity(p jsonb) returns text language sql immutable set search_path='' as $$
 select case when private.directory_org(p->>'organisation_name') not in ('','organisation not stated')
 and private.directory_place(p->>'location_text') not in ('','location not stated')
 then md5(private.directory_org(p->>'organisation_name')||'|'||private.directory_normalise(p->>'title')||'|'||private.directory_place(p->>'location_text')||'|'||coalesce(p->>'country_code','')) end
$$;

-- Preserve every existing card and saved ID, including jobs already absent from the feed.
update public.directory_jobs j set primary_source_id=s.id,primary_external_id=j.feed_id,
 canonical_url=replace(j.source_url,'://www.','://'),identity_key=private.directory_identity(to_jsonb(j))
 from public.directory_sources s where s.feed_url='https://environmentjob.co.uk/jobs.rss';
insert into public.directory_source_jobs(source_id,external_id,job_id,content_hash,payload,is_present,last_seen_at)
 select j.primary_source_id,j.feed_id,j.id,j.feed_hash,
 to_jsonb(j)||jsonb_build_object('ai_hash',j.processed_hash,'logo_url',o.logo_url),j.is_active,j.last_seen_at
 from public.directory_jobs j left join public.directory_organisations o on o.name=j.organisation_name;

create or replace function private.directory_find_job(p jsonb,exclude_id bigint default null) returns bigint language sql stable set search_path='' as $$
 select j.id from public.directory_jobs j where j.merged_into is null and j.id is distinct from exclude_id and (
  (j.canonical_url=coalesce(p->>'canonical_url',p->>'source_url')
   and private.directory_normalise(j.title)=private.directory_normalise(p->>'title')
   and (private.directory_org(j.organisation_name)=private.directory_org(p->>'organisation_name') or private.directory_org(p->>'organisation_name') in ('','organisation not stated') or private.directory_org(j.organisation_name)='organisation not stated')
   and (private.directory_place(j.location_text)=private.directory_place(p->>'location_text') or private.directory_place(p->>'location_text') in ('','location not stated') or private.directory_place(j.location_text)='location not stated'))
  or (j.identity_key=private.directory_identity(p) and j.is_active and abs(extract(epoch from (j.posted_at-(p->>'posted_at')::timestamptz)))<=2592000
   and coalesce(j.closes_at,j.posted_at+interval '720 hours')>now()
   and not exists(select 1 from public.directory_source_jobs same_source where same_source.job_id=j.id and same_source.source_id=coalesce((p->>'_source_id')::bigint,(p->>'primary_source_id')::bigint) and same_source.external_id<>p->>'feed_id' ))
 ) order by j.id limit 1
$$;

create or replace function private.refresh_directory_job(p_id bigint) returns bigint language plpgsql set search_path='' as $$
declare listing record; old public.directory_jobs; p jsonb; duplicate_id bigint; keeper bigint; loser bigint; cached boolean;
begin
 select * into old from public.directory_jobs where id=p_id for update;
 if not found then return null; end if;
 if old.merged_into is not null then return old.merged_into; end if;
 select l.*,s.name into listing from public.directory_source_jobs l join public.directory_sources s on s.id=l.source_id
 where l.job_id=p_id and l.is_present and s.removed_at is null order by l.source_id,l.external_id limit 1;
 if not found then update public.directory_jobs set is_active=false where id=p_id; return p_id; end if;
 p=listing.payload;
 cached=coalesce(p->>'ai_hash','')=listing.content_hash;
 update public.directory_jobs set
 primary_source_id=listing.source_id,primary_external_id=listing.external_id,source_name=listing.name,
 source_url=p->>'source_url',canonical_url=coalesce(p->>'canonical_url',p->>'source_url'),
 title=p->>'title',organisation_name=p->>'organisation_name',feed_text=left(p->>'feed_text',1200),feed_hash=listing.content_hash,
 processed_hash=case when cached then listing.content_hash when old.feed_hash=listing.content_hash then old.processed_hash else null end,
 summary=case when cached then p->>'summary' when old.feed_hash=listing.content_hash and old.processed_hash=old.feed_hash then old.summary else coalesce(p->>'summary',p->>'title') end,
 summary_source=case when cached or (old.feed_hash=listing.content_hash and old.processed_hash=old.feed_hash) then 'ai' else 'source' end,
 sector_slugs=case when cached then array(select jsonb_array_elements_text(coalesce(p->'sector_slugs','[]'))) when old.feed_hash=listing.content_hash then old.sector_slugs else '{}' end,
 course_slugs=case when cached then array(select jsonb_array_elements_text(coalesce(p->'course_slugs','[]'))) when old.feed_hash=listing.content_hash then old.course_slugs else '{}' end,
 location_text=p->>'location_text',locality=p->>'locality',region=p->>'region',country_code=p->>'country_code',
 salary_text=p->>'salary_text',salary_min=(p->>'salary_min')::numeric,
 workplace=coalesce(p->>'workplace','On-site'),hours_type=coalesce(p->>'hours_type','Full time'),contract_type=coalesce(p->>'contract_type','Permanent'),engagement_type=coalesce(p->>'engagement_type','Paid'),
 posted_at=least(old.posted_at,(p->>'posted_at')::timestamptz),
 closes_at=coalesce((p->>'closes_at')::timestamptz,old.closes_at),
 last_seen_at=listing.last_seen_at,is_active=true,identity_key=private.directory_identity(p)
 where id=p_id;
 insert into public.directory_organisations(name,logo_url) values(p->>'organisation_name',nullif(p->>'logo_url',''))
 on conflict(name) do update set logo_url=coalesce(excluded.logo_url,public.directory_organisations.logo_url);
 duplicate_id=private.directory_find_job(p,p_id);
 if duplicate_id is not null then
  keeper=least(duplicate_id,p_id);loser=greatest(duplicate_id,p_id);
  update public.directory_source_jobs set job_id=keeper where job_id=loser;
  insert into public.directory_saved_jobs(user_id,job_id,saved_at)
   select user_id,keeper,saved_at from public.directory_saved_jobs where job_id=loser
   on conflict(user_id,job_id) do nothing;
  delete from public.directory_saved_jobs where job_id=loser;
  update public.directory_jobs set merged_into=keeper,is_active=false where id=loser or merged_into=loser;
  return private.refresh_directory_job(keeper);
 end if;
 return p_id;
end $$;

create or replace function public.import_directory_feed(p_source_id bigint,p_feed_url text,p_items jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare source public.directory_sources; item jsonb; previous public.directory_source_jobs; card_id bigint; changed integer=0; r record;
begin
 -- Serialises source edits/imports and all merges without a second scheduler or queue.
 perform pg_advisory_xact_lock(742091);
 select * into source from public.directory_sources where id=p_source_id for update;
 if not found or source.removed_at is not null or not source.enabled or source.feed_url<>p_feed_url then return jsonb_build_object('seen',0,'changed',0); end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)>5000 then raise exception 'Invalid feed items'; end if;
 update public.directory_source_jobs set is_present=false where source_id=p_source_id;
 for item in select value from jsonb_array_elements(p_items) loop
  item=item||jsonb_build_object('_source_id',p_source_id);
  select * into previous from public.directory_source_jobs where source_id=p_source_id and external_id=item->>'feed_id';
  if found then
   card_id=previous.job_id;
   if previous.content_hash<>item->>'feed_hash' then changed=changed+1; end if;
  else
   card_id=private.directory_find_job(item);
   if card_id is null then
    insert into public.directory_jobs(feed_id,slug,source_url,title,organisation_name,feed_text,feed_hash,summary,location_text,salary_text,posted_at)
     values('source:'||p_source_id||':'||md5(item->>'feed_id'),left(coalesce(item->>'slug','job'),120)||'-'||p_source_id||'-'||left(md5(item->>'feed_id'),10),item->>'source_url',item->>'title',item->>'organisation_name',item->>'feed_text',item->>'feed_hash',coalesce(item->>'summary',item->>'title'),item->>'location_text',item->>'salary_text',(item->>'posted_at')::timestamptz)
     returning id into card_id;
   end if;
   changed=changed+1;
  end if;
  insert into public.directory_source_jobs(source_id,external_id,job_id,content_hash,payload,is_present,last_seen_at)
   values(p_source_id,item->>'feed_id',card_id,item->>'feed_hash',item,true,now())
   on conflict(source_id,external_id) do update set content_hash=excluded.content_hash,
   payload=case when public.directory_source_jobs.content_hash=excluded.content_hash then public.directory_source_jobs.payload else excluded.payload||jsonb_build_object('posted_at',least((public.directory_source_jobs.payload->>'posted_at')::timestamptz,(excluded.payload->>'posted_at')::timestamptz),'closes_at',coalesce(excluded.payload->'closes_at',public.directory_source_jobs.payload->'closes_at')) end,
   is_present=true,last_seen_at=now();
 end loop;
 for r in select distinct job_id from public.directory_source_jobs where source_id=p_source_id loop perform private.refresh_directory_job(r.job_id);end loop;
 update public.directory_sources set last_feed_at=now(),next_feed_at=now()+interval '1 hour',last_error=null,last_seen_count=jsonb_array_length(p_items) where id=p_source_id;
 return jsonb_build_object('seen',jsonb_array_length(p_items),'changed',changed);
end $$;

create or replace function public.apply_directory_job(p_job_id bigint,p_feed_hash text,p_fields jsonb,p_ai boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.directory_jobs; final_id bigint; fields jsonb;
begin
 perform pg_advisory_xact_lock(742091);
 select * into j from public.directory_jobs where id=p_job_id and merged_into is null for update;
 if not found or j.feed_hash<>p_feed_hash then return null;end if;
 fields=p_fields;
 if p_ai then fields=fields||jsonb_build_object('ai_hash',p_feed_hash,'summary_source','ai');end if;
 update public.directory_source_jobs set payload=payload||fields
 where source_id=j.primary_source_id and external_id=j.primary_external_id and content_hash=p_feed_hash and is_present;
 if not found then return null;end if;
 final_id=private.refresh_directory_job(j.id);
 return (select to_jsonb(card) from public.directory_jobs card where id=final_id);
end $$;

create or replace function public.manage_directory_source(p_action text,p_id bigint default null,p_url text default null,p_name text default null) returns bigint language plpgsql security invoker set search_path='' as $$
declare managed_id bigint; r record;
begin
 perform pg_advisory_xact_lock(742091);
 if p_action='add' then
  if p_url is null or nullif(trim(p_name),'') is null then raise exception 'Feed URL and name required';end if;
  select id into managed_id from public.directory_sources where feed_url=p_url and removed_at is null;
  if found then raise exception 'This feed is already added';end if;
  insert into public.directory_sources(name,feed_url) values(left(trim(p_name),160),p_url)
   on conflict(feed_url) do update set name=excluded.name,enabled=true,removed_at=null,next_feed_at=now(),last_error=null returning id into managed_id;
 else
  managed_id=p_id;
  if not exists(select 1 from public.directory_sources where id=p_id and removed_at is null) then raise exception 'Source not found';end if;
  if p_action='pause' then update public.directory_sources set enabled=false where id=p_id;
  elsif p_action='resume' then update public.directory_sources set enabled=true,next_feed_at=now() where id=p_id;
  elsif p_action='refresh' then update public.directory_sources set next_feed_at=now() where id=p_id;
  elsif p_action='rename' then
   if nullif(trim(p_name),'') is null then raise exception 'Source name required';end if;
   update public.directory_sources set name=left(trim(p_name),160) where id=p_id;
   for r in select distinct job_id from public.directory_source_jobs where source_id=p_id loop perform private.refresh_directory_job(r.job_id);end loop;
  elsif p_action='remove' then
   update public.directory_sources set enabled=false,removed_at=now() where id=p_id;
   update public.directory_source_jobs set is_present=false where source_id=p_id;
   for r in select distinct job_id from public.directory_source_jobs where source_id=p_id loop perform private.refresh_directory_job(r.job_id);end loop;
  else raise exception 'Unknown source action';end if;
 end if;
 update public.directory_settings set next_feed_at=coalesce((select min(next_feed_at) from public.directory_sources where enabled and removed_at is null),'9999-12-31'::timestamptz) where id;
 return managed_id;
end $$;

revoke all on function private.directory_normalise(text),private.directory_org(text),private.directory_place(text),private.directory_identity(jsonb),private.directory_find_job(jsonb,bigint),private.refresh_directory_job(bigint) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.directory_normalise(text),private.directory_org(text),private.directory_place(text),private.directory_identity(jsonb),private.directory_find_job(jsonb,bigint),private.refresh_directory_job(bigint) to service_role;
revoke all on function public.import_directory_feed(bigint,text,jsonb),public.apply_directory_job(bigint,text,jsonb,boolean),public.manage_directory_source(text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.import_directory_feed(bigint,text,jsonb),public.apply_directory_job(bigint,text,jsonb,boolean),public.manage_directory_source(text,bigint,text,text) to service_role;

create function public.directory_pending_jobs() returns setof public.directory_jobs language sql stable security invoker set search_path='' as $$
 select (jsonb_populate_record(null::public.directory_jobs,to_jsonb(j)||jsonb_build_object('feed_text',l.payload->>'feed_text'))).* from public.directory_jobs j join public.directory_source_jobs l on l.source_id=j.primary_source_id and l.external_id=j.primary_external_id where j.is_active and j.merged_into is null and j.processed_hash is distinct from j.feed_hash order by j.first_seen_at,j.id limit 20
$$;
revoke all on function public.directory_pending_jobs() from public,anon,authenticated;
grant execute on function public.directory_pending_jobs() to service_role;

create function public.finish_directory_run(p_run_id bigint,p_stats jsonb,p_error text default null) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(742091);
 update public.directory_runs set status=case when p_error is null then 'complete' else 'partial' end,error=p_error,finished_at=now(),
 feed_seen=(p_stats->>'feed_seen')::integer,changed=(p_stats->>'changed')::integer,ai_completed=(p_stats->>'ai_completed')::integer,
 input_tokens=(p_stats->>'input_tokens')::integer,output_tokens=(p_stats->>'output_tokens')::integer,estimated_cost_usd=(p_stats->>'estimated_cost_usd')::numeric where id=p_run_id;
 update public.directory_settings set running_until=null,last_error=p_error,
 next_feed_at=coalesce((select min(next_feed_at) from public.directory_sources where enabled and removed_at is null),'9999-12-31'::timestamptz),
 last_feed_at=coalesce((select max(last_feed_at) from public.directory_sources),last_feed_at) where id;
end $$;
revoke all on function public.finish_directory_run(bigint,jsonb,text) from public,anon,authenticated;
grant execute on function public.finish_directory_run(bigint,jsonb,text) to service_role;

create function public.directory_card_counts() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('live',count(*),'pending',count(*)filter(where processed_hash is distinct from feed_hash))
 from public.directory_jobs where is_active and merged_into is null and coalesce(closes_at,posted_at+interval '720 hours')>now()
$$;
revoke all on function public.directory_card_counts() from public,anon,authenticated;
grant execute on function public.directory_card_counts() to service_role;
