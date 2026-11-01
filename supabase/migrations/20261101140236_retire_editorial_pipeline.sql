-- User-approved replacement: remove old job data and the editorial/research automation.
-- Candidate accounts/preferences, staff membership and the local course catalogue remain.
do $$ declare r record; begin
 for r in select jobid from cron.job where jobname='wildjobs-source-import-heartbeat' loop perform cron.unschedule(r.jobid); end loop;
 for r in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where (n.nspname='private' and p.proname in ('candidate_has_saved_job','prepare_automated_job_summary','protect_pipeline_evidence','sync_employer_public_identity','track_job_staff_fields'))
 or (n.nspname='public' and p.proname in (
 'apply_pipeline_brief','change_job_lifecycle','claim_periodic_course_sync','claim_periodic_source_import','claim_pipeline_task','copy_source_capabilities_to_job','create_job_review_from_submission','create_manual_job_draft','finish_pipeline_task','ingest_pipeline_feed','link_source_record_to_job','normalise_job_optional_facts','pipeline_heartbeat_needed','pipeline_publish_blockers','prepare_automated_job_draft','public_job_employer','public_job_employers','publish_automated_source_record','publish_job_review_draft','publish_reviewed_brief','redeem_employer_submission_invite','replace_job_taxonomy_enrichment','replace_source_capability_classification','reserve_pipeline_ai','review_employer_submission','save_pipeline_review','sync_automated_job_draft','sync_job_location_from_source_record','update_employer_review_profile','update_job_review_draft'))
 loop execute 'drop function if exists '||r.signature||' cascade'; end loop;
end $$;
drop table if exists public.automation_controls,public.source_import_automation,public.job_source_field_evidence,public.job_capabilities,public.job_source_records,public.employer_field_evidence,public.course_learning_outcomes,public.capability_aliases,public.source_record_capabilities,public.capability_candidates,public.employers,public.automation_publication_decisions,public.source_enrichment_runs,public.submission_invites,public.employer_submissions,public.saved_jobs,public.import_runs,public.job_sources,public.moderation_events,public.capabilities,public.course_capabilities,public.taxonomy_candidates,public.job_career_areas,public.employer_aliases,public.occupations,public.occupation_aliases,public.job_occupations,public.benefits,public.benefit_aliases,public.job_benefits,public.employer_benefits,public.job_locations,public.jobs,public.job_pipeline_tasks,public.job_source_snapshots,public.job_brief_versions,public.pipeline_ai_usage,public.employer_public_identities cascade;
-- A reference name from the feed includes a comma; store it intact for deterministic header parsing.
insert into public.directory_organisations(name) values ('Royal Botanic Gardens, Kew') on conflict do nothing;
-- The only scheduled task. Idle minutes do not invoke Vercel or AI.
select cron.schedule('wildjobs-directory-feed','* * * * *',$cron$
 select net.http_post(
  url:='https://wildjobs-olive.vercel.app/api/automation/feed',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||decrypted_secret),
  body:='{}'::jsonb,timeout_milliseconds:=150000
 ) from vault.decrypted_secrets
 where name='wildjobs_automation_secret' and decrypted_secret<>''
 and exists(select 1 from public.directory_settings where enabled and (running_until is null or running_until<now()) and (next_feed_at<=now() or exists(select 1 from public.directory_jobs where is_active and processed_hash is distinct from feed_hash)))
 order by created_at desc limit 1;
$cron$);
-- Explicit privileges as well as RLS: operations and usage stay server-only.
revoke all on public.directory_jobs,public.directory_organisations,public.directory_settings,public.directory_runs,public.directory_saved_jobs from anon,authenticated;
grant select on public.directory_jobs,public.directory_organisations to anon,authenticated;
grant select,insert,delete on public.directory_saved_jobs to authenticated;
