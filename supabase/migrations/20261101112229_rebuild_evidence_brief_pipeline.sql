-- Additive replacement. Existing jobs, source evidence and moderation history are retained.
alter table public.job_sources
  add column collection_allowed boolean not null default false,
  add column ai_processing_allowed boolean not null default false,
  add column publication_allowed boolean not null default false,
  add column next_import_at timestamptz not null default now(),
  add column http_etag text,
  add column http_last_modified text;

alter table public.job_source_records
  add column source_revision integer not null default 1 check (source_revision > 0),
  add column next_check_at timestamptz,
  add column last_http_status integer,
  add column pipeline_error text;

alter table public.jobs
  add column editorial_brief jsonb not null default '{}'::jsonb,
  add column brief_status text not null default 'legacy' check (brief_status in ('legacy','pending','verified','review')),
  add column brief_source_hash text,
  add column brief_policy_version text,
  add column source_verified_at timestamptz,
  add column indexing_eligible boolean not null default false,
  add column jobposting_eligible boolean not null default false,
  add column staff_reviewed_fields text[] not null default '{}';

create table public.job_source_snapshots (
  id bigint generated always as identity primary key,
  source_record_id bigint not null references public.job_source_records(id) on delete cascade,
  kind text not null check (kind in ('feed','detail','evidence')),
  content_hash text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  unique (source_record_id,kind,content_hash)
);

