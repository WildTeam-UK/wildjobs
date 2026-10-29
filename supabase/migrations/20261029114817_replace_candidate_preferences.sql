create or replace function public.replace_candidate_preferences(
  p_preferred_location text,
  p_experience_level text,
  p_career_area_ids bigint[],
  p_workplace_types text[],
  p_contract_types text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_preferred_location text := nullif(trim(coalesce(p_preferred_location, '')), '');
  v_experience_level text := coalesce(nullif(trim(p_experience_level), ''), 'open');
  v_has_preferences boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if length(v_preferred_location) > 120 then
    raise exception 'Preferred location is too long.' using errcode = '22001';
  end if;

  if v_experience_level not in ('entry', 'developing', 'experienced', 'leadership', 'open') then
    raise exception 'Invalid experience level.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_workplace_types, '{}'::text[])) as selected(value)
    where selected.value not in ('remote', 'hybrid', 'on_site')
  ) then
    raise exception 'Invalid workplace preference.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_contract_types, '{}'::text[])) as selected(value)
    where selected.value not in ('permanent', 'fixed_term', 'temporary', 'internship', 'apprenticeship')
  ) then
    raise exception 'Invalid contract preference.' using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_career_area_ids, '{}'::bigint[])) as selected(id)
    where not exists (
      select 1
      from public.career_areas
      where career_areas.id = selected.id
        and career_areas.is_active
    )
  ) then
    raise exception 'Invalid career area preference.' using errcode = '23514';
  end if;

  insert into public.candidate_profiles (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  v_has_preferences :=
    v_preferred_location is not null
    or v_experience_level <> 'open'
    or coalesce(cardinality(p_career_area_ids), 0) > 0
    or coalesce(cardinality(p_workplace_types), 0) > 0
    or coalesce(cardinality(p_contract_types), 0) > 0;

  if v_has_preferences then
    insert into public.candidate_preferences (
      user_id,
      preferred_location,
      experience_level,
      updated_at
    )
    values (
      v_user_id,
      v_preferred_location,
      v_experience_level,
      now()
    )
    on conflict (user_id) do update
    set
      preferred_location = excluded.preferred_location,
      experience_level = excluded.experience_level,
      updated_at = now();
  else
    delete from public.candidate_preferences
    where user_id = v_user_id;
  end if;

  delete from public.candidate_career_area_preferences
  where user_id = v_user_id;

  insert into public.candidate_career_area_preferences (user_id, career_area_id)
  select v_user_id, selected.id
  from (
    select distinct unnest(coalesce(p_career_area_ids, '{}'::bigint[])) as id
  ) as selected;

  delete from public.candidate_workplace_preferences
  where user_id = v_user_id;

  insert into public.candidate_workplace_preferences (user_id, workplace_type)
  select v_user_id, selected.value
  from (
    select distinct unnest(coalesce(p_workplace_types, '{}'::text[])) as value
  ) as selected;

  delete from public.candidate_contract_preferences
  where user_id = v_user_id;

  insert into public.candidate_contract_preferences (user_id, contract_type)
  select v_user_id, selected.value
  from (
    select distinct unnest(coalesce(p_contract_types, '{}'::text[])) as value
  ) as selected;

  update public.candidate_profiles
  set
    onboarding_complete = v_has_preferences,
    updated_at = now()
  where user_id = v_user_id;
end;
$$;

revoke all on function public.replace_candidate_preferences(text, text, bigint[], text[], text[])
from public, anon;

grant execute on function public.replace_candidate_preferences(text, text, bigint[], text[], text[])
to authenticated;
