drop policy "Public can read published employers" on public.employers;
drop policy "Staff can read all employers" on public.employers;

create policy "Anonymous visitors can read published employers"
on public.employers for select
to anon
using (status = 'published' and published_at <= now());

create policy "Signed in users can read permitted employers"
on public.employers for select
to authenticated
using (
  (status = 'published' and published_at <= now())
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

drop policy "Public can read current jobs" on public.jobs;
drop policy "Candidates can read jobs they saved" on public.jobs;
drop policy "Staff can read all jobs" on public.jobs;

create policy "Anonymous visitors can read current jobs"
on public.jobs for select
to anon
using (
  status = 'published'
  and published_at <= now()
  and closes_at >= current_date
  and withdrawn_at is null
);

create policy "Signed in users can read permitted jobs"
on public.jobs for select
to authenticated
using (
  (
    status = 'published'
    and published_at <= now()
    and closes_at >= current_date
    and withdrawn_at is null
  )
  or exists (
    select 1 from public.saved_jobs
    where saved_jobs.job_id = jobs.id
      and saved_jobs.user_id = (select auth.uid())
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

drop policy "Public can read active career areas" on public.career_areas;
drop policy "Staff can manage career areas" on public.career_areas;

create policy "Anonymous visitors can read active career areas"
on public.career_areas for select
to anon
using (is_active);

create policy "Signed in users can read permitted career areas"
on public.career_areas for select
to authenticated
using (
  is_active
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create career areas"
on public.career_areas for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update career areas"
on public.career_areas for update
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

drop policy "Public can read active courses" on public.courses;
drop policy "Staff can manage courses" on public.courses;

create policy "Anonymous visitors can read active courses"
on public.courses for select
to anon
using (is_active and availability_status = 'available');

create policy "Signed in users can read permitted courses"
on public.courses for select
to authenticated
using (
  (is_active and availability_status = 'available')
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create courses"
on public.courses for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update courses"
on public.courses for update
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

drop policy "Public can read active capabilities" on public.capabilities;
drop policy "Staff can manage capabilities" on public.capabilities;

create policy "Anonymous visitors can read active capabilities"
on public.capabilities for select
to anon
using (is_active);

create policy "Signed in users can read permitted capabilities"
on public.capabilities for select
to authenticated
using (
  is_active
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create capabilities"
on public.capabilities for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update capabilities"
on public.capabilities for update
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

drop policy "Public can read current job career areas" on public.job_career_areas;
drop policy "Staff can manage job career areas" on public.job_career_areas;

create policy "Anonymous visitors can read current job career areas"
on public.job_career_areas for select
to anon
using (
  exists (select 1 from public.jobs where jobs.id = job_career_areas.job_id)
  and exists (
    select 1 from public.career_areas
    where career_areas.id = job_career_areas.career_area_id
  )
);

create policy "Signed in users can read permitted job career areas"
on public.job_career_areas for select
to authenticated
using (
  (
    exists (select 1 from public.jobs where jobs.id = job_career_areas.job_id)
    and exists (
      select 1 from public.career_areas
      where career_areas.id = job_career_areas.career_area_id
    )
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create job career areas"
on public.job_career_areas for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update job career areas"
on public.job_career_areas for update
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

drop policy "Public can read active course capabilities" on public.course_capabilities;
drop policy "Staff can manage course capabilities" on public.course_capabilities;

create policy "Anonymous visitors can read active course capabilities"
on public.course_capabilities for select
to anon
using (
  exists (select 1 from public.courses where courses.id = course_capabilities.course_id)
  and exists (
    select 1 from public.capabilities
    where capabilities.id = course_capabilities.capability_id
  )
);

create policy "Signed in users can read permitted course capabilities"
on public.course_capabilities for select
to authenticated
using (
  (
    exists (select 1 from public.courses where courses.id = course_capabilities.course_id)
    and exists (
      select 1 from public.capabilities
      where capabilities.id = course_capabilities.capability_id
    )
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create course capabilities"
on public.course_capabilities for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update course capabilities"
on public.course_capabilities for update
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

drop policy "Public can read current job capabilities" on public.job_capabilities;
drop policy "Staff can manage job capabilities" on public.job_capabilities;

create policy "Anonymous visitors can read current job capabilities"
on public.job_capabilities for select
to anon
using (
  exists (select 1 from public.jobs where jobs.id = job_capabilities.job_id)
  and exists (
    select 1 from public.capabilities
    where capabilities.id = job_capabilities.capability_id
  )
);

create policy "Signed in users can read permitted job capabilities"
on public.job_capabilities for select
to authenticated
using (
  (
    exists (select 1 from public.jobs where jobs.id = job_capabilities.job_id)
    and exists (
      select 1 from public.capabilities
      where capabilities.id = job_capabilities.capability_id
    )
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create job capabilities"
on public.job_capabilities for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update job capabilities"
on public.job_capabilities for update
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
