-- Approved canonical skills and benefits, extracted in the existing enrichment batch.
alter table public.directory_jobs
 add column skill_slugs text[] not null default '{}',
 add column benefit_slugs text[] not null default '{}',
 add column attributes_version integer not null default 0;
alter table public.directory_jobs
 add constraint directory_skill_terms_valid check(cardinality(skill_slugs)<=6 and skill_slugs <@ array['project-management','stakeholder-engagement','grant-writing','fundraising','gis','data-analysis','field-surveys','species-identification','habitat-management','ecological-monitoring','monitoring-evaluation','research','report-writing','policy-advocacy','environmental-education','communications','financial-management','people-management','volunteer-management','law-compliance','animal-care','health-safety','practical-conservation','software-development','information-security','administration']::text[]),
 add constraint directory_benefit_terms_valid check(cardinality(benefit_slugs)<=5 and benefit_slugs <@ array['flexible-working','paid-leave','pension','health-cover','wellbeing-support','training-development','family-leave','paid-sick-leave','life-assurance','travel-support','relocation-support','visa-support','accommodation','employee-discounts','bonus-scheme']::text[]);
comment on column public.directory_jobs.skill_slugs is 'Canonical skills supported by the current source advert. Supporting excerpts remain private in directory_source_jobs.';
comment on column public.directory_jobs.benefit_slugs is 'Benefits offered in this particular advert, not unconditional employer-wide promises.';
grant select(skill_slugs,benefit_slugs,attributes_version) on public.directory_jobs to anon,authenticated;

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
 skill_slugs=case when p->>'attributes_hash'=listing.content_hash and p->>'attributes_version'='1' then array(select jsonb_array_elements_text(coalesce(p->'skill_slugs','[]'))) else '{}' end,
 benefit_slugs=case when p->>'attributes_hash'=listing.content_hash and p->>'attributes_version'='1' then array(select jsonb_array_elements_text(coalesce(p->'benefit_slugs','[]'))) else '{}' end,
 attributes_version=case when p->>'attributes_hash'=listing.content_hash and p->>'attributes_version'='1' then 1 else 0 end,
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


-- Current jobs missing this extraction version are backfilled by the same leased worker.
create or replace function public.directory_pending_source_jobs() returns jsonb
language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(j)||jsonb_build_object(
   'feed_text',l.payload->>'feed_text',
   'source_content_kind',coalesce(l.payload->>'source_content_kind','feed')
 ) order by j.first_seen_at,j.id),'[]'::jsonb)
 from (
   select * from public.directory_jobs where is_active and merged_into is null
    and (processed_hash is distinct from feed_hash or (attributes_version<1 and coalesce(closes_at,posted_at+interval '30 days')>now()))
   order by first_seen_at,id limit 20
 ) j join public.directory_source_jobs l on l.source_id=j.primary_source_id and l.external_id=j.primary_external_id
$$;
revoke all on function public.directory_pending_source_jobs() from public,anon,authenticated;
grant execute on function public.directory_pending_source_jobs() to service_role;

create or replace function public.finish_directory_run(p_run_id bigint,p_stats jsonb,p_error text default null) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform pg_advisory_xact_lock(742091);
 update public.directory_runs set status=case when p_error is null then 'complete' else 'partial' end,error=p_error,finished_at=now(),
 feed_seen=(p_stats->>'feed_seen')::integer,changed=(p_stats->>'changed')::integer,ai_completed=(p_stats->>'ai_completed')::integer,
 input_tokens=(p_stats->>'input_tokens')::integer,output_tokens=(p_stats->>'output_tokens')::integer,estimated_cost_usd=(p_stats->>'estimated_cost_usd')::numeric where id=p_run_id;
 update public.directory_settings set running_until=null,last_error=p_error,
 next_feed_at=case when exists(select 1 from public.directory_jobs where is_active and merged_into is null and attributes_version<1 and coalesce(closes_at,posted_at+interval '30 days')>now()) then now() else coalesce((select min(next_feed_at) from public.directory_sources where enabled and removed_at is null),'9999-12-31'::timestamptz) end,
 last_feed_at=coalesce((select max(last_feed_at) from public.directory_sources),last_feed_at) where id;
end $$;

-- Wake the unchanged heartbeat once; finishing each bounded batch keeps it due while backfill remains.
update public.directory_settings set next_feed_at=now() where id and enabled;
