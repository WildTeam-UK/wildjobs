alter table public.employers
add column logo_url text,
add column logo_source_url text,
add column profile_source_url text,
add column enriched_at timestamptz,
add constraint employers_logo_url_valid check (logo_url is null or logo_url ~ '^https://'),
add constraint employers_logo_source_url_valid check (
  logo_source_url is null or logo_source_url ~ '^https://'
),
add constraint employers_profile_source_url_valid check (
  profile_source_url is null or profile_source_url ~ '^https://'
);

alter table public.jobs
add column engagement_type text,
add column source_name text,
add column source_url text,
add constraint jobs_engagement_type_valid check (
  engagement_type is null or engagement_type in ('paid', 'volunteer')
),
add constraint jobs_source_url_valid check (
  source_url is null or source_url ~ '^https://'
),
add constraint jobs_source_name_length check (
  source_name is null or char_length(source_name) between 1 and 160
);

alter table public.job_source_records
add column employer_id bigint references public.employers(id) on delete set null,
add column application_url text,
add column employer_website_url text,
add column detail_text text,
add column detail_content_hash text,
add column detail_fetched_at timestamptz,
add column enriched_content_hash text,
add column enrichment_status text not null default 'pending',
add column enrichment_attempts smallint not null default 0,
add column enrichment_last_attempted_at timestamptz,
add column enrichment_completed_at timestamptz,
add column enrichment_error_code text,
add constraint job_source_records_application_url_valid check (
  application_url is null or application_url ~ '^https://'
),
add constraint job_source_records_employer_website_url_valid check (
  employer_website_url is null or employer_website_url ~ '^https://'
),
add constraint job_source_records_detail_text_length check (
  detail_text is null or char_length(detail_text) <= 60000
),
add constraint job_source_records_detail_content_hash_valid check (
  detail_content_hash is null or detail_content_hash ~ '^[a-f0-9]{64}$'
),
add constraint job_source_records_enriched_content_hash_valid check (
  enriched_content_hash is null or enriched_content_hash ~ '^[a-f0-9]{64}$'
),
add constraint job_source_records_enrichment_status_valid check (
  enrichment_status in ('pending', 'running', 'complete', 'needs_review', 'failed', 'skipped')
),
add constraint job_source_records_enrichment_attempts_valid check (
  enrichment_attempts between 0 and 3
),
add constraint job_source_records_enrichment_error_code_valid check (
  enrichment_error_code is null
  or enrichment_error_code in (
    'unsupported_source',
    'source_unavailable',
    'invalid_source_page',
    'detail_too_large',
    'ai_unavailable',
    'ai_invalid_output',
    'persistence_failed'
  )
);

create index job_source_records_pending_enrichment_idx
on public.job_source_records (enrichment_status, enrichment_attempts, first_seen_at)
where job_id is null and mapping_status in ('unmapped', 'possible_duplicate');

create index job_source_records_employer_id_idx
on public.job_source_records (employer_id)
where employer_id is not null;

