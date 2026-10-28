create function public.create_manual_job_draft(
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
  p_closes_at date
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

  if not exists (
    select 1
    from public.job_sources
    where id = p_source_id
      and is_active
  ) then
    raise foreign_key_violation using message = 'Choose an active approved source.';
  end if;

  if p_closes_at < current_date then
    raise check_violation using message = 'The closing date must not be in the past.';
  end if;

  if exists (
    select 1
    from public.job_source_records
    where source_id = p_source_id
      and canonical_url = p_canonical_url
  ) then
    raise unique_violation using message = 'This source vacancy is already registered.';
  end if;

  select id
  into v_employer_id
  from public.employers
  where lower(name) = lower(trim(p_employer_name))
  order by id
  limit 1;

  if v_employer_id is null then
    insert into public.employers (
      slug,
      name,
      status,
      website_url
    )
    values (
      p_employer_slug,
      trim(p_employer_name),
      'draft',
      p_employer_website_url
    )
    returning id into v_employer_id;
  end if;

  insert into public.jobs (
    slug,
    employer_id,
    title,
    summary,
    description,
    responsibilities,
    requirements,
    status,
    location_text,
    country_code,
    workplace_type,
    contract_type,
    hours_type,
    experience_level,
    salary_text,
    application_url,
    posted_at,
    closes_at
  )
  values (
    p_job_slug,
    v_employer_id,
    trim(p_title),
    trim(p_summary),
    trim(p_description),
    nullif(trim(p_responsibilities), ''),
    nullif(trim(p_requirements), ''),
    'in_review',
    trim(p_location_text),
    upper(p_country_code),
    p_workplace_type,
    p_contract_type,
    p_hours_type,
    p_experience_level,
    trim(p_salary_text),
    p_application_url,
    p_posted_at,
    p_closes_at
  )
  returning id into v_job_id;

  insert into public.job_source_records (
    source_id,
    job_id,
    canonical_url,
    mapping_status,
    verified_at
  )
  values (
    p_source_id,
    v_job_id,
    p_canonical_url,
    'mapped',
    now()
  );

  insert into public.moderation_events (
    job_id,
    actor_user_id,
    action,
    next_status,
    review_note
  )
  values (
    v_job_id,
    v_actor_id,
    'created',
    'in_review',
    'Created manually from an approved vacancy source.'
  );

  return v_job_id;
end;
$$;

revoke execute on function public.create_manual_job_draft(
  bigint,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  date
) from public, anon;

grant execute on function public.create_manual_job_draft(
  bigint,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  date,
  date
) to authenticated;
