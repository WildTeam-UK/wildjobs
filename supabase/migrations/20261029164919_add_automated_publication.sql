alter table public.job_sources
add column default_country_code text,
add constraint job_sources_default_country_code_valid check (
  default_country_code is null or default_country_code ~ '^[A-Z]{2}$'
);

update public.job_sources
set default_country_code = 'GB'
where authoritative_base_url ~ '^https://([^/]+\.)?(countryside-jobs\.com|wwt\.org\.uk)(/|$)';

alter table public.job_source_records
add column enrichment_policy_version text,
add column automation_status text not null default 'pending',
add column automation_blockers text[] not null default '{}',
add column automation_score smallint,
add column automation_evaluated_at timestamptz,
add column automation_policy_version text,
add constraint job_source_records_enrichment_policy_version_valid check (
  enrichment_policy_version is null
  or char_length(enrichment_policy_version) between 1 and 80
),
add constraint job_source_records_automation_status_valid check (
  automation_status in ('pending', 'blocked', 'ready', 'published', 'failed')
),
add constraint job_source_records_automation_score_valid check (
  automation_score is null or automation_score between 0 and 100
),
add constraint job_source_records_automation_policy_version_valid check (
  automation_policy_version is null
  or char_length(automation_policy_version) between 1 and 80
),
add constraint job_source_records_automation_evaluation_valid check (
  (
    automation_status = 'pending'
    and automation_score is null
    and automation_evaluated_at is null
    and automation_policy_version is null
  )
  or (
    automation_status <> 'pending'
    and automation_score is not null
    and automation_evaluated_at is not null
    and automation_policy_version is not null
  )
);

create index job_source_records_automation_queue_idx
on public.job_source_records (automation_status, automation_evaluated_at, id)
where job_id is null and mapping_status in ('unmapped', 'possible_duplicate');

alter table public.source_enrichment_runs
add column ai_skip_reason text,
add constraint source_enrichment_runs_ai_skip_reason_valid check (
  ai_skip_reason is null or ai_skip_reason in ('disabled', 'daily_limit', 'not_needed')
),
add constraint source_enrichment_runs_ai_skip_consistent check (
  not ai_attempted or ai_skip_reason is null
);

create table public.automation_publication_decisions (
  id bigint generated always as identity primary key,
  source_record_id bigint not null references public.job_source_records(id) on delete cascade,
  job_id bigint references public.jobs(id) on delete set null,
  mode text not null,
  decision text not null,
  blocker_codes text[] not null default '{}',
  score smallint not null,
  policy_version text not null,
  field_confidences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint automation_publication_decisions_mode_valid check (
    mode in ('shadow', 'live')
  ),
  constraint automation_publication_decisions_decision_valid check (
    decision in ('blocked', 'ready', 'published', 'failed')
  ),
  constraint automation_publication_decisions_score_valid check (
    score between 0 and 100
  ),
  constraint automation_publication_decisions_policy_version_valid check (
    char_length(policy_version) between 1 and 80
  ),
  constraint automation_publication_decisions_confidences_valid check (
    jsonb_typeof(field_confidences) = 'object'
  ),
  constraint automation_publication_decisions_outcome_valid check (
    (decision = 'blocked' and cardinality(blocker_codes) > 0)
    or (decision <> 'blocked' and cardinality(blocker_codes) = 0)
  )
);

create index automation_publication_decisions_source_record_idx
on public.automation_publication_decisions (source_record_id, created_at desc);

create index automation_publication_decisions_job_id_idx
on public.automation_publication_decisions (job_id)
where job_id is not null;

create index automation_publication_decisions_recent_idx
on public.automation_publication_decisions (created_at desc);

alter table public.automation_publication_decisions enable row level security;

revoke all on table public.automation_publication_decisions from public, anon, authenticated;
grant select on table public.automation_publication_decisions to authenticated;
grant all on table public.automation_publication_decisions to service_role;
grant usage, select on sequence public.automation_publication_decisions_id_seq to service_role;

create policy "Staff can read automation publication decisions"
on public.automation_publication_decisions for select
to authenticated
using (
  exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
      and is_active
  )
);

alter table public.moderation_events
add column actor_type text not null default 'staff',
alter column actor_user_id drop not null,
add constraint moderation_events_actor_type_valid check (
  actor_type in ('staff', 'automation')
),
add constraint moderation_events_actor_valid check (
  (actor_type = 'staff' and actor_user_id is not null)
  or (actor_type = 'automation' and actor_user_id is null)
);

alter table public.jobs
drop constraint jobs_reviewed_content_complete;

alter table public.jobs
add constraint jobs_reviewed_content_complete check (
  status not in ('published', 'expired', 'withdrawn')
  or (
    summary is not null
    and description is not null
    and location_text is not null
    and application_url is not null
    and closes_at is not null
    and published_at is not null
  )
);

