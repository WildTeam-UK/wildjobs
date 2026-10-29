create function public.link_source_record_to_job(
  p_source_record_id bigint,
  p_job_id bigint
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_existing_job_id bigint;
  v_mapping_status text;
begin
  if p_source_record_id < 1 or p_job_id < 1 then
    raise invalid_parameter_value using message = 'Choose a valid source record and WildJobs vacancy.';
  end if;

  if not exists (
    select 1
    from public.staff_members
    where user_id = v_actor_id
      and is_active
      and role = 'admin'
  ) then
    raise insufficient_privilege using message = 'Administrator access is required.';
  end if;

  select job_id, mapping_status
  into v_existing_job_id, v_mapping_status
  from public.job_source_records
  where id = p_source_record_id
  for update;

  if not found then
    raise foreign_key_violation using message = 'Choose an available source record.';
  end if;

  if v_existing_job_id = p_job_id and v_mapping_status = 'mapped' then
    return p_job_id;
  end if;

  if v_existing_job_id is not null
    or v_mapping_status not in ('unmapped', 'possible_duplicate')
  then
    raise check_violation using message = 'This source record is no longer available to link.';
  end if;

  if not exists (
    select 1
    from public.jobs
    where id = p_job_id
      and status in ('draft', 'in_review', 'published')
  ) then
    raise foreign_key_violation using message = 'Choose an active WildJobs vacancy.';
  end if;

  update public.job_source_records
  set job_id = p_job_id,
      mapping_status = 'mapped',
      verified_at = now()
  where id = p_source_record_id;

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
    'duplicate_resolved',
    v_mapping_status,
    'mapped',
    'Linked an additional approved source record to this WildJobs vacancy.'
  );

  return p_job_id;
end;
$$;

revoke execute on function public.link_source_record_to_job(bigint, bigint) from public, anon;
grant execute on function public.link_source_record_to_job(bigint, bigint) to authenticated;
