-- Approved source extension. Existing feeds retain their URLs, enabled state and job IDs.
alter table public.directory_sources
  add column configuration jsonb not null default '{"kind":"rss","intervalHours":1}',
  add column configuration_revision integer not null default 1,
  add column check_result jsonb,
  add column checked_at timestamptz,
  add column reviewed_at timestamptz,
  add column notes text not null default '';

alter table public.directory_sources add constraint directory_source_configuration_valid check (
  jsonb_typeof(configuration)='object' and
  configuration->>'kind' in ('auto','rss','smartrecruiters','lever','icims','html','job','manual') and
  coalesce((configuration->>'intervalHours')::integer,12) between 1 and 168
);

create table public.directory_source_events (
  id bigint generated always as identity primary key,
  source_id bigint not null references public.directory_sources(id),
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('saved','checked','imported','failed','pause','resume','refresh','remove')),
  detail jsonb not null default '{}'
);
create index directory_source_events_recent on public.directory_source_events(source_id,created_at desc);
alter table public.directory_source_events enable row level security;
revoke all on public.directory_source_events from public,anon,authenticated;
grant all on public.directory_source_events to service_role;
grant usage,select on sequence public.directory_source_events_id_seq to service_role;

create function public.save_directory_source(
  p_url text,p_name text,p_configuration jsonb,p_notes text default '',p_id bigint default null,p_actor uuid default null
) returns bigint language plpgsql security invoker set search_path='' as $$
declare managed_id bigint;
begin
  perform pg_advisory_xact_lock(742091);
  if nullif(trim(p_name),'') is null or length(p_url)>2048 or p_url !~ '^https?://' or length(p_notes)>2000 then
    raise check_violation using message='Provide a source name, public URL and bounded notes.';
  end if;
  if p_id is null then
    if exists(select 1 from public.directory_sources where feed_url=p_url and removed_at is null) then
      raise unique_violation using message='This source URL is already registered.';
    end if;
    insert into public.directory_sources(name,feed_url,enabled,configuration,notes)
    values(left(trim(p_name),160),p_url,false,p_configuration,p_notes)
    on conflict(feed_url) do update set name=excluded.name,enabled=false,removed_at=null,
      configuration=excluded.configuration,configuration_revision=public.directory_sources.configuration_revision+1,
      notes=excluded.notes,check_result=null,checked_at=null,reviewed_at=null,last_error=null
    returning id into managed_id;
  else
    update public.directory_sources set name=left(trim(p_name),160),feed_url=p_url,
      configuration=p_configuration,configuration_revision=configuration_revision+1,
      enabled=false,check_result=null,checked_at=null,reviewed_at=null,notes=p_notes,last_error=null
    where id=p_id and removed_at is null returning id into managed_id;
    if not found then raise no_data_found using message='Source not found.'; end if;
  end if;
  insert into public.directory_source_events(source_id,actor_id,action) values(managed_id,p_actor,'saved');
  update public.directory_settings set next_feed_at=coalesce((select min(next_feed_at) from public.directory_sources where enabled and removed_at is null),'9999-12-31'::timestamptz) where id;
  return managed_id;
end $$;

create function public.record_directory_source_check(
  p_source_id bigint,p_revision integer,p_result jsonb,p_actor uuid default null
) returns boolean language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(742091);
  update public.directory_sources set check_result=p_result,checked_at=now(),
    last_error=case when p_result->>'complete'='true' then null else left(p_result->>'message',800) end
  where id=p_source_id and configuration_revision=p_revision and removed_at is null;
  if not found then return false;end if;
  insert into public.directory_source_events(source_id,actor_id,action,detail)
    values(p_source_id,p_actor,case when p_result->>'complete'='true' then 'checked' else 'failed' end,p_result);
  return true;
end $$;

