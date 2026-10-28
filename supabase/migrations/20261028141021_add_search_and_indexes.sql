alter table public.employers
add column search_vector tsvector
generated always as (
  setweight(to_tsvector('english', coalesce(name, '')), 'A')
  || setweight(to_tsvector('english', coalesce(focus, '')), 'B')
  || setweight(to_tsvector('english', coalesce(mission, '')), 'B')
  || setweight(to_tsvector('english', coalesce(overview, '')), 'C')
) stored;

alter table public.jobs
add column search_vector tsvector
generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A')
  || setweight(to_tsvector('english', coalesce(summary, '')), 'A')
  || setweight(to_tsvector('english', coalesce(description, '')), 'B')
  || setweight(to_tsvector('english', coalesce(responsibilities, '')), 'B')
  || setweight(to_tsvector('english', coalesce(requirements, '')), 'B')
  || setweight(to_tsvector('english', coalesce(location_text, '')), 'C')
) stored;

create index employers_search_vector_idx on public.employers using gin (search_vector);
create index jobs_search_vector_idx on public.jobs using gin (search_vector);

create index jobs_employer_id_idx on public.jobs (employer_id);
create index job_career_areas_career_area_id_job_id_idx
on public.job_career_areas (career_area_id, job_id);
create index course_capabilities_capability_id_course_id_idx
on public.course_capabilities (capability_id, course_id);
create index job_capabilities_capability_id_job_id_idx
on public.job_capabilities (capability_id, job_id);

create index job_source_records_job_id_idx on public.job_source_records (job_id)
where job_id is not null;
create index import_runs_source_id_started_at_idx
on public.import_runs (source_id, started_at desc);
create index submission_invites_employer_id_idx on public.submission_invites (employer_id)
where employer_id is not null;
create index submission_invites_created_by_staff_user_id_idx
on public.submission_invites (created_by_staff_user_id);
create index employer_submissions_matched_employer_id_idx
on public.employer_submissions (matched_employer_id)
where matched_employer_id is not null;
create index employer_submissions_resulting_job_id_idx
on public.employer_submissions (resulting_job_id)
where resulting_job_id is not null;
create index moderation_events_job_id_created_at_idx
on public.moderation_events (job_id, created_at)
where job_id is not null;
create index moderation_events_employer_submission_id_created_at_idx
on public.moderation_events (employer_submission_id, created_at)
where employer_submission_id is not null;
create index moderation_events_actor_user_id_idx on public.moderation_events (actor_user_id);

create index saved_jobs_user_id_saved_at_idx on public.saved_jobs (user_id, saved_at desc);
create index saved_jobs_job_id_idx on public.saved_jobs (job_id);
create index candidate_career_area_preferences_career_area_id_user_id_idx
on public.candidate_career_area_preferences (career_area_id, user_id);

create unique index job_source_records_source_external_id_uidx
on public.job_source_records (source_id, external_id)
where external_id is not null;
create unique index job_source_records_source_canonical_url_uidx
on public.job_source_records (source_id, canonical_url)
where canonical_url is not null;

create index employers_public_idx on public.employers (published_at desc, id)
where status = 'published';
create index jobs_public_closing_idx on public.jobs (closes_at, published_at desc, id)
where status = 'published' and withdrawn_at is null;
create index jobs_public_recent_idx on public.jobs (published_at desc, id)
where status = 'published' and withdrawn_at is null;
create index jobs_public_workplace_idx on public.jobs (workplace_type, closes_at, id)
where status = 'published' and withdrawn_at is null;
create index jobs_public_experience_idx on public.jobs (experience_level, closes_at, id)
where status = 'published' and withdrawn_at is null;
create index jobs_public_field_based_idx on public.jobs (closes_at, id)
where status = 'published' and withdrawn_at is null and is_field_based = true;
create index jobs_public_salary_idx on public.jobs (salary_min, id)
where status = 'published' and withdrawn_at is null and salary_min is not null;

create index courses_active_display_idx on public.courses (title, id)
where is_active = true;
create index employer_submissions_open_idx on public.employer_submissions (status, received_at)
where resolved_at is null;
create index submission_invites_available_idx on public.submission_invites (expires_at, id)
where used_at is null and revoked_at is null;
