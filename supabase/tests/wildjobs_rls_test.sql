begin;

create extension if not exists pgtap with schema extensions;

select plan(20);

insert into auth.users (id, email)
values
  ('10000000-0000-0000-0000-000000000001', 'candidate-one@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'candidate-two@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'staff@example.test');

insert into public.candidate_profiles (user_id)
values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002');

insert into public.staff_members (user_id, role)
values ('10000000-0000-0000-0000-000000000003', 'reviewer');

insert into public.employers (
  slug,
  name,
  status,
  mission,
  overview,
  published_at
)
values
  (
    'published-employer',
    'Published Employer',
    'published',
    'A public mission.',
    'A reviewed public employer.',
    now() - interval '1 day'
  ),
  ('draft-employer', 'Draft Employer', 'draft', 'A draft mission.', 'A draft profile.', null);

insert into public.jobs (
  slug,
  employer_id,
  title,
  summary,
  description,
  status,
  location_text,
  country_code,
  workplace_type,
  contract_type,
  hours_type,
  experience_level,
  salary_text,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  application_url,
  posted_at,
  closes_at,
  published_at
)
select
  'current-job',
  id,
  'Current role',
  'A current published role.',
  'A complete current role description.',
  'published',
  'United Kingdom',
  'GB',
  'hybrid',
  'permanent',
  'full_time',
  'open',
  '£30,000–£35,000',
  30000,
  35000,
  'GBP',
  'year',
  'https://example.test/current-job',
  current_date - 1,
  current_date + 30,
  now() - interval '1 day'
from public.employers
where slug = 'published-employer';

insert into public.jobs (
  slug,
  employer_id,
  title,
  summary,
  description,
  status
)
select
  'draft-job',
  id,
  'Draft role',
  'A draft role.',
  'A role awaiting review.',
  'draft'
from public.employers
where slug = 'draft-employer';

insert into public.jobs (
  slug,
  employer_id,
  title,
  summary,
  description,
  status,
  location_text,
  country_code,
  workplace_type,
  contract_type,
  hours_type,
  experience_level,
  salary_text,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  application_url,
  posted_at,
  closes_at,
  published_at
)
select
  'expired-saved-job',
  id,
  'Expired saved role',
  'An expired role saved by one candidate.',
  'A complete expired role description.',
  'expired',
  'United Kingdom',
  'GB',
  'remote',
  'fixed_term',
  'part_time',
  'developing',
  '£25,000–£28,000',
  25000,
  28000,
  'GBP',
  'year',
  'https://example.test/expired-job',
  current_date - 45,
  current_date - 1,
  now() - interval '45 days'
from public.employers
where slug = 'published-employer';

insert into public.saved_jobs (user_id, job_id)
select '10000000-0000-0000-0000-000000000001', id
from public.jobs
where slug in ('current-job', 'expired-saved-job');

insert into public.job_sources (name, source_type, is_active)
values ('Test manual source', 'manual_curation', true);

insert into public.submission_invites (
  token_hash,
  invitee_email,
  created_by_staff_user_id,
  expires_at,
  used_at
)
values (
  repeat('a', 64),
  'employer@example.test',
  '10000000-0000-0000-0000-000000000003',
  now() + interval '7 days',
  now()
);

insert into public.employer_submissions (
  invite_id,
  contact_name,
  contact_email,
  organisation_name,
  role_title,
  salary_text,
  closing_date,
  location_text,
  workplace_type,
  role_summary,
  application_url,
  authority_confirmed_at,
  completeness_score
)
select
  id,
  'Test Contact',
  'employer@example.test',
  'Test Organisation',
  'Test Role',
  '£30,000',
  current_date + 30,
  'United Kingdom',
  'hybrid',
  'A complete test submission.',
  'https://example.test/apply',
  now(),
  100
from public.submission_invites
where token_hash = repeat('a', 64);

