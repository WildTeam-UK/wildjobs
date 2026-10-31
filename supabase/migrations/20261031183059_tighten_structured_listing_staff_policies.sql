drop policy "Staff can manage job occupations" on public.job_occupations;
drop policy "Staff can manage job benefits" on public.job_benefits;
drop policy "Staff can manage employer benefits" on public.employer_benefits;
drop policy "Staff can manage job locations" on public.job_locations;

create policy "Staff can create job occupations"
on public.job_occupations for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update job occupations"
on public.job_occupations for update
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

create policy "Staff can create job benefits"
on public.job_benefits for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update job benefits"
on public.job_benefits for update
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

create policy "Staff can create employer benefits"
on public.employer_benefits for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update employer benefits"
on public.employer_benefits for update
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

create policy "Staff can create job locations"
on public.job_locations for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update job locations"
on public.job_locations for update
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