create table public.job_pipeline_tasks (
  id bigint generated always as identity primary key,
  task_key text not null unique,
  kind text not null check (kind in ('import','verify','enrich','publish')),
  source_id bigint not null references public.job_sources(id) on delete cascade,
  source_record_id bigint references public.job_source_records(id) on delete cascade,
  source_revision integer,
  status text not null default 'pending' check (status in ('pending','running','completed','review','failed','cancelled')),
  attempts integer not null default 0,
  max_attempts integer not null default 3 check (max_attempts between 1 and 5),
  due_at timestamptz not null default now(),
  lease_token uuid,
  lease_expires_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index job_pipeline_tasks_due_idx on public.job_pipeline_tasks(status,due_at,id);
create index job_pipeline_tasks_source_idx on public.job_pipeline_tasks(source_id);
create index job_pipeline_tasks_record_idx on public.job_pipeline_tasks(source_record_id);

create table public.job_brief_versions (
  id bigint generated always as identity primary key,
  source_record_id bigint not null references public.job_source_records(id) on delete cascade,
  source_revision integer not null,
  content_hash text not null,
  policy_version text not null,
  model text not null,
  payload jsonb not null,
  validation_errors text[] not null default '{}',
  review_result jsonb,
  created_at timestamptz not null default now(),
  unique(source_record_id,source_revision,policy_version)
);

create table public.pipeline_ai_usage (
  id uuid primary key default gen_random_uuid(),
  request_key text not null unique,
  source_record_id bigint references public.job_source_records(id) on delete set null,
  purpose text not null check (purpose in ('vacancy','review','course','employer')),
  model text not null,
  status text not null default 'reserved' check (status in ('reserved','completed','unknown')),
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  input_price_per_million numeric,
  output_price_per_million numeric,
  generation_id text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index pipeline_ai_usage_day_idx on public.pipeline_ai_usage(created_at);
create index pipeline_ai_usage_record_idx on public.pipeline_ai_usage(source_record_id);

-- Private operational records are visible to active staff only; no public evidence leakage.
do $$
declare t text;
begin
  foreach t in array array['job_source_snapshots','job_pipeline_tasks','job_brief_versions','pipeline_ai_usage'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('create policy "Active staff can inspect pipeline" on public.%I for select to authenticated using (exists (select 1 from public.staff_members where user_id=(select auth.uid()) and is_active))',t);
  end loop;
end $$;
grant usage,select on sequence public.job_source_snapshots_id_seq,public.job_pipeline_tasks_id_seq,public.job_brief_versions_id_seq to service_role;

create function public.claim_pipeline_task(p_record_id bigint default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare t public.job_pipeline_tasks%rowtype;
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  update public.job_pipeline_tasks set status=case when attempts>=max_attempts then 'failed' else 'pending' end,
    error_code='lease_expired',lease_token=null,lease_expires_at=null,due_at=now()
  where status='running' and lease_expires_at<now();
  select q.* into t from public.job_pipeline_tasks q join public.job_sources s on s.id=q.source_id
  where q.status='pending' and q.due_at<=now() and q.attempts<q.max_attempts
    and s.is_active and s.collection_allowed
    and (p_record_id is null or q.source_record_id=p_record_id)
    and (q.kind not in ('enrich','publish') or s.ai_processing_allowed)
  order by case q.kind when 'publish' then 0 when 'enrich' then 1 when 'verify' then 2 else 3 end,q.due_at,q.id
  for update of q skip locked limit 1;
  if not found then return null; end if;
  update public.job_pipeline_tasks set status='running',attempts=attempts+1,
    lease_token=gen_random_uuid(),lease_expires_at=now()+interval '2 minutes'
  where id=t.id returning * into t;
  return to_jsonb(t);
end $$;

create function public.finish_pipeline_task(p_task_id bigint,p_lease_token uuid,p_status text,p_error text default null)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  if p_status not in ('completed','review','failed','cancelled') then raise check_violation; end if;
  update public.job_pipeline_tasks set
    status=case when p_status='failed' and attempts<max_attempts then 'pending' else p_status end,
    due_at=case when p_status='failed' then now()+make_interval(mins=>least(60,attempts*attempts*5)) else due_at end,
    error_code=p_error,lease_token=null,lease_expires_at=null,
    finished_at=case when p_status='failed' and attempts<max_attempts then null else now() end
  where id=p_task_id and status='running' and lease_token=p_lease_token and lease_expires_at>now();
  return found;
end $$;

create function public.reserve_pipeline_ai(p_request_key text,p_purpose text,p_model text,p_input integer,p_output integer,
  p_request_limit integer,p_input_limit integer,p_output_limit integer,p_record_id bigint default null,
  p_input_price numeric default null,p_output_price numeric default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid; n bigint; i bigint; o bigint;
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  if p_input<1 or p_output<1 or p_request_limit not between 1 and 1000 or p_input_limit not between 1 and 10000000
    or p_output_limit not between 1 and 2000000 then raise check_violation; end if;
  perform pg_advisory_xact_lock(hashtextextended('wildjobs-ai-budget',0));
  if exists(select 1 from public.pipeline_ai_usage where request_key=p_request_key) then return null; end if;
  select count(*),coalesce(sum(input_tokens),0),coalesce(sum(output_tokens),0) into n,i,o
  from public.pipeline_ai_usage where created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if n+1>p_request_limit or i+p_input>p_input_limit or o+p_output>p_output_limit then return null; end if;
  insert into public.pipeline_ai_usage(request_key,purpose,model,input_tokens,output_tokens,source_record_id,input_price_per_million,output_price_per_million)
  values(p_request_key,p_purpose,p_model,p_input,p_output,p_record_id,p_input_price,p_output_price) returning id into v_id;
  return v_id;
end $$;

-- Protect staff corrections, and retain the evidence they superseded.
create function private.protect_pipeline_evidence() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if old.extraction_method='manual' and current_user='service_role' and new is distinct from old then return old; end if;
  if new is distinct from old then
    insert into public.job_source_snapshots(source_record_id,kind,content_hash,payload)
    values(old.source_record_id,'evidence',md5(row_to_json(old)::text),to_jsonb(old)) on conflict do nothing;
  end if;
  return new;
end $$;
-- Staff do not write snapshot tables directly. A definer trigger is narrowly scoped to archiving evidence.
alter function private.protect_pipeline_evidence() security definer;
revoke all on function private.protect_pipeline_evidence() from public,anon,authenticated;
create trigger preserve_pipeline_evidence before update on public.job_source_field_evidence
for each row execute function private.protect_pipeline_evidence();

create function private.track_job_staff_fields() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text;
begin
  if current_user='authenticated' and exists(select 1 from public.staff_members where user_id=(select auth.uid()) and is_active) then
    foreach k in array array['title','summary','description','responsibilities','requirements','location_text','country_code','locality','region','postal_code','workplace_type','engagement_type','contract_type','hours_type','experience_level','salary_text','application_url','posted_at','closes_at'] loop
      if to_jsonb(new)->k is distinct from to_jsonb(old)->k and not k=any(new.staff_reviewed_fields) then
        new.staff_reviewed_fields=array_append(new.staff_reviewed_fields,k);
      end if;
    end loop;
    -- An edit invalidates automated indexing approval until a fresh review.
    new.indexing_eligible=false; new.jobposting_eligible=false;
  end if;
  return new;
end $$;
revoke all on function private.track_job_staff_fields() from public,anon,authenticated;
create trigger track_job_staff_fields before update on public.jobs for each row execute function private.track_job_staff_fields();

-- Existing staff-reviewed records must not be rewritten during the catalogue repair.
update public.jobs j set staff_reviewed_fields=array['title','summary','description','responsibilities','requirements','location_text','country_code','workplace_type','engagement_type','contract_type','hours_type','experience_level','salary_text','application_url','posted_at','closes_at']
where exists(select 1 from public.moderation_events m where m.job_id=j.id and m.actor_type='staff' and m.action in ('updated','approved','published'));

create function public.pipeline_publish_blockers(p_record_id bigint)
returns text[] language plpgsql security invoker set search_path='' as $$
declare r public.job_source_records%rowtype; s public.job_sources%rowtype; j public.jobs%rowtype; b text[]='{}';
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  select * into r from public.job_source_records where id=p_record_id;
  select * into s from public.job_sources where id=r.source_id;
  select * into j from public.jobs where id=r.job_id;
  if r.id is null or j.id is null then return array['draft_missing']; end if;
  if not s.is_active or not s.collection_allowed or not s.ai_processing_allowed or not s.publication_allowed
    or s.permissions_reviewed_at is null or nullif(trim(s.permission_notes),'') is null
    or s.description_display_mode not in ('summary_only','full') then b=array_append(b,'source_permission_unapproved'); end if;
  if j.status not in ('draft','published') then b=array_append(b,'staff_review_in_progress'); end if;
  if r.mapping_status<>'mapped' then b=array_append(b,'duplicate_risk'); end if;
  if j.brief_status<>'verified' or j.brief_source_hash is distinct from r.detail_content_hash then b=array_append(b,'brief_unverified'); end if;
  if r.enrichment_status not in ('complete','skipped') then b=array_append(b,'enrichment_incomplete'); end if;
  if coalesce(j.expires_at,j.closes_at)<current_date or coalesce(j.expires_at,j.closes_at) is null then b=array_append(b,'listing_expired'); end if;
  if r.verified_at is null or r.verified_at<now()-interval '48 hours' then b=array_append(b,'source_stale'); end if;
  if coalesce(j.application_url,'') !~ '^https://' or coalesce(j.source_url,'') !~ '^https://' then b=array_append(b,'application_url_missing'); end if;
  if char_length(coalesce(trim(j.title),''))<2 or char_length(coalesce(trim(j.summary),''))<20
    or char_length(coalesce(trim(j.description),''))<80 then b=array_append(b,'brief_incomplete'); end if;
  if nullif(trim(j.location_text),'') is null or coalesce(j.country_code,'') !~ '^[A-Z]{2}$' then b=array_append(b,'location_missing'); end if;
  if j.engagement_type is null then b=array_append(b,'engagement_missing'); end if;
  if not exists(select 1 from public.employers where id=j.employer_id and status<>'archived') then b=array_append(b,'employer_missing'); end if;
  if not exists(select 1 from public.job_career_areas a join public.career_areas c on c.id=a.career_area_id and c.is_active where a.job_id=j.id) then b=array_append(b,'career_area_missing'); end if;
  if not exists(select 1 from public.job_locations where job_id=j.id) then b=array_append(b,'structured_location_missing'); end if;
  return b;
end $$;

create or replace function public.publish_automated_source_record(p_source_record_id bigint,p_job_slug text,p_policy_version text,p_score smallint)
returns bigint language plpgsql security invoker set search_path='' as $$
declare r public.job_source_records%rowtype; j public.jobs%rowtype; c public.automation_controls%rowtype; b text[]; old_status text;
begin
  if current_user <> 'service_role' then raise insufficient_privilege; end if;
  select * into c from public.automation_controls where id='global' for update;
  if c.auto_publish_enabled is not true or (c.auto_publish_source_record_id is not null and c.auto_publish_source_record_id<>p_source_record_id) then raise insufficient_privilege using message='Live publication is disabled for this record.'; end if;
  select * into r from public.job_source_records where id=p_source_record_id for update;
  perform 1 from public.job_sources where id=r.source_id for share;
  select * into j from public.jobs where id=r.job_id for update;
  if p_policy_version<>'wildteam-brief-v1' or j.brief_policy_version is distinct from p_policy_version then raise check_violation using message='Publication policy is stale.'; end if;
  b=public.pipeline_publish_blockers(p_source_record_id);
  if cardinality(b)>0 then raise check_violation using message=array_to_string(b,','); end if;
  perform pg_advisory_xact_lock(hashtextextended(coalesce(j.source_url,''),0));
  if exists(select 1 from public.jobs where id<>j.id and source_url=j.source_url and status not in ('rejected','withdrawn')) then raise unique_violation; end if;
  old_status=j.status;
  update public.jobs set status='published',published_at=coalesce(published_at,now()),source_verified_at=r.verified_at,
    indexing_eligible=true,updated_at=now() where id=j.id;
  update public.job_source_records set automation_status='published',automation_blockers='{}',automation_score=100,
    automation_evaluated_at=now(),automation_policy_version=p_policy_version where id=r.id;
  insert into public.moderation_events(job_id,actor_type,action,previous_status,next_status,review_note)
  values(j.id,'automation',case when old_status='published' then 'updated' else 'published' end,old_status,'published','Verified WildTeam brief; employer publication remains independent.');
  insert into public.automation_publication_decisions(source_record_id,job_id,mode,decision,score,policy_version)
  values(r.id,j.id,'live','published',100,p_policy_version);
  return j.id;
end $$;

-- Enable public job cards without publishing an incomplete employer profile. Only identity fields are exposed.
create function public.public_job_employer(p_employer_id bigint)
returns table(id bigint,slug text,name text,short_name text,website_url text,logo_url text,overview text,ai_summary text,profile_published boolean)
language sql stable security definer set search_path='' as $$
  select e.id,e.slug,e.name,e.short_name,e.website_url,
    case when e.status='published' then e.logo_url else null end,
    case when e.status='published' then e.overview else null end,
    case when e.status='published' then e.ai_summary else null end,e.status='published'
  from public.employers e where e.id=p_employer_id and e.status<>'archived' and exists(
    select 1 from public.jobs j where j.employer_id=e.id and j.status='published' and j.published_at<=now()
      and j.withdrawn_at is null and coalesce(j.closes_at,j.expires_at)>=current_date
  );
$$;
revoke all on function public.public_job_employer(bigint) from public;
grant execute on function public.public_job_employer(bigint) to anon,authenticated,service_role;

-- Recover dead imports before checking whether an import is in progress.
create or replace function public.claim_periodic_source_import(interval_hours integer default 2)
returns boolean language plpgsql security invoker set search_path='' as $$
declare last_claim timestamptz;
begin
  if current_user<>'service_role' then raise insufficient_privilege; end if;
  if interval_hours not between 1 and 24 then raise check_violation; end if;
  update public.import_runs set status='failed',finished_at=now(),error_summary='Import lease expired; retry is safe.' where status='started' and started_at<now()-interval '15 minutes';
  select last_import_claimed_at into last_claim from public.source_import_automation where id for update;
  update public.source_import_automation set last_heartbeat_at=now(),updated_at=now() where id;
  if last_claim>=now()-make_interval(hours=>interval_hours) or exists(select 1 from public.import_runs where status='started') then return false; end if;
  update public.source_import_automation set last_import_claimed_at=now() where id;
  return true;
end $$;

create function public.pipeline_heartbeat_needed() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.job_sources where is_active and collection_allowed and next_import_at<=now())
    or exists(select 1 from public.job_pipeline_tasks q join public.job_sources s on s.id=q.source_id where s.is_active and s.collection_allowed
      and ((q.status='pending' and q.due_at<=now()) or (q.status='running' and q.lease_expires_at<now())))
    or exists(select 1 from public.source_import_automation where last_course_sync_claimed_at is null or last_course_sync_claimed_at<now()-interval '6 hours');
$$;
revoke all on function public.pipeline_heartbeat_needed() from public,anon,authenticated;

-- No newly introduced privileged function is a public API.
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('claim_pipeline_task','finish_pipeline_task','reserve_pipeline_ai','pipeline_publish_blockers','publish_automated_source_record','claim_periodic_source_import') loop
    execute format('revoke all on function %s from public,anon,authenticated',f);
    execute format('grant execute on function %s to service_role',f);
  end loop;
end $$;