select is(
  (
    select count(*)
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where pg_namespace.nspname = 'public'
      and pg_class.relkind = 'r'
      and pg_class.relname in (
        'employers', 'jobs', 'career_areas', 'job_career_areas', 'courses',
        'capabilities', 'course_capabilities', 'job_capabilities', 'staff_members',
        'job_sources', 'job_source_records', 'import_runs', 'submission_invites',
        'employer_submissions', 'moderation_events', 'candidate_profiles',
        'saved_jobs', 'candidate_preferences', 'candidate_career_area_preferences',
        'candidate_workplace_preferences', 'candidate_contract_preferences'
      )
      and pg_class.relrowsecurity
  ),
  21::bigint,
  'RLS is enabled on every WildJobs public table'
);

set local role anon;

select results_eq(
  $$select slug from public.jobs order by slug$$,
  array['current-job'::text],
  'Anonymous visitors see only current published jobs'
);

select results_eq(
  $$select slug from public.employers order by slug$$,
  array['published-employer'::text],
  'Anonymous visitors see only published employers'
);

select throws_ok(
  $$select count(*) from public.employer_submissions$$,
  null,
  null,
  'Anonymous visitors cannot query employer submissions'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000001';

select is(
  (select count(*) from public.candidate_profiles),
  1::bigint,
  'A candidate sees only their own profile'
);

select is(
  (select count(*) from public.saved_jobs),
  2::bigint,
  'A candidate sees only their own saved jobs'
);

select results_eq(
  $$select slug from public.jobs where slug = 'expired-saved-job'$$,
  array['expired-saved-job'::text],
  'A candidate can revisit an expired job they saved'
);

select is(
  (select count(*) from public.jobs where slug = 'draft-job'),
  0::bigint,
  'A candidate cannot see a draft job'
);

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000002';

select is(
  (select count(*) from public.saved_jobs),
  0::bigint,
  'Another candidate cannot see the first candidate saved jobs'
);

select lives_ok(
  $$
    insert into public.saved_jobs (user_id, job_id)
    select '10000000-0000-0000-0000-000000000002', id
    from public.jobs where slug = 'current-job'
  $$,
  'A candidate can save a current job for themselves'
);

select is(
  (select count(*) from public.saved_jobs),
  1::bigint,
  'A candidate can read a job they just saved'
);

delete from public.saved_jobs
where user_id = '10000000-0000-0000-0000-000000000002';

select throws_ok(
  $$
    insert into public.saved_jobs (user_id, job_id)
    select '10000000-0000-0000-0000-000000000001', id
    from public.jobs where slug = 'current-job'
  $$,
  null,
  null,
  'A candidate cannot create a saved job for another candidate'
);

select is(
  (select count(*) from public.employer_submissions),
  0::bigint,
  'A candidate cannot read employer submissions'
);

select throws_ok(
  $$insert into public.employer_submissions (invite_id) values (1)$$,
  null,
  null,
  'A candidate cannot insert directly into employer submissions'
);

set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000003';

select is(
  (select count(*) from public.jobs),
  3::bigint,
  'An active staff member can read every job state'
);

select is(
  (select count(*) from public.employer_submissions),
  1::bigint,
  'An active staff member can read employer submissions'
);

select lives_ok(
  $$
    insert into public.moderation_events (job_id, actor_user_id, action)
    select id, '10000000-0000-0000-0000-000000000003', 'assigned'
    from public.jobs where slug = 'draft-job'
  $$,
  'An active staff member can append their own moderation event'
);

select results_eq(
  $$
    update public.candidate_profiles
    set onboarding_complete = true
    where user_id = '10000000-0000-0000-0000-000000000001'
    returning user_id
  $$,
  $$select user_id from public.candidate_profiles where false$$,
  'Staff have no routine access to candidate-owned data'
);

reset role;
update public.staff_members
set is_active = false
where user_id = '10000000-0000-0000-0000-000000000003';

set local role authenticated;
set local "request.jwt.claim.sub" = '10000000-0000-0000-0000-000000000003';

select is(
  (select count(*) from public.jobs),
  1::bigint,
  'An inactive staff member falls back to public job access'
);

select is(
  (select count(*) from public.employer_submissions),
  0::bigint,
  'An inactive staff member cannot read employer submissions'
);

select * from finish();
rollback;
