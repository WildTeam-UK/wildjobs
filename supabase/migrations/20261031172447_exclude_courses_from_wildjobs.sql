alter table public.courses
  add column is_job_search_excluded boolean not null default false;

alter table public.courses
  add constraint courses_excluded_not_filter_visible
  check (not is_job_search_excluded or not is_filter_visible);

comment on column public.courses.is_job_search_excluded is
  'Staff override that keeps a LearnWorlds course synced but excludes it from WildJobs matching and filters.';
