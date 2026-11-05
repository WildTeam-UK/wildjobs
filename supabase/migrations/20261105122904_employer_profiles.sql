-- Automated publication is enabled separately after the first production check.
alter table public.directory_settings add column employer_research_enabled boolean not null default false;

create table public.employer_profiles (
  organisation_name text primary key references public.directory_organisations(name),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug <> 'wildmere-nature-trust'),
  website_url text not null,
  website_host text not null unique,
  content jsonb not null check (case when jsonb_typeof(content->'claims') = 'array'
    then jsonb_array_length(content->'claims') between 2 and 7 else false end),
  researched_at timestamptz not null default now(),
  withdrawn_at timestamptz
);

create table public.employer_research_tasks (
  organisation_name text primary key references public.directory_organisations(name),
  website_url text not null,
  next_attempt_at timestamptz not null default now(),
  lease_id uuid,
  lease_until timestamptz,
  last_result text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0
);

create index directory_jobs_employer_history
  on public.directory_jobs (organisation_name, posted_at desc, id) where merged_into is null;
create index employer_research_active_lease
  on public.employer_research_tasks (lease_until) where lease_id is not null;

alter table public.employer_profiles enable row level security;
alter table public.employer_research_tasks enable row level security;
revoke all on public.employer_profiles, public.employer_research_tasks from public, anon, authenticated;
grant select (organisation_name, slug, content, researched_at)
  on public.employer_profiles to anon, authenticated;
grant select, insert, update on public.employer_profiles, public.employer_research_tasks to service_role;

create policy employer_profiles_public on public.employer_profiles
  for select to anon, authenticated using (
    withdrawn_at is null and researched_at > now() - interval '180 days'
    and exists (
      select 1 from public.directory_organisations as organisation
      where organisation.name = employer_profiles.organisation_name
        and organisation.website_url = employer_profiles.website_url
    )
  );

create function private.due_employer_research(p_pilot_name text)
returns table (name text, website text)
language sql stable security invoker set search_path = '' as $$
  select organisation.name, organisation.website_url
  from public.directory_organisations as organisation
  left join public.employer_research_tasks as task on task.organisation_name = organisation.name
  left join public.employer_profiles as profile on profile.organisation_name = organisation.name
  where organisation.website_url like 'https://%'
    and lower(organisation.name) <> 'organisation not stated'
    and not exists (
      select 1 from public.employer_research_tasks as running
      where running.lease_id is not null and running.lease_until > now()
    )
    and (task.organisation_name is null or task.website_url <> organisation.website_url or task.next_attempt_at <= now())
    and (
      (p_pilot_name is not null and organisation.name = p_pilot_name)
      or (p_pilot_name is null
        and exists (select 1 from public.directory_settings where id and enabled and employer_research_enabled)
        and (profile.organisation_name is not null or exists (
          select 1 from public.directory_jobs as job where job.organisation_name = organisation.name
            and job.is_active and job.merged_into is null
            and coalesce(job.closes_at, job.posted_at + interval '720 hours') > now()
        )))
    )
    and profile.withdrawn_at is null
  order by task.next_attempt_at nulls first, organisation.name
  limit 1
$$;

create function public.claim_employer_research(p_pilot_name text default null)
returns table (name text, website text, lease uuid)
language plpgsql security invoker set search_path = '' as $$
declare candidate record;
begin
  if not pg_try_advisory_xact_lock(742092) then return; end if;
  select * into candidate from private.due_employer_research(p_pilot_name);
  if not found then return; end if;
  return query
    insert into public.employer_research_tasks as task (organisation_name, website_url, lease_id, lease_until)
    values (candidate.name, candidate.website, gen_random_uuid(), now() + interval '4 minutes')
    on conflict (organisation_name) do update
    set website_url = excluded.website_url, lease_id = excluded.lease_id, lease_until = excluded.lease_until
    returning task.organisation_name, task.website_url, task.lease_id;
end $$;

create function public.finish_employer_research(
  p_name text, p_lease uuid, p_result text, p_content jsonb, p_host text,
  p_input_tokens integer, p_output_tokens integer
) returns text language plpgsql security invoker set search_path = '' as $$
declare
  task public.employer_research_tasks%rowtype;
  base_slug text;
  profile_slug text;
  collision integer := 0;
begin
  select * into task from public.employer_research_tasks
    where organisation_name = p_name and lease_id = p_lease and lease_until > now() for update;
  if not found then return 'superseded'; end if;
  if p_result not in ('published', 'insufficient', 'identity_mismatch', 'retry') then
    raise exception 'Invalid employer research outcome';
  end if;
  if p_result = 'published' and not exists (
    select 1 from public.directory_organisations where name = p_name and website_url = task.website_url
  ) then
    p_result := 'identity_mismatch';
  end if;
  if p_result = 'published' and exists (
    select 1 from public.employer_profiles where website_host = p_host and organisation_name <> p_name
  ) then
    p_result := 'duplicate_website';
  end if;

  if p_result = 'published' then
    base_slug := trim(both '-' from left(regexp_replace(lower(p_name), '[^a-z0-9]+', '-', 'g'), 80));
    profile_slug := coalesce(nullif(base_slug, ''), 'employer');
    base_slug := profile_slug;
    while profile_slug = 'wildmere-nature-trust' or exists (
      select 1 from public.employer_profiles where slug = profile_slug and organisation_name <> p_name
    ) loop
      collision := collision + 1;
      profile_slug := base_slug || '-' || left(md5(p_name || collision::text), 8);
    end loop;
    insert into public.employer_profiles as profile (organisation_name, slug, website_url, website_host, content)
    values (p_name, profile_slug, task.website_url, p_host, p_content)
    on conflict (organisation_name) do update set
      website_url = excluded.website_url, website_host = excluded.website_host,
      content = excluded.content, researched_at = now()
    where profile.withdrawn_at is null;
  elsif p_result = 'identity_mismatch' then
    -- Hide suspect material while preserving its URL for a future verified refresh.
    update public.employer_profiles set researched_at = '-infinity'
    where organisation_name = p_name;
  end if;

  update public.employer_research_tasks
  set lease_id = null, lease_until = null, last_result = p_result,
    input_tokens = input_tokens + greatest(p_input_tokens, 0),
    output_tokens = output_tokens + greatest(p_output_tokens, 0),
    next_attempt_at = now() + case p_result
      when 'published' then interval '90 days'
      when 'retry' then interval '1 day'
      else interval '14 days'
    end
  where organisation_name = p_name;
  return p_result;
end $$;

revoke all on function private.due_employer_research(text), public.claim_employer_research(text),
  public.finish_employer_research(text,uuid,text,jsonb,text,integer,integer) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.due_employer_research(text), public.claim_employer_research(text),
  public.finish_employer_research(text,uuid,text,jsonb,text,integer,integer) to service_role;

-- Extend the existing cron command without altering its feed schedule or credentials.
do $$
declare heartbeat record;
begin
  select jobid, command into heartbeat from cron.job where jobname = 'wildjobs-directory-feed';
  if found then
    perform cron.alter_job(heartbeat.jobid, command := heartbeat.command || $research$
      select net.http_post(
        url := 'https://wildjobs-olive.vercel.app/api/automation/employers',
        headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||decrypted_secret),
        body := '{}'::jsonb, timeout_milliseconds := 90000
      ) from vault.decrypted_secrets
      where name = 'wildjobs_automation_secret' and decrypted_secret <> ''
        and exists (select 1 from private.due_employer_research(null))
      order by created_at desc limit 1;
    $research$);
  end if;
end $$;