create table public.source_enrichment_runs (
  id bigint generated always as identity primary key,
  source_record_id bigint not null references public.job_source_records(id) on delete cascade,
  trigger_type text not null,
  status text not null default 'started',
  content_hash text,
  source_page_fetched boolean not null default false,
  employer_page_fetched boolean not null default false,
  ai_attempted boolean not null default false,
  ai_model text,
  ai_generation_id text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  fields_resolved smallint not null default 0,
  fields_unresolved smallint not null default 0,
  error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint source_enrichment_runs_trigger_valid check (
    trigger_type in ('automation', 'manual')
  ),
  constraint source_enrichment_runs_status_valid check (
    status in ('started', 'completed', 'needs_review', 'failed', 'skipped')
  ),
  constraint source_enrichment_runs_content_hash_valid check (
    content_hash is null or content_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint source_enrichment_runs_counts_valid check (
    input_tokens >= 0
    and output_tokens >= 0
    and fields_resolved >= 0
    and fields_unresolved >= 0
  ),
  constraint source_enrichment_runs_finish_valid check (
    (status = 'started' and finished_at is null)
    or (status <> 'started' and finished_at is not null and finished_at >= started_at)
  ),
  constraint source_enrichment_runs_ai_valid check (
    ai_attempted or (ai_model is null and ai_generation_id is null and input_tokens = 0 and output_tokens = 0)
  )
);

create unique index source_enrichment_runs_one_active_idx
on public.source_enrichment_runs (source_record_id)
where status = 'started';

create index source_enrichment_runs_recent_idx
on public.source_enrichment_runs (started_at desc);

alter table public.source_enrichment_runs enable row level security;

revoke all on table public.source_enrichment_runs from public, anon, authenticated;
grant select on table public.source_enrichment_runs to authenticated;
grant all on table public.source_enrichment_runs to service_role;
grant usage, select on sequence public.source_enrichment_runs_id_seq to service_role;

create policy "Staff can read enrichment runs"
on public.source_enrichment_runs for select
to authenticated
using (
  exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
      and is_active
  )
);

create table public.employer_field_evidence (
  employer_id bigint not null references public.employers(id) on delete cascade,
  field_name text not null,
  value text not null,
  evidence_text text,
  source_url text not null,
  extraction_method text not null,
  confidence smallint not null,
  extractor_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (employer_id, field_name),
  constraint employer_field_evidence_field_valid check (
    field_name in ('website_url', 'logo_url', 'focus', 'mission', 'overview', 'culture', 'locations', 'benefits')
  ),
  constraint employer_field_evidence_value_valid check (char_length(value) between 1 and 4000),
  constraint employer_field_evidence_text_valid check (
    evidence_text is null or char_length(evidence_text) <= 1000
  ),
  constraint employer_field_evidence_source_url_valid check (source_url ~ '^https://'),
  constraint employer_field_evidence_method_valid check (
    extraction_method in ('deterministic', 'ai', 'manual')
  ),
  constraint employer_field_evidence_confidence_valid check (confidence between 1 and 100),
  constraint employer_field_evidence_version_valid check (char_length(extractor_version) between 1 and 80)
);

alter table public.employer_field_evidence enable row level security;

revoke all on table public.employer_field_evidence from public, anon, authenticated;
grant select on table public.employer_field_evidence to authenticated;
grant all on table public.employer_field_evidence to service_role;

create policy "Staff can read employer field evidence"
on public.employer_field_evidence for select
to authenticated
using (
  exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
      and is_active
  )
);

alter table public.job_source_field_evidence
drop constraint job_source_field_evidence_field_valid,
drop constraint job_source_field_evidence_source_kind_valid,
drop constraint job_source_field_evidence_value_valid;

alter table public.job_source_field_evidence
add constraint job_source_field_evidence_field_valid check (
  field_name in (
    'workplace_type',
    'contract_type',
    'hours_type',
    'experience_level',
    'salary_text',
    'engagement_type',
    'location_text',
    'application_url',
    'employer_website_url',
    'employer_name',
    'closes_at'
  )
),
add constraint job_source_field_evidence_source_kind_valid check (
  source_kind in ('feed', 'source_page', 'employer_site', 'document', 'staff')
),
add constraint job_source_field_evidence_value_valid check (
  value is null
  or (field_name = 'workplace_type' and value in ('remote', 'hybrid', 'on_site'))
  or (
    field_name = 'contract_type'
    and value in ('permanent', 'fixed_term', 'temporary', 'internship', 'apprenticeship')
  )
  or (field_name = 'hours_type' and value in ('full_time', 'part_time', 'flexible'))
  or (
    field_name = 'experience_level'
    and value in ('entry', 'developing', 'experienced', 'leadership', 'open')
  )
  or (field_name = 'engagement_type' and value in ('paid', 'volunteer'))
  or (field_name = 'closes_at' and value ~ '^\d{4}-\d{2}-\d{2}$')
  or (field_name in ('application_url', 'employer_website_url') and value ~ '^https://')
  or (
    field_name in ('salary_text', 'location_text', 'employer_name')
    and char_length(value) between 1 and 500
  )
);