create function public.change_directory_source(
  p_source_id bigint,p_action text,p_actor uuid default null,p_reviewed boolean default false
) returns bigint language plpgsql security invoker set search_path='' as $$
declare source public.directory_sources; result bigint;
begin
  perform pg_advisory_xact_lock(742091);
  select * into source from public.directory_sources where id=p_source_id and removed_at is null for update;
  if not found then raise no_data_found using message='Source not found.';end if;
  if p_action='resume' then
    if source.check_result->>'complete' is distinct from 'true' or source.checked_at is null or source.checked_at<now()-interval '7 days' then
      raise check_violation using message='Check the source successfully before enabling imports.';
    end if;
    if not p_reviewed and source.reviewed_at is null then
      raise check_violation using message='Confirm the source access and reuse conditions before enabling imports.';
    end if;
    update public.directory_sources set reviewed_at=coalesce(reviewed_at,now()) where id=p_source_id;
  end if;
  if p_action not in ('pause','resume','refresh','remove') then raise check_violation using message='Choose a valid source action.';end if;
  result=public.manage_directory_source(p_action,p_source_id);
  -- Invalidate any in-flight snapshot after pause, resume or removal.
  if p_action<>'refresh' then update public.directory_sources set configuration_revision=configuration_revision+1 where id=p_source_id;end if;
  insert into public.directory_source_events(source_id,actor_id,action) values(p_source_id,p_actor,p_action);
  return result;
end $$;

create function public.import_directory_source(
  p_source_id bigint,p_revision integer,p_items jsonb,p_check jsonb
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare source public.directory_sources; result jsonb;
begin
  perform pg_advisory_xact_lock(742091);
  select * into source from public.directory_sources where id=p_source_id for update;
  if not found or source.removed_at is not null or not source.enabled or source.configuration_revision<>p_revision then
    return jsonb_build_object('seen',0,'changed',0,'superseded',true);
  end if;
  if p_check->>'complete' is distinct from 'true' or jsonb_typeof(p_items) is distinct from 'array' then
    raise check_violation using message='Only complete verified source snapshots can replace current listings.';
  end if;
  if coalesce((p_check->>'count')::integer,-1)<>jsonb_array_length(p_items) then
    raise check_violation using message='Only complete verified source snapshots can replace current listings.';
  end if;
  -- A new empty result after a non-empty import needs a second successful observation.
  -- A parser silently returning an empty list must not withdraw a whole employer's jobs.
  if jsonb_array_length(p_items)=0 and source.last_seen_count>0 and
    (source.check_result->>'count' is distinct from '0' or source.checked_at>now()-interval '10 minutes') then
    perform public.record_directory_source_check(p_source_id,p_revision,p_check);
    update public.directory_sources set next_feed_at=now()+interval '15 minutes' where id=p_source_id;
    return jsonb_build_object('seen',0,'changed',0,'awaiting_empty_confirmation',true);
  end if;
  result=public.import_directory_feed(p_source_id,source.feed_url,p_items);
  update public.directory_sources set check_result=p_check,checked_at=now(),
    next_feed_at=now()+make_interval(hours=>coalesce((configuration->>'intervalHours')::integer,12)) where id=p_source_id;
  insert into public.directory_source_events(source_id,action,detail) values(p_source_id,'imported',p_check||result);
  return result;
end $$;

revoke all on function public.save_directory_source(text,text,jsonb,text,bigint,uuid),
  public.record_directory_source_check(bigint,integer,jsonb,uuid),
  public.change_directory_source(bigint,text,uuid,boolean),
  public.import_directory_source(bigint,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_directory_source(text,text,jsonb,text,bigint,uuid),
  public.record_directory_source_check(bigint,integer,jsonb,uuid),
  public.change_directory_source(bigint,text,uuid,boolean),
  public.import_directory_source(bigint,integer,jsonb,jsonb) to service_role;

-- Keep the full validated source advert and its provenance private. A JavaScript
-- application page must not overwrite an API or manually supplied description.
create function public.directory_pending_source_jobs() returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(to_jsonb(j)||jsonb_build_object(
    'feed_text',l.payload->>'feed_text',
    'source_content_kind',coalesce(l.payload->>'source_content_kind','feed')
  ) order by j.first_seen_at,j.id),'[]'::jsonb)
  from (
    select * from public.directory_jobs where is_active and merged_into is null
      and processed_hash is distinct from feed_hash order by first_seen_at,id limit 20
  ) j join public.directory_source_jobs l on l.source_id=j.primary_source_id and l.external_id=j.primary_external_id
$$;
revoke all on function public.directory_pending_source_jobs() from public,anon,authenticated;
grant execute on function public.directory_pending_source_jobs() to service_role;
