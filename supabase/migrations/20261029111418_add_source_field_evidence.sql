create table public.job_source_field_evidence (
  source_record_id bigint not null references public.job_source_records(id) on delete cascade,
  field_name text not null,
  resolution_status text not null,
  value text,
  evidence_text text,
  source_kind text not null,
  extraction_method text not null,
  confidence smallint not null default 0,
  extractor_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_record_id, field_name),
  constraint job_source_field_evidence_field_valid check (
    field_name in ('workplace_type', 'contract_type', 'hours_type', 'experience_level', 'salary_text')
  ),
  constraint job_source_field_evidence_status_valid check (
    resolution_status in ('extracted', 'unresolved')
  ),
  constraint job_source_field_evidence_source_kind_valid check (
    source_kind in ('feed', 'source_page', 'document', 'staff')
  ),
  constraint job_source_field_evidence_method_valid check (
    extraction_method in ('deterministic', 'ai', 'manual')
  ),
  constraint job_source_field_evidence_confidence_valid check (confidence between 0 and 100),
  constraint job_source_field_evidence_resolution_valid check (
    (
      resolution_status = 'unresolved'
      and value is null
      and evidence_text is null
      and confidence = 0
    )
    or (
      resolution_status = 'extracted'
      and nullif(trim(value), '') is not null
      and nullif(trim(evidence_text), '') is not null
      and confidence > 0
    )
  ),
  constraint job_source_field_evidence_value_valid check (
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
    or (field_name = 'salary_text' and char_length(value) between 2 and 240)
  ),
  constraint job_source_field_evidence_text_lengths check (
    char_length(extractor_version) between 1 and 80
    and (evidence_text is null or char_length(evidence_text) <= 500)
  )
);

create index job_source_field_evidence_analysis_idx
on public.job_source_field_evidence (field_name, value)
where resolution_status = 'extracted';

alter table public.job_source_field_evidence enable row level security;

revoke all on table public.job_source_field_evidence from public, anon, authenticated;
grant select on table public.job_source_field_evidence to authenticated;
grant all on table public.job_source_field_evidence to service_role;

create policy "Staff can read source field evidence"
on public.job_source_field_evidence for select
to authenticated
using (
  exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
      and is_active
  )
);

create function public.normalise_job_optional_facts()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.workplace_type := nullif(trim(new.workplace_type), '');
  new.contract_type := nullif(trim(new.contract_type), '');
  new.hours_type := nullif(trim(new.hours_type), '');
  new.experience_level := nullif(trim(new.experience_level), '');
  new.salary_text := nullif(trim(new.salary_text), '');
  return new;
end;
$$;

create trigger normalise_job_optional_facts_before_write
before insert or update of workplace_type, contract_type, hours_type, experience_level, salary_text
on public.jobs
for each row execute function public.normalise_job_optional_facts();

revoke execute on function public.normalise_job_optional_facts() from public, anon, authenticated;

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

create or replace function public.publish_job_review_draft(p_job_id bigint)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_employer_id bigint;
  v_job_slug text;
  v_job_status text;
begin
  if not exists (
    select 1
    from public.staff_members
    where user_id = v_actor_id
      and is_active
      and role = 'admin'
  ) then
    raise insufficient_privilege using message = 'Administrator access is required.';
  end if;

  select employer_id, slug, status
  into v_employer_id, v_job_slug, v_job_status
  from public.jobs
  where id = p_job_id
  for update;

  if v_employer_id is null then
    raise no_data_found using message = 'The vacancy could not be found.';
  end if;

  if v_job_status <> 'in_review' then
    raise check_violation using message = 'Only reviewed drafts can be published.';
  end if;

  if not exists (
    select 1
    from public.jobs
    where id = p_job_id
      and nullif(trim(summary), '') is not null
      and nullif(trim(description), '') is not null
      and nullif(trim(location_text), '') is not null
      and application_url is not null
      and closes_at >= current_date
  ) then
    raise check_violation using message = 'Complete every core vacancy field before publication.';
  end if;

  if not exists (
    select 1
    from public.job_source_records
    where job_id = p_job_id
      and canonical_url is not null
      and verified_at is not null
  ) then
    raise check_violation using message = 'Verify an authoritative source before publication.';
  end if;

  if not exists (
    select 1
    from public.employers
    where id = v_employer_id
      and website_url is not null
      and nullif(trim(mission), '') is not null
      and nullif(trim(overview), '') is not null
  ) then
    raise check_violation using message = 'Complete the employer website, mission and overview before publication.';
  end if;

  update public.employers
  set status = 'published',
      reviewed_at = now(),
      published_at = coalesce(published_at, now()),
      updated_at = now()
  where id = v_employer_id;

  update public.jobs
  set status = 'published',
      published_at = now(),
      withdrawn_at = null,
      updated_at = now()
  where id = p_job_id;

  insert into public.moderation_events (
    job_id,
    actor_user_id,
    action,
    previous_status,
    next_status,
    review_note
  )
  values (
    p_job_id,
    v_actor_id,
    'published',
    v_job_status,
    'published',
    'Published after administrator review.'
  );

  return v_job_slug;
end;
$$;
