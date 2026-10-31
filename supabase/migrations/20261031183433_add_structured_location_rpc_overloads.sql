-- Keep the existing RPC signatures available while adding the structured-location variants
-- already used by the admin application. PostgreSQL resolves the overload by argument names.

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
  p_location_locality text,
  p_location_region text,
  p_postal_code text,
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
    location_text, locality, region, postal_code, country_code, workplace_type, contract_type,
    hours_type, experience_level, salary_text, engagement_type, application_url, source_name,
    source_url, posted_at, closes_at
  )
  values (
    p_job_slug, v_employer_id, trim(p_title), trim(p_summary), trim(p_description),
    nullif(trim(p_responsibilities), ''), nullif(trim(p_requirements), ''), 'in_review',
    trim(p_location_text), nullif(trim(p_location_locality), ''),
    nullif(trim(p_location_region), ''), nullif(trim(p_postal_code), ''), upper(p_country_code),
    nullif(p_workplace_type, ''), nullif(p_contract_type, ''), nullif(p_hours_type, ''),
    nullif(p_experience_level, ''), nullif(trim(p_salary_text), ''), p_engagement_type,
    p_application_url, v_source_name, p_canonical_url, p_posted_at, p_closes_at
  )
  returning id into v_job_id;

  if v_source_record_id is null then
    insert into public.job_source_records (
      source_id, job_id, canonical_url, application_url, employer_id, mapping_status, verified_at,
      location_text, location_locality, location_region, postal_code, country_code
    )
    values (
      p_source_id, v_job_id, p_canonical_url, p_application_url, v_employer_id, 'mapped', now(),
      trim(p_location_text), nullif(trim(p_location_locality), ''),
      nullif(trim(p_location_region), ''), nullif(trim(p_postal_code), ''), upper(p_country_code)
    );
  else
    update public.job_source_records
    set job_id = v_job_id,
        employer_id = v_employer_id,
        application_url = p_application_url,
        location_text = trim(p_location_text),
        location_locality = nullif(trim(p_location_locality), ''),
        location_region = nullif(trim(p_location_region), ''),
        postal_code = nullif(trim(p_postal_code), ''),
        country_code = upper(p_country_code),
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
  text, text, text, text, text, text, text, text, text, date, date, text
) from public, anon;
grant execute on function public.create_manual_job_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, date, date, text
) to authenticated;

create function public.update_job_review_draft(
  p_job_id bigint,
  p_job_slug text,
  p_title text,
  p_summary text,
  p_description text,
  p_responsibilities text,
  p_requirements text,
  p_location_text text,
  p_location_locality text,
  p_location_region text,
  p_postal_code text,
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
      locality = nullif(trim(p_location_locality), ''),
      region = nullif(trim(p_location_region), ''),
      postal_code = nullif(trim(p_postal_code), ''),
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
      location_text = trim(p_location_text),
      location_locality = nullif(trim(p_location_locality), ''),
      location_region = nullif(trim(p_location_region), ''),
      postal_code = nullif(trim(p_postal_code), ''),
      country_code = upper(p_country_code),
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
  text, text, text, text, text, date, date, text, text, text, text, text
) from public, anon;
grant execute on function public.update_job_review_draft(
  bigint, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, date, date, text, text, text, text, text
) to authenticated;
