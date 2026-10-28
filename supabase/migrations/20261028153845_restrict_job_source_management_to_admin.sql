drop policy "Staff can manage job sources" on public.job_sources;

create policy "Administrators can manage job sources"
on public.job_sources
for all
to authenticated
using (
  exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.staff_members
    where user_id = (select auth.uid())
      and is_active
      and role = 'admin'
  )
);