update public.jobs as job
set source_url = source_record.canonical_url,
    source_name = source.name
from public.job_source_records as source_record
join public.job_sources as source on source.id = source_record.source_id
where source_record.job_id = job.id
  and job.source_url is null;

drop function public.create_manual_job_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, date, date
);

create or replace function public.create_manual_job_draft(
  p_source_id bigint,
  p_canonical_url text,
  p_employer_name text,
  p_employer_slug text,
  p_employer_website_url text,
  p_job_slug text,
  p_title text,
  p_summary text,
  p_description text,
  p_responsibilities text,
  p_requirements text,
  p_location_text text,
  p_country_code text,
  p_workplace_type text,
  p_contract_type text,
  p_hours_type text,
  p_experience_level text,
  p_salary_text text,
  p_application_url text,
  p_posted_at date,
  p_closes_at date,
  p_engagement_type text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_employer_id bigint;
  v_job_id bigint;
  v_source_name text;
  v_source_record_id bigint;
  v_source_record_job_id bigint;
  v_source_record_status text;
  v_source_record_employer_id bigint;
begin
  if not exists (
    select 1 from public.staff_members
    where user_id = v_actor_id and is_active and role = 'admin'
  ) then
    raise insufficient_privilege using message = 'Administrator access is required.';
  end if;

  select name into v_source_name
  from public.job_sources
  where id = p_source_id and is_active;

  if v_source_name is null then
    raise foreign_key_violation using message = 'Choose an active approved source.';
  end if;

  if p_closes_at < current_date then
    raise check_violation using message = 'The closing date must not be in the past.';
  end if;

  select id, job_id, mapping_status, employer_id
  into v_source_record_id, v_source_record_job_id, v_source_record_status, v_source_record_employer_id
  from public.job_source_records
  where source_id = p_source_id and canonical_url = p_canonical_url
  for update;

  if v_source_record_id is not null
    and (v_source_record_job_id is not null or v_source_record_status not in ('unmapped', 'possible_duplicate'))
  then
    raise unique_violation using message = 'This source vacancy is already registered.';
  end if;

  v_employer_id := v_source_record_employer_id;

  if v_employer_id is null then
    select id into v_employer_id
    from public.employers
    where lower(name) = lower(trim(p_employer_name))
    order by id
    limit 1;
  end if;

  if v_employer_id is null then
    insert into public.employers (slug, name, status, website_url)
    values (p_employer_slug, trim(p_employer_name), 'draft', p_employer_website_url)
    returning id into v_employer_id;
  elsif p_employer_website_url is not null then
    update public.employers
    set website_url = coalesce(website_url, p_employer_website_url),
        updated_at = now()
    where id = v_employer_id;
  end if;

  insert into public.jobs (
    slug, employer_id, title, summary, description, responsibilities, requirements, status,
    location_text, country_code, workplace_type, contract_type, hours_type, experience_level,
    salary_text, engagement_type, application_url, source_name, source_url, posted_at, closes_at
  )
  values (
    p_job_slug, v_employer_id, trim(p_title), trim(p_summary), trim(p_description),
    nullif(trim(p_responsibilities), ''), nullif(trim(p_requirements), ''), 'in_review',
    trim(p_location_text), upper(p_country_code), nullif(p_workplace_type, ''),
    nullif(p_contract_type, ''), nullif(p_hours_type, ''), nullif(p_experience_level, ''),
    nullif(trim(p_salary_text), ''), p_engagement_type, p_application_url, v_source_name,
    p_canonical_url, p_posted_at, p_closes_at
  )
  returning id into v_job_id;

  if v_source_record_id is null then
    insert into public.job_source_records (
      source_id, job_id, canonical_url, application_url, employer_id, mapping_status, verified_at
    )
    values (
      p_source_id, v_job_id, p_canonical_url, p_application_url, v_employer_id, 'mapped', now()
    );
  else
    update public.job_source_records
    set job_id = v_job_id,
        employer_id = v_employer_id,
        application_url = p_application_url,
        mapping_status = 'mapped',
        verified_at = now()
    where id = v_source_record_id;
  end if;

  insert into public.moderation_events (
    job_id, actor_user_id, action, next_status, review_note
  )
  values (
    v_job_id, v_actor_id, 'created', 'in_review',
    'Created manually from an approved vacancy source.'
  );

  return v_job_id;
end;
$$;

revoke execute on function public.create_manual_job_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, date, date, text
) from public, anon;

