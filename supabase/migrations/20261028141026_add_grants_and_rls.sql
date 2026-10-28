revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.employers,
  public.jobs,
  public.career_areas,
  public.job_career_areas,
  public.courses,
  public.capabilities,
  public.course_capabilities,
  public.job_capabilities
to anon, authenticated;

grant insert, update on table
  public.employers,
  public.jobs,
  public.career_areas,
  public.job_career_areas,
  public.courses,
  public.capabilities,
  public.course_capabilities,
  public.job_capabilities
to authenticated;

grant select, insert, update on table
  public.candidate_profiles,
  public.candidate_preferences
to authenticated;
grant delete on table public.candidate_preferences to authenticated;
grant select, insert, delete on table
  public.saved_jobs,
  public.candidate_career_area_preferences,
  public.candidate_workplace_preferences,
  public.candidate_contract_preferences
to authenticated;

grant select, insert, update on table
  public.job_sources,
  public.job_source_records,
  public.submission_invites
to authenticated;
grant select on table public.import_runs to authenticated;
grant select, update on table public.employer_submissions to authenticated;
grant select, insert on table public.moderation_events to authenticated;
grant select on table public.staff_members to authenticated;

grant usage, select on all sequences in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

alter table public.employers enable row level security;
alter table public.jobs enable row level security;
alter table public.career_areas enable row level security;
alter table public.job_career_areas enable row level security;
alter table public.courses enable row level security;
alter table public.capabilities enable row level security;
alter table public.course_capabilities enable row level security;
alter table public.job_capabilities enable row level security;
alter table public.staff_members enable row level security;
alter table public.job_sources enable row level security;
alter table public.job_source_records enable row level security;
alter table public.import_runs enable row level security;
alter table public.submission_invites enable row level security;
alter table public.employer_submissions enable row level security;
alter table public.moderation_events enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.candidate_preferences enable row level security;
alter table public.candidate_career_area_preferences enable row level security;
alter table public.candidate_workplace_preferences enable row level security;
alter table public.candidate_contract_preferences enable row level security;

create policy "Public can read published employers"
on public.employers for select
to anon, authenticated
using (status = 'published' and published_at <= now());

create policy "Staff can read all employers"
on public.employers for select
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create employers"
on public.employers for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update employers"
on public.employers for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Public can read current jobs"
on public.jobs for select
to anon, authenticated
using (
  status = 'published'
  and published_at <= now()
  and closes_at >= current_date
  and withdrawn_at is null
);

create policy "Candidates can read jobs they saved"
on public.jobs for select
to authenticated
using (
  exists (
    select 1 from public.saved_jobs
    where saved_jobs.job_id = jobs.id
      and saved_jobs.user_id = (select auth.uid())
  )
);

create policy "Staff can read all jobs"
on public.jobs for select
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create jobs"
on public.jobs for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update jobs"
on public.jobs for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Public can read active career areas"
on public.career_areas for select
to anon, authenticated
using (is_active);

create policy "Public can read active courses"
on public.courses for select
to anon, authenticated
using (is_active and availability_status = 'available');

create policy "Public can read active capabilities"
on public.capabilities for select
to anon, authenticated
using (is_active);

create policy "Public can read current job career areas"
on public.job_career_areas for select
to anon, authenticated
using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_career_areas.job_id
  )
  and exists (
    select 1 from public.career_areas
    where career_areas.id = job_career_areas.career_area_id
  )
);

create policy "Public can read active course capabilities"
on public.course_capabilities for select
to anon, authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = course_capabilities.course_id
  )
  and exists (
    select 1 from public.capabilities
    where capabilities.id = course_capabilities.capability_id
  )
);

create policy "Public can read current job capabilities"
on public.job_capabilities for select
to anon, authenticated
using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_capabilities.job_id
  )
  and exists (
    select 1 from public.capabilities
    where capabilities.id = job_capabilities.capability_id
  )
);

create policy "Staff can manage career areas"
on public.career_areas for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage job career areas"
on public.job_career_areas for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage courses"
on public.courses for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage capabilities"
on public.capabilities for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage course capabilities"
on public.course_capabilities for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage job capabilities"
on public.job_capabilities for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can read their own active membership"
on public.staff_members for select
to authenticated
using ((select auth.uid()) = user_id and is_active);

create policy "Staff can manage job sources"
on public.job_sources for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage source records"
on public.job_source_records for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can read import runs"
on public.import_runs for select
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage submission invites"
on public.submission_invites for all
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can read employer submissions"
on public.employer_submissions for select
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update employer submissions"
on public.employer_submissions for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can read moderation events"
on public.moderation_events for select
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can append moderation events"
on public.moderation_events for insert
to authenticated
with check (
  actor_user_id = (select auth.uid())
  and exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Candidates can read their profile"
on public.candidate_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Candidates can create their profile"
on public.candidate_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Candidates can update their profile"
on public.candidate_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Candidates can read their saved jobs"
on public.saved_jobs for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Candidates can save jobs"
on public.saved_jobs for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.jobs
    where jobs.id = saved_jobs.job_id
  )
);

create policy "Candidates can remove saved jobs"
on public.saved_jobs for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Candidates can read their preferences"
on public.candidate_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Candidates can create their preferences"
on public.candidate_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Candidates can update their preferences"
on public.candidate_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Candidates can remove their preferences"
on public.candidate_preferences for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Candidates manage their career area preferences"
on public.candidate_career_area_preferences for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Candidates manage their workplace preferences"
on public.candidate_workplace_preferences for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Candidates manage their contract preferences"
on public.candidate_contract_preferences for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
