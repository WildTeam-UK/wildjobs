-- Clear previous policy decisions atomically when a validated brief returns to pending publication.
create or replace function public.apply_pipeline_brief(p_record_id bigint,p_revision integer,p_source_hash text,p_result jsonb)
returns bigint language plpgsql security invoker set search_path='' as $$
declare r public.job_source_records%rowtype; j public.jobs%rowtype; incoming public.jobs%rowtype; v_job_id bigint; s public.job_sources%rowtype;
begin
  if current_user<>'service_role' then raise insufficient_privilege; end if;
  select * into r from public.job_source_records where id=p_record_id for update;
  select * into s from public.job_sources where id=r.source_id for share;
  if r.source_revision is distinct from p_revision or r.detail_content_hash is distinct from p_source_hash
    or not s.collection_allowed or not s.ai_processing_allowed or not s.is_active
    or p_result->>'policy_version' is distinct from 'wildteam-brief-v1' then
    raise check_violation using message='Evidence or permissions changed during generation.';
  end if;
  if r.job_id is null then raise check_violation using message='Canonical draft is required.'; end if;
  select * into j from public.jobs where id=r.job_id for update;
  if j.status not in ('draft','published') then raise check_violation using message='Staff review has precedence.'; end if;
  select * into incoming from jsonb_populate_record(j, p_result->'job');
  update public.jobs x set
    title=case when 'title'=any(x.staff_reviewed_fields) then x.title else incoming.title end,
    summary=case when 'summary'=any(x.staff_reviewed_fields) then x.summary else incoming.summary end,
    description=case when 'description'=any(x.staff_reviewed_fields) then x.description else incoming.description end,
    responsibilities=case when 'responsibilities'=any(x.staff_reviewed_fields) then x.responsibilities else incoming.responsibilities end,
    requirements=case when 'requirements'=any(x.staff_reviewed_fields) then x.requirements else incoming.requirements end,
    engagement_type=case when 'engagement_type'=any(x.staff_reviewed_fields) then x.engagement_type else incoming.engagement_type end,
    workplace_type=case when 'workplace_type'=any(x.staff_reviewed_fields) then x.workplace_type else incoming.workplace_type end,
    location_text=case when 'location_text'=any(x.staff_reviewed_fields) then x.location_text else incoming.location_text end,
    country_code=case when 'country_code'=any(x.staff_reviewed_fields) then x.country_code else incoming.country_code end,
    locality=case when 'locality'=any(x.staff_reviewed_fields) then x.locality else incoming.locality end,
    region=case when 'region'=any(x.staff_reviewed_fields) then x.region else incoming.region end,
    postal_code=case when 'postal_code'=any(x.staff_reviewed_fields) then x.postal_code else incoming.postal_code end,
    salary_text=case when 'salary_text'=any(x.staff_reviewed_fields) then x.salary_text else incoming.salary_text end,
    hours_type=case when 'hours_type'=any(x.staff_reviewed_fields) then x.hours_type else incoming.hours_type end,
    contract_type=case when 'contract_type'=any(x.staff_reviewed_fields) then x.contract_type else incoming.contract_type end,
    experience_level=case when 'experience_level'=any(x.staff_reviewed_fields) then x.experience_level else incoming.experience_level end,
    application_url=case when 'application_url'=any(x.staff_reviewed_fields) then x.application_url else incoming.application_url end,
    closes_at=case when 'closes_at'=any(x.staff_reviewed_fields) then x.closes_at else incoming.closes_at end,
    expires_at=case when 'closes_at'=any(x.staff_reviewed_fields) then coalesce(x.closes_at,x.expires_at) else incoming.expires_at end,
    posted_at=case when 'posted_at'=any(x.staff_reviewed_fields) then x.posted_at else incoming.posted_at end,
    editorial_brief=case when cardinality(x.staff_reviewed_fields)>0 then '{}'::jsonb else coalesce(p_result->'brief','{}'::jsonb) end,
    brief_status=case when cardinality(x.staff_reviewed_fields)>0 then 'review' else 'verified' end,
    brief_source_hash=p_source_hash,brief_policy_version='wildteam-brief-v1',summary_source='ai',
    source_verified_at=r.verified_at,indexing_eligible=false,jobposting_eligible=false,updated_at=now()
  where x.id=j.id returning id into v_job_id;
  perform public.replace_job_taxonomy_enrichment(r.id,j.id,coalesce(p_result->'occupations','[]'),coalesce(p_result->'benefits','[]'),
    coalesce(p_result->'career_areas','[]'),coalesce(p_result->'locations','[]'),'[]','wildteam-brief-v1');
  perform public.replace_source_capability_classification(r.id,coalesce(p_result->'capabilities','[]'),'[]','wildteam-brief-v1');
  update public.job_source_records set enrichment_status='complete',enrichment_completed_at=now(),enrichment_policy_version='wildteam-brief-v1',
    enriched_content_hash=p_source_hash,automation_status='pending',automation_blockers='{}',automation_score=null,
    automation_evaluated_at=null,automation_policy_version=null,pipeline_error=null where id=r.id;
  return v_job_id;
end $$;
revoke all on function public.apply_pipeline_brief(bigint,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.apply_pipeline_brief(bigint,integer,text,jsonb) to service_role;
