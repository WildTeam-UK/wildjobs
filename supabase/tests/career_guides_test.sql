begin;
create extension if not exists pgtap with schema extensions;
select no_plan();
insert into public.directory_jobs(feed_id,slug,source_url,title,organisation_name,feed_text,feed_hash,summary,location_text,salary_text,posted_at)
 values('guide-evidence-test','guide-evidence-test','https://example.test/guide-evidence','Ecologist','Test Trust','Survey habitats.','old-version','Survey habitats.','Exeter','£30,000 per year',now());
insert into public.directory_guide_evidence(job_id,feed_hash,source_url,source_kind,source_text)
 select id,'old-version',source_url,'advert','Original source text' from public.directory_jobs where slug='guide-evidence-test';
insert into public.directory_guide_evidence(job_id,feed_hash,source_url,source_kind,source_text)
 select id,'new-version',source_url,'advert','Changed source text' from public.directory_jobs where slug='guide-evidence-test';
select is((select count(*) from public.directory_guide_evidence where job_id=(select id from public.directory_jobs where slug='guide-evidence-test')),2::bigint,'A changed advert retains both source versions');
insert into public.directory_role_aliases(normalized_title,role_slug) values('test ecologst','ecologist');
insert into public.career_guide_revisions(guide_slug,input_hash,content,evidence)
 values('ecologist','test-first','{}','{}');
set local role anon;
select is((select count(*) from public.directory_role_aliases where normalized_title='test ecologst'),1::bigint,'Reviewed aliases are public');
select is((select count(*) from public.career_guide_revisions where input_hash='test-first'),0::bigint,'Drafts are not public');
select throws_ok($$select * from public.directory_guide_evidence$$,'42501',null,'Original advert snapshots are private');
select throws_ok($$insert into public.directory_role_aliases values('other','ecologist',now())$$,'42501',null,'Visitors cannot create role mappings');
select throws_ok($$select public.publish_career_guide(1,'test-first')$$,'42501',null,'Visitors cannot publish guides');
reset role;
set local role authenticated;
select is((select count(*) from public.career_guide_revisions where input_hash='test-first'),0::bigint,'Candidate authentication cannot reveal drafts');
select throws_ok($$update public.career_guide_revisions set status='published'$$,'42501',null,'Candidates cannot bypass staff review');
reset role;
set local role service_role;
select is(public.publish_career_guide((select id from public.career_guide_revisions where input_hash='test-first'),'wrong-hash'),false,'Changed review inputs are rejected');
select is(public.publish_career_guide((select id from public.career_guide_revisions where input_hash='test-first'),'test-first'),true,'Server can publish the reviewed version');
select is(public.publish_career_guide((select id from public.career_guide_revisions where input_hash='test-first'),'test-first'),false,'A publication cannot be repeated');
insert into public.career_guide_revisions(guide_slug,input_hash,content,evidence) values('ecologist','test-second','{}','{}');
select is(public.publish_career_guide((select id from public.career_guide_revisions where input_hash='test-second'),'test-second'),true,'The next version can be approved');
select is((select status from public.career_guide_revisions where input_hash='test-first'),'archived','Previous version is preserved');
reset role;
set local role anon;
select is((select count(*) from public.career_guide_revisions where input_hash in ('test-first','test-second')),1::bigint,'Only the current reviewed version is public');
reset role;
select * from finish();
rollback;
