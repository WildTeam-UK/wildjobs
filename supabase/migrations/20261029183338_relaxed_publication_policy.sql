alter table public.employers
add column ai_summary text,
add column ai_summary_source_url text,
add column ai_summary_generated_at timestamptz,
add constraint employers_ai_summary_source_url_valid check (
  ai_summary_source_url is null or ai_summary_source_url ~ '^https://'
),
add constraint employers_ai_summary_consistent check (
  (ai_summary is null and ai_summary_source_url is null and ai_summary_generated_at is null)
  or (nullif(trim(ai_summary), '') is not null and ai_summary_source_url is not null and ai_summary_generated_at is not null)
);

with generated_profiles as (
  select distinct on (evidence.employer_id)
    evidence.employer_id,
    evidence.source_url,
    evidence.updated_at,
    evidence.value
  from public.employer_field_evidence as evidence
  where evidence.extraction_method = 'ai'
    and evidence.field_name in ('overview', 'mission')
  order by evidence.employer_id,
    case evidence.field_name when 'overview' then 0 else 1 end,
    evidence.updated_at desc
)
update public.employers as employer
set ai_summary = nullif(trim(generated_profiles.value), ''),
    ai_summary_source_url = generated_profiles.source_url,
    ai_summary_generated_at = coalesce(employer.enriched_at, generated_profiles.updated_at),
    mission = case
      when exists (
        select 1 from public.employer_field_evidence
        where employer_id = employer.id
          and field_name = 'mission'
          and extraction_method = 'ai'
      ) then null
      else employer.mission
    end,
    overview = case
      when exists (
        select 1 from public.employer_field_evidence
        where employer_id = employer.id
          and field_name = 'overview'
          and extraction_method = 'ai'
      ) then null
      else employer.overview
    end
from generated_profiles
where employer.id = generated_profiles.employer_id
  and employer.reviewed_at is null
  and nullif(trim(generated_profiles.value), '') is not null;

alter table public.employers
drop constraint employers_publication_complete;

alter table public.employers
add constraint employers_publication_complete check (
  status <> 'published' or published_at is not null
);

alter table public.job_source_records
add column ai_summary text,
add column ai_summary_generated_at timestamptz,
add constraint job_source_records_ai_summary_consistent check (
  (ai_summary is null and ai_summary_generated_at is null)
  or (nullif(trim(ai_summary), '') is not null and ai_summary_generated_at is not null)
);

alter table public.jobs
add column expires_at date,
add column summary_source text not null default 'source',
add constraint jobs_summary_source_valid check (
  summary_source in ('source', 'ai', 'excerpt')
);

update public.jobs
set expires_at = coalesce(closes_at, published_at::date + 30, created_at::date + 30);

alter table public.jobs
drop constraint jobs_reviewed_content_complete;

alter table public.jobs
add constraint jobs_reviewed_content_complete check (
  status not in ('published', 'expired', 'withdrawn')
  or (
    summary is not null
    and description is not null
    and application_url is not null
    and (closes_at is not null or expires_at is not null)
    and published_at is not null
  )
);

create index jobs_public_expiry_idx
on public.jobs (expires_at, published_at desc, id)
where status = 'published' and withdrawn_at is null;

drop policy if exists "Anonymous visitors can read current jobs" on public.jobs;

create policy "Anonymous visitors can read current jobs"
on public.jobs for select
to anon
using (
  status = 'published'
  and published_at <= now()
  and (
    closes_at >= current_date
    or (closes_at is null and expires_at >= current_date)
  )
  and withdrawn_at is null
);

drop policy if exists "Signed in users can read permitted jobs" on public.jobs;

create policy "Signed in users can read permitted jobs"
on public.jobs for select
to authenticated
using (
  (
    status = 'published'
    and published_at <= now()
    and (
      closes_at >= current_date
      or (closes_at is null and expires_at >= current_date)
    )
    and withdrawn_at is null
  )
  or private.candidate_has_saved_job(jobs.id)
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create or replace function public.publish_automated_source_record(
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
  v_engagement_type text;
  v_experience_level text;
  v_expires_at date;
  v_hours_type text;
  v_job_id bigint;
  v_location_text text;
  v_posted_at date;
  v_salary_text text;
  v_source_name text;
  v_summary text;
  v_summary_source text;
  v_title text;
  v_workplace_type text;
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Service access is required.';
  end if;

  select
    source_record.canonical_url,
    coalesce(nullif(trim(source_record.application_url), ''), source_record.canonical_url),
    source_record.closes_at,
    coalesce(source_record.closes_at, source_record.first_seen_at::date + 30),
    source_record.employer_id,
    source_record.location_text,
    coalesce(least(source_record.source_updated_at::date, current_date), source_record.first_seen_at::date),
    source_record.source_title,
    source.name,
    source.default_country_code,
    case
      when char_length(coalesce(trim(source_record.summary), '')) >= 20
        then left(trim(source_record.summary), 500)
      when char_length(coalesce(trim(source_record.ai_summary), '')) >= 20
        then left(trim(source_record.ai_summary), 500)
      else left(trim(source_record.detail_text), 500)
    end,
    case
      when char_length(coalesce(trim(source_record.summary), '')) >= 20 then 'source'
      when char_length(coalesce(trim(source_record.ai_summary), '')) >= 20 then 'ai'
      else 'excerpt'
    end,
    trim(source_record.detail_text)
  into
    v_canonical_url,
    v_application_url,
    v_closes_at,
    v_expires_at,
    v_employer_id,
    v_location_text,
    v_posted_at,
    v_title,
    v_source_name,
    v_country_code,
    v_summary,
    v_summary_source,
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

  if v_expires_at < current_date
    or v_application_url !~ '^https://'
    or v_canonical_url !~ '^https://'
    or v_country_code !~ '^[A-Z]{2}$'
    or char_length(coalesce(v_title, '')) < 2
    or char_length(coalesce(v_summary, '')) < 20
    or char_length(coalesce(v_description, '')) < 80
  then
    raise check_violation using message = 'A required publication fact is missing or invalid.';
  end if;

  if not exists (
    select 1
    from public.employers
    where id = v_employer_id
      and status <> 'archived'
  ) then
    raise check_violation using message = 'The employer record is unavailable.';
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
    summary_source,
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
    expires_at,
    published_at
  )
  values (
    p_job_slug,
    v_employer_id,
    trim(v_title),
    trim(v_summary),
    v_summary_source,
    trim(v_description),
    'published',
    nullif(trim(v_location_text), ''),
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
    v_expires_at,
    now()
  )
  returning id into v_job_id;

  update public.employers
  set status = 'published',
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
      'Created automatically from an approved source after essential listing checks.'
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
