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

  update public.employers
  set status = 'published',
      reviewed_at = coalesce(reviewed_at, now()),
      published_at = coalesce(published_at, now()),
      updated_at = now()
  where id = v_job.employer_id
    and status <> 'archived';

  if not found then
    raise check_violation using message = 'The canonical employer is not publishable.';
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
