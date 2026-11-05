-- Every named directory employer is eligible for research, even between hiring rounds.
-- An empty task website means the worker must discover and verify an official site first.
create or replace function private.due_employer_research(p_pilot_name text)
returns table (name text, website text)
language sql stable security invoker set search_path = '' as $$
  select organisation.name, seed.website
  from public.directory_organisations as organisation
  cross join lateral (
    select case when organisation.website_url like 'https://%' then organisation.website_url else '' end as website
  ) as seed
  left join public.employer_research_tasks as task on task.organisation_name = organisation.name
  left join public.employer_profiles as profile on profile.organisation_name = organisation.name
  where lower(trim(organisation.name)) not in ('', 'organisation not stated')
    and profile.withdrawn_at is null
    and not exists (
      select 1 from public.employer_research_tasks as running
      where running.lease_id is not null and running.lease_until > now()
    )
    and (task.organisation_name is null or task.website_url <> seed.website or task.next_attempt_at <= now())
    and (
      (p_pilot_name is not null and organisation.name = p_pilot_name)
      or (p_pilot_name is null
        and exists (select 1 from public.directory_settings where id and enabled and employer_research_enabled))
    )
  order by
    case
      when task.last_result = 'website_verified' and seed.website <> '' then 0
      when task.organisation_name is null and seed.website <> '' then 1
      when task.organisation_name is null then 2
      else 3
    end,
    task.next_attempt_at nulls first, organisation.name
  limit 1
$$;

create function public.record_employer_research_website(
  p_name text, p_lease uuid, p_website text, p_input_tokens integer, p_output_tokens integer
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_website is null or p_website !~ '^https://[a-zA-Z0-9.-]+$' then return false; end if;
  perform 1 from public.employer_research_tasks
  where organisation_name = p_name and lease_id = p_lease and lease_until > now() and website_url = ''
  for update;
  if not found then return false; end if;

  -- The importer may have independently supplied a website during discovery.
  -- Only fill a missing or insecure URL, or accept the same independently verified site.
  update public.directory_organisations set website_url = p_website
  where name = p_name and (
    website_url is null or website_url not like 'https://%' or website_url = p_website
  );
  if not found then return false; end if;

  update public.employer_research_tasks set
    website_url = p_website, lease_id = null, lease_until = null, last_result = 'website_verified',
    next_attempt_at = now(),
    input_tokens = input_tokens + greatest(p_input_tokens, 0),
    output_tokens = output_tokens + greatest(p_output_tokens, 0)
  where organisation_name = p_name;
  return true;
end $$;

revoke all on function public.record_employer_research_website(text,uuid,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.record_employer_research_website(text,uuid,text,integer,integer)
  to service_role;
