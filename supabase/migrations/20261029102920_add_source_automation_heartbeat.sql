create extension if not exists pg_net
with schema extensions;

create extension if not exists pg_cron;

create table public.source_import_automation (
  id boolean primary key default true,
  last_heartbeat_at timestamptz,
  last_import_claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_import_automation_singleton check (id)
);

alter table public.source_import_automation enable row level security;

revoke all on table public.source_import_automation from public, anon, authenticated;
grant select, update on table public.source_import_automation to service_role;

insert into public.source_import_automation (id)
values (true);

create or replace function public.claim_periodic_source_import(interval_hours integer default 2)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_last_import_claimed_at timestamptz;
begin
  if interval_hours < 1 or interval_hours > 24 then
    raise check_violation using message = 'The source import interval must be between 1 and 24 hours.';
  end if;

  select last_import_claimed_at
  into v_last_import_claimed_at
  from public.source_import_automation
  where id = true
  for update;

  if not found then
    raise object_not_in_prerequisite_state using message = 'Source import automation is not configured.';
  end if;

  update public.source_import_automation
  set last_heartbeat_at = now(),
      updated_at = now()
  where id = true;

  if v_last_import_claimed_at >= now() - make_interval(hours => interval_hours)
    or exists (
      select 1
      from public.import_runs
      where status = 'started'
    )
  then
    return false;
  end if;

  update public.source_import_automation
  set last_import_claimed_at = now(),
      updated_at = now()
  where id = true;

  return true;
end;
$$;

revoke all on function public.claim_periodic_source_import(integer) from public, anon, authenticated;
grant execute on function public.claim_periodic_source_import(integer) to service_role;

select cron.schedule(
  'wildjobs-source-import-heartbeat',
  '* * * * *',
  $cron$
    select net.http_post(
      url := 'https://wildjobs-olive.vercel.app/api/automation/sources',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || decrypted_secret
      ),
      body := jsonb_build_object('source', 'supabase_cron'),
      timeout_milliseconds := 60000
    ) as request_id
    from vault.decrypted_secrets
    where name = 'wildjobs_automation_secret'
      and decrypted_secret <> ''
    order by created_at desc
    limit 1;
  $cron$
);
