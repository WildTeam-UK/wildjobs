begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into public.directory_organisations(name, website_url)
values ('Employer Profile Fixture', 'https://example.test'), ('Other Employer Fixture', 'https://other.example.test');

set local role service_role;
select is((select count(*) from public.claim_employer_research()), 0::bigint, 'The migration starts with routine research disabled');
select is((select count(*) from public.claim_employer_research('Employer Profile Fixture')), 1::bigint, 'A bounded pilot can claim the intended employer');
select is((select count(*) from public.claim_employer_research('Other Employer Fixture')), 0::bigint, 'An active lease prevents concurrent research');
select is(public.finish_employer_research('Employer Profile Fixture', gen_random_uuid(), 'published', '{}', 'example.test', 0, 0), 'superseded', 'An unrelated lease cannot publish');
select is(public.finish_employer_research('Employer Profile Fixture',
  (select lease_id from public.employer_research_tasks where organisation_name = 'Employer Profile Fixture'),
  'published', '{"claims":[{"kind":"overview","text":"Factual overview of the conservation organisation.","sourceUrl":"https://example.test/about","sourceTitle":"About"},{"kind":"work","text":"Factual description of the habitat restoration project.","sourceUrl":"https://example.test/projects","sourceTitle":"Projects"}]}',
  'example.test', 100, 50), 'published', 'The current lease can publish');
select is((select count(*) from public.claim_employer_research('Employer Profile Fixture')), 0::bigint, 'A successful profile is not researched again immediately');
reset role;

set local role anon;
select is((select slug from public.employer_profiles where organisation_name = 'Employer Profile Fixture'), 'employer-profile-fixture', 'Visitors can discover a published profile');
select throws_ok($$ select lease_id from public.employer_research_tasks $$, '42501', null, 'Visitors cannot inspect research leases');
select throws_ok($$ select public.claim_employer_research('Other Employer Fixture') $$, '42501', null, 'Visitors cannot start paid research');
reset role;

update public.directory_organisations set website_url = 'https://changed.example.test' where name = 'Employer Profile Fixture';
set local role anon;
select is((select count(*) from public.employer_profiles where organisation_name = 'Employer Profile Fixture'), 0::bigint, 'A changed website hides the old published content');
reset role;
update public.directory_organisations set website_url = 'https://example.test' where name = 'Employer Profile Fixture';
update public.employer_profiles set researched_at = now() - interval '181 days' where organisation_name = 'Employer Profile Fixture';
set local role anon;
select is((select count(*) from public.employer_profiles where organisation_name = 'Employer Profile Fixture'), 0::bigint, 'Stale content is withdrawn from public reads');
reset role;

select * from finish();
rollback;
