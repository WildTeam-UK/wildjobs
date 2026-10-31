create function public.prepare_automated_job_draft(
  p_source_record_id bigint,
  p_employer_id bigint,
  p_job_slug text
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job_id bigint;
  v_record public.job_source_records%rowtype;
  v_source public.job_sources%rowtype;
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Service access is required.';
  end if;

  select * into v_record
  from public.job_source_records
  where id = p_source_record_id
  for update;

  if not found then
    raise no_data_found using message = 'The source record could not be found.';
  end if;

  if v_record.job_id is not null and v_record.mapping_status = 'mapped' then
    return v_record.job_id;
  end if;

  select * into v_source
  from public.job_sources
  where id = v_record.source_id;

  if not v_source.is_active
    or v_source.source_type not in ('feed', 'api')
    or v_record.mapping_status <> 'unmapped'
    or v_record.job_id is not null
    or char_length(coalesce(trim(v_record.source_title), '')) < 2
    or v_record.canonical_url !~ '^https://'
  then
    raise check_violation using message = 'The source record is not ready for a private draft.';
  end if;

  if coalesce(v_record.closes_at, v_record.first_seen_at::date + 30) < current_date then
    raise check_violation using message = 'The vacancy has already expired.';
  end if;

  if not exists (
    select 1 from public.employers
    where id = p_employer_id and status <> 'archived'
  ) then
    raise check_violation using message = 'A canonical employer is required.';
  end if;

  if exists (
    select 1 from public.jobs
    where source_url = v_record.canonical_url
      or (
        v_record.application_url is not null
        and application_url = v_record.application_url
      )
  ) then
    raise unique_violation using message = 'This vacancy is already registered.';
  end if;

  insert into public.jobs (
    slug,
    employer_id,
    title,
    summary,
    summary_source,
    status,
    location_text,
    locality,
    region,
    postal_code,
    country_code,
    application_url,
    source_name,
    source_url,
    posted_at,
    closes_at,
    expires_at
  )
  values (
    p_job_slug,
    p_employer_id,
    trim(v_record.source_title),
    case
      when char_length(coalesce(trim(v_record.summary), '')) >= 20
        then left(trim(v_record.summary), 500)
      else null
    end,
    'source',
    'draft',
    nullif(trim(v_record.location_text), ''),
    nullif(trim(v_record.location_locality), ''),
    nullif(trim(v_record.location_region), ''),
    nullif(trim(v_record.postal_code), ''),
    coalesce(v_record.country_code, v_source.default_country_code),
    v_record.application_url,
    v_source.name,
    v_record.canonical_url,
    coalesce(least(v_record.source_updated_at::date, current_date), v_record.first_seen_at::date),
    v_record.closes_at,
    coalesce(v_record.closes_at, v_record.first_seen_at::date + 30)
  )
  returning id into v_job_id;

  update public.job_source_records
  set employer_id = p_employer_id,
      job_id = v_job_id,
      mapping_status = 'mapped',
      verified_at = now(),
      updated_at = now()
  where id = p_source_record_id;

  insert into public.moderation_events (
    job_id, actor_type, action, next_status, review_note
  )
  values (
    v_job_id,
    'automation',
    'created',
    'draft',
    'Created as a private canonical draft before enrichment.'
  );

  return v_job_id;
end;
$$;

revoke execute on function public.prepare_automated_job_draft(bigint, bigint, text)
from public, anon, authenticated;
grant execute on function public.prepare_automated_job_draft(bigint, bigint, text)
to service_role;

create function public.sync_automated_job_draft(p_source_record_id bigint)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job_id bigint;
  v_record public.job_source_records%rowtype;
  v_source public.job_sources%rowtype;
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Service access is required.';
  end if;

  select * into v_record
  from public.job_source_records
  where id = p_source_record_id
    and job_id is not null
    and mapping_status = 'mapped'
  for update;

  if not found then
    raise check_violation using message = 'The source record is not linked to a draft.';
  end if;

  select * into v_source
  from public.job_sources
  where id = v_record.source_id;

  select id into v_job_id
  from public.jobs
  where id = v_record.job_id
    and status = 'draft'
  for update;

  if v_job_id is null then
    raise check_violation using message = 'Only an untouched automated draft can be synchronized.';
  end if;

  update public.jobs
  set title = trim(v_record.source_title),
      summary = case
        when char_length(coalesce(trim(v_record.summary), '')) >= 20
          then left(trim(v_record.summary), 500)
        when char_length(coalesce(trim(v_record.ai_summary), '')) >= 20
          then left(trim(v_record.ai_summary), 500)
        else left(trim(v_record.detail_text), 500)
      end,
      summary_source = case
        when char_length(coalesce(trim(v_record.summary), '')) >= 20 then 'source'
        when char_length(coalesce(trim(v_record.ai_summary), '')) >= 20 then 'ai'
        else 'excerpt'
      end,
      description = nullif(trim(v_record.detail_text), ''),
      location_text = nullif(trim(v_record.location_text), ''),
      locality = nullif(trim(v_record.location_locality), ''),
      region = nullif(trim(v_record.location_region), ''),
      postal_code = nullif(trim(v_record.postal_code), ''),
      country_code = coalesce(v_record.country_code, v_source.default_country_code),
      workplace_type = (
        select value from public.job_source_field_evidence
        where source_record_id = v_record.id
          and field_name = 'workplace_type'
          and resolution_status = 'extracted'
          and confidence >= 70
        order by confidence desc limit 1
      ),
      contract_type = (
        select value from public.job_source_field_evidence
        where source_record_id = v_record.id
          and field_name = 'contract_type'
          and resolution_status = 'extracted'
          and confidence >= 70
        order by confidence desc limit 1
      ),
      hours_type = (
        select value from public.job_source_field_evidence
        where source_record_id = v_record.id
          and field_name = 'hours_type'
          and resolution_status = 'extracted'
          and confidence >= 70
        order by confidence desc limit 1
      ),
      experience_level = (
        select value from public.job_source_field_evidence
        where source_record_id = v_record.id
          and field_name = 'experience_level'
          and resolution_status = 'extracted'
          and confidence >= 70
        order by confidence desc limit 1
      ),
      salary_text = (
        select value from public.job_source_field_evidence
        where source_record_id = v_record.id
          and field_name = 'salary_text'
          and resolution_status = 'extracted'
          and confidence >= 70
        order by confidence desc limit 1
      ),
      engagement_type = (
        select value from public.job_source_field_evidence
        where source_record_id = v_record.id
          and field_name = 'engagement_type'
          and resolution_status = 'extracted'
          and confidence >= 80
        order by confidence desc limit 1
      ),
      application_url = coalesce(nullif(trim(v_record.application_url), ''), v_record.canonical_url),
      source_name = v_source.name,
      source_url = v_record.canonical_url,
      posted_at = coalesce(least(v_record.source_updated_at::date, current_date), v_record.first_seen_at::date),
      closes_at = v_record.closes_at,
      expires_at = coalesce(v_record.closes_at, v_record.first_seen_at::date + 30),
      updated_at = now()
  where id = v_job_id;

  if nullif(trim(v_record.location_text), '') is not null
    and not exists (
      select 1 from public.job_locations
      where job_id = v_job_id and is_primary and assignment_source = 'staff'
    )
  then
    delete from public.job_locations
    where job_id = v_job_id and is_primary and assignment_source <> 'staff';

    insert into public.job_locations (
      job_id, raw_text, locality, region, postal_code, country_code,
      precision, is_primary, evidence_text, confidence, assignment_source, policy_version
    )
    values (
      v_job_id,
      trim(v_record.location_text),
      nullif(trim(v_record.location_locality), ''),
      nullif(trim(v_record.location_region), ''),
      nullif(trim(v_record.postal_code), ''),
      coalesce(v_record.country_code, v_source.default_country_code),
      case
        when nullif(trim(v_record.postal_code), '') is not null then 'postcode'
        when nullif(trim(v_record.location_locality), '') is not null then 'locality'
        when nullif(trim(v_record.location_region), '') is not null then 'region'
        else 'country'
      end,
      true,
      trim(v_record.location_text),
      95,
      'deterministic',
      'source-page-location-v1'
    );
  end if;

  return v_job_id;
end;
$$;

revoke execute on function public.sync_automated_job_draft(bigint)
from public, anon, authenticated;
grant execute on function public.sync_automated_job_draft(bigint)
to service_role;

create or replace function public.publish_automated_source_record(
  p_source_record_id bigint,
  p_job_slug text,
  p_policy_version text,
  p_score smallint
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.jobs%rowtype;
  v_record public.job_source_records%rowtype;
  v_source public.job_sources%rowtype;
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Service access is required.';
  end if;

  select * into v_record
  from public.job_source_records
  where id = p_source_record_id
  for update;

  select * into v_source
  from public.job_sources
  where id = v_record.source_id;

  select * into v_job
  from public.jobs
  where id = v_record.job_id
  for update;

  if v_job.id is null
    or v_job.status <> 'draft'
    or v_record.mapping_status <> 'mapped'
    or v_record.enrichment_status not in ('complete', 'skipped')
    or v_record.automation_status <> 'ready'
    or v_record.automation_policy_version <> p_policy_version
    or not v_source.is_active
    or v_source.source_type not in ('feed', 'api')
    or v_source.description_display_mode <> 'full'
  then
    raise check_violation using message = 'The private draft is not ready for automated publication.';
  end if;

  if v_job.expires_at < current_date
    or v_job.application_url !~ '^https://'
    or v_job.source_url !~ '^https://'
    or v_job.country_code !~ '^[A-Z]{2}$'
    or char_length(coalesce(v_job.title, '')) < 2
    or char_length(coalesce(v_job.summary, '')) < 20
    or char_length(coalesce(v_job.description, '')) < 80
  then
    raise check_violation using message = 'A required publication fact is missing or invalid.';
  end if;

  if exists (
    select 1 from public.jobs
    where id <> v_job.id
      and (application_url = v_job.application_url or source_url = v_job.source_url)
  ) then
    raise unique_violation using message = 'This vacancy is already registered.';
  end if;

  update public.jobs
  set status = 'published',
      published_at = now(),
      updated_at = now()
  where id = v_job.id;

  update public.job_source_records
  set automation_status = 'published',
      automation_blockers = '{}',
      automation_score = p_score,
      automation_evaluated_at = now(),
      automation_policy_version = p_policy_version,
      updated_at = now()
  where id = p_source_record_id;

  insert into public.moderation_events (
    job_id, actor_type, action, previous_status, next_status, review_note
  )
  values (
    v_job.id,
    'automation',
    'published',
    'draft',
    'published',
    'Published automatically under policy ' || p_policy_version || '.'
  );

  insert into public.automation_publication_decisions (
    source_record_id, job_id, mode, decision, score, policy_version
  )
  values (
    p_source_record_id, v_job.id, 'live', 'published', p_score, p_policy_version
  );

  return v_job.id;
end;
$$;

revoke execute on function public.publish_automated_source_record(bigint, text, text, smallint)
from public, anon, authenticated;
grant execute on function public.publish_automated_source_record(bigint, text, text, smallint)
to service_role;
