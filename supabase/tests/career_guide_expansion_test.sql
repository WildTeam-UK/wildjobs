begin;
select no_plan();
insert into public.directory_jobs(feed_id,slug,source_url,title,organisation_name,feed_text,feed_hash,summary,location_text,salary_text,posted_at)
values('career-expansion-test','career-expansion-test','https://example.test/career-expansion','Project Officer','Test Trust','Brief excerpt','current','Brief excerpt','Exeter','Not stated',now());
insert into public.directory_guide_evidence(job_id,feed_hash,source_url,source_kind,source_text)
select id,'detailed',source_url,'advert',repeat('Detailed original responsibilities and experience. ',10)
from public.directory_jobs where slug='career-expansion-test';
insert into public.directory_guide_evidence(job_id,feed_hash,source_url,source_kind,source_text)
select id,'closed',source_url,'advert','Ad closed! Sorry, this ad is no longer live. Similar jobs '||repeat('Other vacancy ',30)
from public.directory_jobs where slug='career-expansion-test';
select is((select is_detailed from public.directory_guide_evidence where job_id=(select id from public.directory_jobs where slug='career-expansion-test') and feed_hash='detailed'),true,'Detailed retained originals can contribute threshold evidence');
select is((select is_detailed from public.directory_guide_evidence where job_id=(select id from public.directory_jobs where slug='career-expansion-test') and feed_hash='closed'),false,'Closed-advert landing pages are not detailed evidence');
set local role service_role;
insert into public.directory_role_aliases(normalized_title,role_slug)
select 'career-test-'||slug,slug from unnest(array['project-manager','project-officer','environmental-educator','biologist','chief-executive']) slug;
insert into public.career_guide_revisions(guide_slug,input_hash,content,evidence)
select slug,'career-expansion-test-'||slug,'{}','{}' from unnest(array['project-manager','project-officer','environmental-educator','biologist','chief-executive']) slug;
select is((select count(*) from public.career_guide_revisions where input_hash like 'career-expansion-test-%'),5::bigint,'All five occupation families support evidence drafts');
reset role;
set local role anon;
select is((select count(*) from public.career_guide_revisions where input_hash like 'career-expansion-test-%'),0::bigint,'New career drafts are private');
select throws_ok($$select is_detailed from public.directory_guide_evidence$$,'42501',null,'Private original evidence metadata remains inaccessible to visitors');
reset role;
set local role authenticated;
select throws_ok($$select source_text from public.directory_guide_evidence$$,'42501',null,'Candidate accounts cannot read retained advert bodies');
reset role;
set local role service_role;
select is(public.publish_career_guide((select id from public.career_guide_revisions where input_hash='career-expansion-test-project-officer'),'career-expansion-test-project-officer'),true,'Atomic review action supports a new career family');
reset role;
set local role anon;
select is((select count(*) from public.career_guide_revisions where input_hash like 'career-expansion-test-%'),1::bigint,'Only the approved new guide becomes public');
reset role;
select * from finish();
rollback;
