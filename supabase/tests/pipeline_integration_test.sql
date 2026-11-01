-- Rollback-only integration coverage. No real vacancies, staff decisions or controls are retained.
begin;
create extension if not exists pgtap with schema extensions;
select plan(1);
set local role service_role;
do $$
declare sid bigint;rid bigint;eid bigint;jid bigint;cid bigint;outcome jsonb;task jsonb;lease uuid;reservation uuid;patched jsonb;
begin
  insert into public.job_sources(name,source_type,authoritative_base_url,is_active,collection_allowed,ai_processing_allowed,publication_allowed,
    description_display_mode,permissions_reviewed_at,permission_notes)
  values('__pipeline_integration_fixture__','feed','https://example.test/jobs.rss',true,true,true,true,'summary_only',current_date,'Synthetic rollback-only test permission') returning id into sid;
  outcome=public.ingest_pipeline_feed(sid,jsonb_build_array(jsonb_build_object('title','Habitat restoration officer','externalId','fixture-1','canonicalUrl','https://example.test/jobs/fixture-1',
    'employer','Fixture Nature Trust','location','London','summary','Restore habitats with communities.','closesAt',(current_date+14)::text,'publishedAt',now(),'contentHash',repeat('a',64))));
  if (outcome->>'created')::int<>1 then raise exception 'Import did not create one record';end if;
  select id into rid from public.job_source_records where source_id=sid;
  perform public.ingest_pipeline_feed(sid,jsonb_build_array(jsonb_build_object('title','Habitat restoration officer','externalId','fixture-1','canonicalUrl','https://example.test/jobs/fixture-1',
    'employer',null,'location',null,'summary','Restore habitats with communities.','contentHash',repeat('a',64))));
  if (select count(*) from public.job_pipeline_tasks where source_id=sid)<>1 then raise exception 'Unchanged import queued duplicate work';end if;
  if (select location_text from public.job_source_records where id=rid)<>'London' then raise exception 'Unchanged feed erased stronger facts';end if;
  task=public.claim_pipeline_task(rid);lease=(task->>'lease_token')::uuid;
  if public.finish_pipeline_task((task->>'id')::bigint,gen_random_uuid(),'completed') then raise exception 'Wrong worker could finish a lease';end if;
  if not public.finish_pipeline_task((task->>'id')::bigint,lease,'completed') then raise exception 'Lease could not finish';end if;
  insert into public.employers(name,slug,status)values('Fixture Nature Trust','pipeline-fixture-nature-trust','draft')returning id into eid;
  jid=public.prepare_automated_job_draft(rid,eid,'pipeline-fixture-habitat-role');
  insert into public.career_areas(slug,title,description,display_order) values('pipeline-fixture-area','Fixture conservation','Synthetic test taxonomy',999) returning id into cid;
  update public.job_source_records set detail_text='The officer restores habitats and coordinates community habitat projects. Experience of ecology and partnership working is required.',detail_content_hash=repeat('b',64),verified_at=now(),application_url='https://example.test/jobs/fixture-1' where id=rid;
  patched=jsonb_build_object('policy_version','wildteam-brief-v1','job',jsonb_build_object('title','Habitat restoration officer',
    'summary','Help a nature charity improve habitats through practical restoration and community projects.',
    'description','This conservation post combines habitat restoration planning with community project delivery. The officer coordinates practical work and contributes ecological expertise.',
    'responsibilities','Coordinate habitat projects.','requirements','Ecological experience.', 'location_text','London','country_code','GB','engagement_type','paid','application_url','https://example.test/jobs/fixture-1',
    'closes_at',(current_date+14)::text,'expires_at',(current_date+14)::text),
    'brief',jsonb_build_object('conservationContext','Contributes to habitat restoration.'),
    'career_areas',jsonb_build_array(jsonb_build_object('termId',cid,'confidence',90,'evidence','restores habitats','originalText','restores habitats')),
    'locations',jsonb_build_array(jsonb_build_object('rawText','London','countryCode','GB','precision','locality','locality','London','evidence','London','confidence',90)));
  perform public.apply_pipeline_brief(rid,1,repeat('b',64),patched);
  if cardinality(public.pipeline_publish_blockers(rid))<>0 then raise exception 'Complete brief was blocked: %',public.pipeline_publish_blockers(rid);end if;
  update public.automation_controls set auto_publish_enabled=false where id='global';
  begin
    perform public.publish_automated_source_record(rid,'unused','wildteam-brief-v1',100::smallint);
    raise exception 'Publication ignored the off switch';
  exception when insufficient_privilege then null;end;
  update public.automation_controls set auto_publish_enabled=true,auto_publish_source_record_id=rid where id='global';
  perform public.publish_automated_source_record(rid,'unused','wildteam-brief-v1',100::smallint);
  if (select status from public.jobs where id=jid)<>'published' then raise exception 'Job did not publish';end if;
  if (select status from public.employers where id=eid)<>'draft' then raise exception 'Job publication published the employer profile';end if;
  perform set_config('wildjobs.test_employer',eid::text,true);
  perform set_config('wildjobs.test_record',rid::text,true);
  -- A source revision racing a model response must invalidate its application.
  update public.job_source_records set source_revision=2 where id=rid;
  begin
    perform public.apply_pipeline_brief(rid,1,repeat('b',64),patched);
    raise exception 'Stale model result was accepted';
  exception when check_violation then null;end;
  reservation=public.reserve_pipeline_ai('fixture-reservation','vacancy','fixture-model',100,100,1000,10000000,2000000,rid);
  if reservation is null then raise exception 'AI budget could not reserve';end if;
  if public.reserve_pipeline_ai('fixture-reservation','vacancy','fixture-model',100,100,1000,10000000,2000000,rid) is not null then raise exception 'Duplicate AI spend was reserved';end if;
  -- Staff evidence remains authoritative even against service writes.
  insert into public.job_source_field_evidence(source_record_id,field_name,value,evidence_text,resolution_status,confidence,source_kind,extraction_method,extractor_version)
    values(rid,'hours_type','part_time','part-time','extracted',100,'staff','manual','fixture');
  update public.job_source_field_evidence set value='full_time',extraction_method='ai' where source_record_id=rid and field_name='hours_type';
  if (select value from public.job_source_field_evidence where source_record_id=rid and field_name='hours_type')<>'part_time' then raise exception 'Staff evidence was overwritten';end if;
end $$;
set local role anon;
do $$
declare eid bigint=current_setting('wildjobs.test_employer')::bigint;
begin
  if not exists(select 1 from public.public_job_employer(eid) where name='Fixture Nature Trust' and profile_published=false and overview is null) then raise exception 'Public job cannot read its minimal employer identity';end if;
  if exists(select 1 from public.employers where id=eid) then raise exception 'Private employer profile was exposed';end if;
  if has_function_privilege('anon','public.apply_pipeline_brief(bigint,integer,text,jsonb)','execute') then raise exception 'Anonymous AI writes permitted';end if;
  if has_table_privilege('anon','public.job_brief_versions','select') then raise exception 'Private evidence is public';end if;
end $$;
reset role;
select pass('Complete pipeline, access boundaries, publication controls and replay assertions passed');
select * from finish();
rollback;
