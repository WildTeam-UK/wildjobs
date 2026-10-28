alter table public.moderation_events
drop constraint moderation_events_action_valid;

alter table public.moderation_events
add constraint moderation_events_action_valid check (
  action in (
    'created',
    'updated',
    'assigned',
    'changes_requested',
    'approved',
    'published',
    'expired',
    'withdrawn',
    'rejected',
    'duplicate_flagged',
    'duplicate_resolved'
  )
);

drop policy "Staff can update employers" on public.employers;

create policy "Administrators can update employers"
on public.employers for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'admin'
  )
);

create policy "Reviewers can update unpublished employers"
on public.employers for update
to authenticated
using (
  status in ('draft', 'in_review')
  and exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'reviewer'
  )
)
with check (
  status in ('draft', 'in_review')
  and exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'reviewer'
  )
);

drop policy "Staff can update jobs" on public.jobs;

create policy "Administrators can update jobs"
on public.jobs for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'admin'
  )
);

create policy "Reviewers can update unpublished jobs"
on public.jobs for update
to authenticated
using (
  status in ('draft', 'in_review')
  and exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'reviewer'
  )
)
with check (
  status in ('draft', 'in_review')
  and exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'reviewer'
  )
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
  p_employer_overview text
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
    select 1
    from public.staff_members
    where user_id = v_actor_id
      and is_active
      and role in ('admin', 'reviewer')
  ) then
    raise insufficient_privilege using message = 'Active staff access is required.';
  end if;

  select employer_id, status
  into v_employer_id, v_previous_status
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
      workplace_type = p_workplace_type,
      contract_type = p_contract_type,
      hours_type = p_hours_type,
      experience_level = p_experience_level,
      salary_text = trim(p_salary_text),
      application_url = p_application_url,
      posted_at = p_posted_at,
      closes_at = p_closes_at,
      updated_at = now()
  where id = p_job_id;

  update public.job_source_records
  set canonical_url = p_canonical_url,
      verified_at = now(),
      updated_at = now()
  where id = (
    select id
    from public.job_source_records
    where job_id = p_job_id
    order by created_at
    limit 1
  );

  if not found then
    raise check_violation using message = 'The vacancy needs a source record before review.';
  end if;

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
    'updated',
    v_previous_status,
    'in_review',
    'Vacancy and employer review details updated.'
  );

  return p_job_id;
end;
$$;

create function public.publish_job_review_draft(p_job_id bigint)
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
      and workplace_type is not null
      and contract_type is not null
      and hours_type is not null
      and experience_level is not null
      and nullif(trim(salary_text), '') is not null
      and application_url is not null
      and closes_at >= current_date
  ) then
    raise check_violation using message = 'Complete every required vacancy field before publication.';
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

revoke execute on function public.update_job_review_draft(
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
  date,
  date,
  text,
  text,
  text,
  text
) from public, anon;

grant execute on function public.update_job_review_draft(
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
  date,
  date,
  text,
  text,
  text,
  text
) to authenticated;

revoke execute on function public.publish_job_review_draft(bigint) from public, anon;
grant execute on function public.publish_job_review_draft(bigint) to authenticated;
