alter table public.moderation_events
add column employer_id bigint references public.employers(id) on delete restrict;

alter table public.moderation_events
drop constraint moderation_events_one_target;

alter table public.moderation_events
add constraint moderation_events_one_target check (
  num_nonnulls(job_id, employer_submission_id, employer_id) = 1
);

create index moderation_events_employer_id_created_at_idx
on public.moderation_events (employer_id, created_at)
where employer_id is not null;

create function public.update_employer_review_profile(
  p_employer_id bigint,
  p_website_url text,
  p_mission text,
  p_overview text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_role text;
  v_previous_status text;
  v_next_status text;
begin
  select role
  into v_actor_role
  from public.staff_members
  where user_id = v_actor_id
    and is_active;

  if v_actor_role is null then
    raise insufficient_privilege using message = 'Active staff access is required.';
  end if;

  select status
  into v_previous_status
  from public.employers
  where id = p_employer_id
  for update;

  if v_previous_status is null then
    raise no_data_found using message = 'The employer could not be found.';
  end if;

  if v_actor_role = 'reviewer' and v_previous_status not in ('draft', 'in_review') then
    raise insufficient_privilege using message = 'An administrator must update published employers.';
  end if;

  v_next_status := case
    when v_previous_status = 'draft' then 'in_review'
    else v_previous_status
  end;

  update public.employers
  set website_url = trim(p_website_url),
      website_domain = lower(split_part(regexp_replace(trim(p_website_url), '^https?://', ''), '/', 1)),
      mission = trim(p_mission),
      overview = trim(p_overview),
      status = v_next_status,
      reviewed_at = now(),
      updated_at = now()
  where id = p_employer_id;

  insert into public.moderation_events (
    employer_id,
    actor_user_id,
    action,
    previous_status,
    next_status,
    review_note
  )
  values (
    p_employer_id,
    v_actor_id,
    'updated',
    v_previous_status,
    v_next_status,
    'Employer website, mission and overview reviewed.'
  );

  return p_employer_id;
end;
$$;

revoke execute on function public.update_employer_review_profile(bigint, text, text, text)
from public, anon;

grant execute on function public.update_employer_review_profile(bigint, text, text, text)
to authenticated;
