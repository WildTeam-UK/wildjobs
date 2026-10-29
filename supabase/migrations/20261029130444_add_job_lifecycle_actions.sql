create function public.change_job_lifecycle(
  p_job_id bigint,
  p_action text,
  p_review_note text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_closes_at date;
  v_job_slug text;
  v_previous_status text;
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

  if p_action not in ('expired', 'withdrawn') then
    raise check_violation using message = 'Choose a supported lifecycle action.';
  end if;

  if length(trim(coalesce(p_review_note, ''))) not between 10 and 2000 then
    raise check_violation using message = 'Add a review note between 10 and 2,000 characters.';
  end if;

  select slug, status, closes_at
  into v_job_slug, v_previous_status, v_closes_at
  from public.jobs
  where id = p_job_id
  for update;

  if v_job_slug is null then
    raise no_data_found using message = 'The vacancy could not be found.';
  end if;

  if v_previous_status <> 'published' then
    raise check_violation using message = 'Only a published vacancy can be closed.';
  end if;

  if p_action = 'expired' and (v_closes_at is null or v_closes_at >= current_date) then
    raise check_violation using message = 'A vacancy can be marked expired after its closing date.';
  end if;

  update public.jobs
  set status = p_action,
      withdrawn_at = case when p_action = 'withdrawn' then now() else withdrawn_at end,
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
    p_action,
    v_previous_status,
    p_action,
    trim(p_review_note)
  );

  return v_job_slug;
end;
$$;

revoke execute on function public.change_job_lifecycle(bigint, text, text) from public, anon;
grant execute on function public.change_job_lifecycle(bigint, text, text) to authenticated;
