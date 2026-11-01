-- A cheap database predicate prevents idle serverless invocations without delaying rechecks or shadow release.
create or replace function public.pipeline_heartbeat_needed()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.job_sources where is_active and collection_allowed and next_import_at<=now())
    or exists(select 1 from public.job_pipeline_tasks q join public.job_sources s on s.id=q.source_id
      where s.is_active and s.collection_allowed and
        ((q.status='pending' and q.due_at<=now()) or (q.status='running' and q.lease_expires_at<now())))
    or exists(select 1 from public.job_source_records r join public.job_sources s on s.id=r.source_id
      cross join public.automation_controls c
      where s.is_active and s.collection_allowed and r.mapping_status<>'ignored'
        and coalesce(r.closes_at,r.first_seen_at::date+30)>=current_date
        and ((r.next_check_at is null or r.next_check_at<=now())
          or (c.id='global' and c.auto_publish_enabled and r.automation_status='ready'
            and r.automation_policy_version='wildteam-brief-v1'
            and (c.auto_publish_source_record_id is null or c.auto_publish_source_record_id=r.id))))
    or exists(select 1 from public.source_import_automation
      where last_course_sync_claimed_at is null or last_course_sync_claimed_at<now()-interval '6 hours');
$$;
revoke all on function public.pipeline_heartbeat_needed() from public,anon,authenticated;
grant execute on function public.pipeline_heartbeat_needed() to service_role;
