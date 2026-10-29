create table public.automation_controls (
  id text primary key,
  auto_publish_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint automation_controls_singleton check (id = 'global')
);

insert into public.automation_controls (id, auto_publish_enabled)
values ('global', false);

alter table public.automation_controls enable row level security;

revoke all on table public.automation_controls from public, anon, authenticated;
grant select, update on table public.automation_controls to service_role;

create or replace function private.prepare_automated_job_summary()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate text;
  v_detail_text text;
  v_generated_summary text;
  v_source_summary text;
  v_summary text;
  v_summary_source text;
begin
  if new.status <> 'published' or new.source_url is null then
    return new;
  end if;

  select
    source_record.ai_summary,
    source_record.summary,
    source_record.detail_text
  into
    v_generated_summary,
    v_source_summary,
    v_detail_text
  from public.job_source_records as source_record
  where source_record.canonical_url = new.source_url
    and source_record.job_id is null
    and source_record.automation_status = 'ready'
  order by source_record.id
  limit 1;

  if not found then
    return new;
  end if;

  if char_length(coalesce(trim(v_generated_summary), '')) >= 20 then
    v_summary = trim(v_generated_summary);
    v_summary_source = 'ai';
  elsif char_length(coalesce(trim(v_source_summary), '')) >= 20 then
    v_summary = trim(v_source_summary);
    v_summary_source = 'source';
  else
    v_summary = trim(v_detail_text);
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
