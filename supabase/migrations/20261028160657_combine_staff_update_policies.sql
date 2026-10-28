drop policy "Administrators can update employers" on public.employers;
drop policy "Reviewers can update unpublished employers" on public.employers;

create policy "Staff can update permitted employers"
on public.employers for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and (
        role = 'admin'
        or (role = 'reviewer' and employers.status in ('draft', 'in_review'))
      )
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and (
        role = 'admin'
        or (role = 'reviewer' and employers.status in ('draft', 'in_review'))
      )
  )
);

drop policy "Administrators can update jobs" on public.jobs;
drop policy "Reviewers can update unpublished jobs" on public.jobs;

create policy "Staff can update permitted jobs"
on public.jobs for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and (
        role = 'admin'
        or (role = 'reviewer' and jobs.status in ('draft', 'in_review'))
      )
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and (
        role = 'admin'
        or (role = 'reviewer' and jobs.status in ('draft', 'in_review'))
      )
  )
);
