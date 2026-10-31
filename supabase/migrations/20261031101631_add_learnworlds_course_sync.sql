alter table public.courses
add column learnworlds_synced_at timestamptz;

alter table public.source_import_automation
add column last_course_sync_claimed_at timestamptz,
add column last_course_sync_completed_at timestamptz,
add column last_course_sync_status text,
add column last_course_sync_error_code text,
add constraint source_import_automation_course_sync_status_valid check (
  last_course_sync_status is null
  or last_course_sync_status in ('completed', 'failed')
),
add constraint source_import_automation_course_sync_error_valid check (
  last_course_sync_error_code is null
  or last_course_sync_error_code ~ '^[a-z0-9_]{1,64}$'
);

create or replace function public.claim_periodic_course_sync(interval_hours integer default 6)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_last_course_sync_claimed_at timestamptz;
begin
  if interval_hours < 1 or interval_hours > 168 then
    raise check_violation using message = 'The course sync interval must be between 1 and 168 hours.';
  end if;

  select last_course_sync_claimed_at
  into v_last_course_sync_claimed_at
  from public.source_import_automation
  where id = true
  for update;

  if not found then
    raise object_not_in_prerequisite_state using message = 'Source import automation is not configured.';
  end if;

  if v_last_course_sync_claimed_at >= now() - make_interval(hours => interval_hours) then
    return false;
  end if;

  update public.source_import_automation
  set last_course_sync_claimed_at = now(),
      updated_at = now()
  where id = true;

  return true;
end;
$$;

revoke all on function public.claim_periodic_course_sync(integer) from public, anon, authenticated;
grant execute on function public.claim_periodic_course_sync(integer) to service_role;
