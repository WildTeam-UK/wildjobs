insert into public.job_sources (
  name,
  source_type,
  authoritative_base_url,
  is_active
)
values (
  'Employer submissions',
  'employer_submission',
  null,
  true
)
on conflict (name) do update
set source_type = excluded.source_type,
    is_active = true,
    updated_at = now();

create function public.review_employer_submission(
  p_submission_id bigint,
  p_decision text,
  p_review_note text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_previous_status text;
  v_resulting_job_id bigint;
  v_next_status text;
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

  if p_decision not in ('changes_requested', 'rejected') then
    raise check_violation using message = 'Choose a supported review decision.';
  end if;

  if length(trim(coalesce(p_review_note, ''))) not between 10 and 2000 then
    raise check_violation using message = 'Add a review note between 10 and 2,000 characters.';
  end if;

  select status, resulting_job_id
  into v_previous_status, v_resulting_job_id
  from public.employer_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise no_data_found using message = 'The employer submission could not be found.';
  end if;

  if v_resulting_job_id is not null or v_previous_status in ('accepted', 'rejected') then
    raise check_violation using message = 'This employer submission is already resolved.';
  end if;

  v_next_status := p_decision;

  update public.employer_submissions
  set status = v_next_status,
      resolved_at = case when v_next_status = 'rejected' then now() else null end,
      updated_at = now()
  where id = p_submission_id;

  insert into public.moderation_events (
    employer_submission_id,
    actor_user_id,
    action,
    previous_status,
    next_status,
    review_note
  )
  values (
    p_submission_id,
    v_actor_id,
    p_decision,
    v_previous_status,
    v_next_status,
    trim(p_review_note)
  );

  return v_next_status;
end;
$$;

create function public.create_job_review_from_submission(
  p_submission_id bigint,
  p_employer_slug text,
  p_job_slug text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_submission public.employer_submissions%rowtype;
  v_source_id bigint;
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

  select employer_submissions.*
  into v_submission
  from public.employer_submissions
  where id = p_submission_id
  for update;

  if not found then
    raise no_data_found using message = 'The employer submission could not be found.';
  end if;

  if v_submission.status = 'accepted' and v_submission.resulting_job_id is not null then
    return v_submission.resulting_job_id;
  end if;

  if v_submission.status = 'rejected' or v_submission.resulting_job_id is not null then
    raise check_violation using message = 'This employer submission is already resolved.';
  end if;

  if v_submission.closing_date < current_date then
    raise check_violation using message = 'The submitted closing date has passed.';
  end if;

  select id
  into v_source_id
  from public.job_sources
  where name = 'Employer submissions'
    and source_type = 'employer_submission'
    and is_active
  limit 1;

  if v_source_id is null then
    raise foreign_key_violation using message = 'The employer submission source is unavailable.';
  end if;

  if v_submission.matched_employer_id is not null then
    select id
    into v_employer_id
    from public.employers
    where id = v_submission.matched_employer_id
      and status <> 'archived';

    if v_employer_id is null then
      raise foreign_key_violation using message = 'The matched employer is unavailable.';
    end if;
  else
    select id
    into v_employer_id
    from public.employers
    where lower(name) = lower(trim(v_submission.organisation_name))
      and status <> 'archived'
    order by id
    limit 1;
  end if;

  if v_employer_id is null then
    insert into public.employers (
      slug,
      name,
      status
    )
    values (
      p_employer_slug,
      trim(v_submission.organisation_name),
      'draft'
    )
    returning id into v_employer_id;
  end if;

  insert into public.jobs (
    slug,
    employer_id,
    title,
    summary,
    description,
    status,
    location_text,
    workplace_type,
    salary_text,
    application_url,
    closes_at
  )
  values (
    p_job_slug,
    v_employer_id,
    trim(v_submission.role_title),
    trim(v_submission.role_summary),
    trim(v_submission.role_summary),
    'in_review',
    trim(v_submission.location_text),
    v_submission.workplace_type,
    trim(v_submission.salary_text),
    v_submission.application_url,
    v_submission.closing_date
  )
  returning id into v_job_id;

  insert into public.job_source_records (
    source_id,
    job_id,
    external_id,
    canonical_url,
    mapping_status,
    source_updated_at,
    verified_at
  )
  values (
    v_source_id,
    v_job_id,
    'submission:' || p_submission_id,
    v_submission.application_url,
    'mapped',
    v_submission.authority_confirmed_at,
    now()
  );

  update public.employer_submissions
  set matched_employer_id = v_employer_id,
      resulting_job_id = v_job_id,
      status = 'accepted',
      resolved_at = now(),
      updated_at = now()
  where id = p_submission_id;

  insert into public.moderation_events (
    employer_submission_id,
    actor_user_id,
    action,
    previous_status,
    next_status,
    review_note
  )
  values (
    p_submission_id,
    v_actor_id,
    'approved',
    v_submission.status,
    'accepted',
    'Approved into private job review as record #' || v_job_id || '.'
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
    'Created from employer submission SUB-' || p_submission_id || '.'
  );

  return v_job_id;
end;
$$;

revoke all on function public.review_employer_submission(bigint, text, text)
from public, anon, authenticated;
grant execute on function public.review_employer_submission(bigint, text, text)
to authenticated;

revoke all on function public.create_job_review_from_submission(bigint, text, text)
from public, anon, authenticated;
grant execute on function public.create_job_review_from_submission(bigint, text, text)
to authenticated;
