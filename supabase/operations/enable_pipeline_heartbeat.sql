-- OPERATIONAL RELEASE STEP: apply only after the replacement deployment is approved and healthy.
-- Updates the existing scheduler; does not create a second cron or expose the secret.
do $$
declare existing_job bigint;
begin
  select jobid into strict existing_job from cron.job where command like '%/api/automation/sources%';
  perform cron.alter_job(existing_job, command := $command$
    select net.http_post(
      url := 'https://wildjobs-olive.vercel.app/api/automation/sources',
      headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||decrypted_secret),
      body := jsonb_build_object('source','supabase_cron'),
      timeout_milliseconds := 60000
    )
    from vault.decrypted_secrets
    where name='wildjobs_automation_secret' and decrypted_secret<>''
      and public.pipeline_heartbeat_needed()
    order by created_at desc limit 1;
  $command$);
end $$;