grant execute on function public.create_manual_job_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, date, date, text
) to authenticated;

drop function public.update_job_review_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, date, date, text, text, text, text
);

create function public.update_job_review_draft(
  p_job_id bigint,
  p_job_slug text,
  p_title text,
  p_summary text,
  p_description text,
  p_responsibilities text,
  p_requirements text,
  p_location_text text,
  p_country_code text,
  p_workplace_type text,
  p_contract_type text,
  p_hours_type text,
  p_experience_level text,
  p_salary_text text,
  p_application_url text,
  p_posted_at date,
  p_closes_at date,
  p_canonical_url text,
  p_employer_website_url text,
  p_employer_mission text,
  p_employer_overview text,
  p_engagement_type text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_employer_id bigint;
  v_previous_status text;
begin
  if not exists (
    select 1 from public.staff_members
    where user_id = v_actor_id and is_active and role in ('admin', 'reviewer')
  ) then
    raise insufficient_privilege using message = 'Active staff access is required.';
  end if;

  select employer_id, status into v_employer_id, v_previous_status
  from public.jobs
  where id = p_job_id
  for update;

  if v_employer_id is null then
    raise no_data_found using message = 'The vacancy could not be found.';
  end if;
  if v_previous_status not in ('draft', 'in_review') then
    raise check_violation using message = 'Only unpublished review drafts can be edited.';
  end if;
  if p_closes_at < current_date then
    raise check_violation using message = 'The closing date must not be in the past.';
  end if;

  update public.employers
  set website_url = p_employer_website_url,
      mission = nullif(trim(p_employer_mission), ''),
      overview = nullif(trim(p_employer_overview), ''),
      status = 'in_review',
      updated_at = now()
  where id = v_employer_id;

  update public.jobs
  set slug = p_job_slug,
      title = trim(p_title),
      summary = trim(p_summary),
      description = trim(p_description),
      responsibilities = nullif(trim(p_responsibilities), ''),
      requirements = nullif(trim(p_requirements), ''),
      status = 'in_review',
      location_text = trim(p_location_text),
      country_code = upper(p_country_code),
      workplace_type = nullif(p_workplace_type, ''),
      engagement_type = p_engagement_type,
      contract_type = nullif(p_contract_type, ''),
      hours_type = nullif(p_hours_type, ''),
      experience_level = nullif(p_experience_level, ''),
      salary_text = nullif(trim(p_salary_text), ''),
      application_url = p_application_url,
      source_url = p_canonical_url,
      posted_at = p_posted_at,
      closes_at = p_closes_at,
      updated_at = now()
  where id = p_job_id;

  update public.job_source_records
  set canonical_url = p_canonical_url,
      application_url = p_application_url,
      verified_at = now(),
      updated_at = now()
  where id = (
    select id from public.job_source_records
    where job_id = p_job_id
    order by created_at
    limit 1
  );

  if not found then
    raise check_violation using message = 'The vacancy needs a source record before review.';
  end if;

  insert into public.moderation_events (
    job_id, actor_user_id, action, previous_status, next_status, review_note
  )
  values (
    p_job_id, v_actor_id, 'updated', v_previous_status, 'in_review',
    'Vacancy and employer review details updated.'
  );

  return p_job_id;
end;
$$;

revoke execute on function public.update_job_review_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, date, date, text, text, text, text, text
) from public, anon;

grant execute on function public.update_job_review_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, date, date, text, text, text, text, text
) to authenticated;
