alter table public.job_pipeline_tasks add column ai_stage text not null default 'primary' check(ai_stage in ('primary','escalation','review'));

create or replace function private.protect_pipeline_evidence() returns trigger language plpgsql security definer set search_path='' as $$
begin
  -- SECURITY DEFINER changes current_user, so precedence must depend on the stored authority, not the trigger owner's role.
  if old.extraction_method='manual' and new.extraction_method<>'manual' then return old; end if;
  if new is distinct from old then
    insert into public.job_source_snapshots(source_record_id,kind,content_hash,payload)
    values(old.source_record_id,'evidence',md5(row_to_json(old)::text),to_jsonb(old)) on conflict do nothing;
  end if;
  return new;
end $$;

-- Retire the conflicting staff publication/update APIs after their replacement is installed.
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('publish_job_review_draft','update_job_review_draft') loop
    execute format('revoke all on function %s from public,anon,authenticated',f);
  end loop;
end $$;