create function public.publish_automated_source_record(
  p_source_record_id bigint,
  p_job_slug text,
  p_policy_version text,
  p_score smallint
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_application_url text;
  v_canonical_url text;
  v_closes_at date;
  v_contract_type text;
  v_country_code text;
  v_description text;
  v_employer_id bigint;
  v_employer_name text;
  v_engagement_type text;
  v_experience_level text;
  v_hours_type text;
  v_job_id bigint;
  v_location_text text;
  v_posted_at date;
  v_salary_text text;
  v_source_name text;
  v_summary text;
  v_title text;
  v_workplace_type text;
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Service access is required.';
  end if;

  select
    source_record.canonical_url,
    source_record.application_url,
    source_record.closes_at,
    source_record.employer_id,
    source_record.employer_name,
    source_record.location_text,
    least(source_record.source_updated_at::date, current_date),
    source_record.source_title,
    source.name,
    source.default_country_code,
    left(coalesce(nullif(trim(source_record.summary), ''), trim(source_record.detail_text)), 500),
    trim(source_record.detail_text)
  into
    v_canonical_url,
    v_application_url,
    v_closes_at,
    v_employer_id,
    v_employer_name,
    v_location_text,
    v_posted_at,
    v_title,
    v_source_name,
    v_country_code,
    v_summary,
    v_description
  from public.job_source_records as source_record
  join public.job_sources as source on source.id = source_record.source_id
  where source_record.id = p_source_record_id
    and source_record.job_id is null
    and source_record.mapping_status = 'unmapped'
    and source_record.enrichment_status in ('complete', 'skipped')
    and source_record.automation_status = 'ready'
    and source_record.automation_policy_version = p_policy_version
    and source.is_active
    and source.source_type in ('feed', 'api')
  for update of source_record;

  if v_employer_id is null then
    raise check_violation using message = 'The source record is not ready for automated publication.';
  end if;

  if v_closes_at < current_date
    or v_application_url !~ '^https://'
    or v_canonical_url !~ '^https://'
    or v_country_code !~ '^[A-Z]{2}$'
    or char_length(coalesce(v_title, '')) < 2
    or char_length(coalesce(v_summary, '')) < 20
    or char_length(coalesce(v_description, '')) < 80
    or char_length(coalesce(v_location_text, '')) < 2
  then
    raise check_violation using message = 'A required publication fact is missing or invalid.';
  end if;

  if not exists (
    select 1
    from public.employers
    where id = v_employer_id
      and status <> 'archived'
      and website_url ~ '^https://'
      and nullif(trim(mission), '') is not null
      and nullif(trim(overview), '') is not null
  ) then
    raise check_violation using message = 'The employer profile is not ready for automated publication.';
  end if;

  if exists (
    select 1
    from public.jobs
    where application_url = v_application_url
      or source_url = v_canonical_url
  ) then
    raise unique_violation using message = 'This vacancy is already registered.';
  end if;

  select value into v_engagement_type
  from public.job_source_field_evidence
  where source_record_id = p_source_record_id
    and field_name = 'engagement_type'
    and resolution_status = 'extracted'
    and confidence >= 80;

  if v_engagement_type is null then
    raise check_violation using message = 'Paid or volunteer evidence is required.';
  end if;

  select value into v_contract_type
  from public.job_source_field_evidence
  where source_record_id = p_source_record_id
    and field_name = 'contract_type'
    and resolution_status = 'extracted'
    and confidence >= 70;

  select value into v_hours_type
  from public.job_source_field_evidence
  where source_record_id = p_source_record_id
    and field_name = 'hours_type'
    and resolution_status = 'extracted'
    and confidence >= 70;

  select value into v_experience_level
  from public.job_source_field_evidence
  where source_record_id = p_source_record_id
    and field_name = 'experience_level'
    and resolution_status = 'extracted'
    and confidence >= 70;

  select value into v_salary_text
  from public.job_source_field_evidence
  where source_record_id = p_source_record_id
    and field_name = 'salary_text'
    and resolution_status = 'extracted'
    and confidence >= 70;

  select value into v_workplace_type
  from public.job_source_field_evidence
  where source_record_id = p_source_record_id
    and field_name = 'workplace_type'
    and resolution_status = 'extracted'
    and confidence >= 70;

  insert into public.jobs (
    slug,
    employer_id,
    title,
    summary,
    description,
    status,
    location_text,
    country_code,
    workplace_type,
    contract_type,
    hours_type,
    experience_level,
    salary_text,
    engagement_type,
    application_url,
    source_name,
    source_url,
    posted_at,
    closes_at,
    published_at
  )
  values (
    p_job_slug,
    v_employer_id,
    trim(v_title),
    trim(v_summary),
    trim(v_description),
    'published',
    trim(v_location_text),
    v_country_code,
    v_workplace_type,
    v_contract_type,
    v_hours_type,
    v_experience_level,
    v_salary_text,
    v_engagement_type,
    v_application_url,
    v_source_name,
    v_canonical_url,
    v_posted_at,
    v_closes_at,
    now()
  )
  returning id into v_job_id;

  update public.employers
  set status = 'published',
      reviewed_at = coalesce(reviewed_at, now()),
      published_at = coalesce(published_at, now()),
      updated_at = now()
  where id = v_employer_id;

  update public.job_source_records
  set job_id = v_job_id,
      mapping_status = 'mapped',
      verified_at = now(),
      automation_status = 'published',
      automation_blockers = '{}',
      automation_score = p_score,
      automation_evaluated_at = now(),
      automation_policy_version = p_policy_version,
      updated_at = now()
  where id = p_source_record_id;

  insert into public.moderation_events (
    job_id, actor_type, action, next_status, review_note
  )
  values
    (
      v_job_id,
      'automation',
      'created',
      'published',
      'Created automatically from an approved source after evidence checks.'
    ),
    (
      v_job_id,
      'automation',
      'published',
      'published',
      'Published automatically under policy ' || p_policy_version || '.'
    );

  insert into public.automation_publication_decisions (
    source_record_id,
    job_id,
    mode,
    decision,
    score,
    policy_version
  )
  values (
    p_source_record_id,
    v_job_id,
    'live',
    'published',
    p_score,
    p_policy_version
  );

  return v_job_id;
end;
$$;

revoke execute on function public.publish_automated_source_record(bigint, text, text, smallint)
from public, anon, authenticated;
grant execute on function public.publish_automated_source_record(bigint, text, text, smallint)
to service_role;
