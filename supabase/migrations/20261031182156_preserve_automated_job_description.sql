create or replace function private.prepare_automated_job_summary()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate text;
  v_database_enabled boolean;
  v_generated_summary text;
  v_source_record_id bigint;
  v_source_summary text;
  v_summary text;
  v_summary_source text;
  v_target_source_record_id bigint;
begin
  if new.status <> 'published' or new.source_url is null then
    return new;
  end if;

  select
    source_record.id,
    source_record.ai_summary,
    source_record.summary
  into
    v_source_record_id,
    v_generated_summary,
    v_source_summary
  from public.job_source_records as source_record
  where source_record.canonical_url = new.source_url
    and source_record.job_id is null
    and source_record.automation_status = 'ready'
  order by source_record.id
  limit 1;

  if not found then
    return new;
  end if;

  select auto_publish_enabled, auto_publish_source_record_id
  into v_database_enabled, v_target_source_record_id
  from public.automation_controls
  where id = 'global';

  if v_database_enabled is not true
    or (v_target_source_record_id is not null and v_target_source_record_id <> v_source_record_id)
  then
    raise insufficient_privilege using message = 'Automatic publication is not enabled for this source record.';
  end if;

  if char_length(coalesce(trim(v_generated_summary), '')) >= 20 then
    v_summary = trim(v_generated_summary);
    v_summary_source = 'ai';
  elsif char_length(coalesce(trim(v_source_summary), '')) >= 20 then
    v_summary = trim(v_source_summary);
    v_summary_source = 'source';
  else
    v_summary = trim(new.description);
    v_summary_source = 'excerpt';
  end if;

  v_summary = regexp_replace(v_summary, '\s+', ' ', 'g');
  if char_length(v_summary) > 500 then
    v_candidate = rtrim(left(v_summary, 499));
    v_summary = substring(v_candidate from '^(.*[.!?])(?:\s|$)');
    if char_length(coalesce(v_summary, '')) < 200 then
      v_summary = rtrim(regexp_replace(v_candidate, '\s+\S*$', '')) || '…';
    end if;
  end if;

  new.summary = v_summary;
  new.summary_source = v_summary_source;
  return new;
end;
$$;

revoke all on function private.prepare_automated_job_summary() from public, anon, authenticated;
