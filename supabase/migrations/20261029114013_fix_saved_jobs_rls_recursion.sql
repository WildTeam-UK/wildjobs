create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.candidate_has_saved_job(p_job_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.saved_jobs
    where saved_jobs.job_id = p_job_id
      and saved_jobs.user_id = (select auth.uid())
  );
$$;

revoke all on function private.candidate_has_saved_job(bigint) from public, anon;
grant execute on function private.candidate_has_saved_job(bigint) to authenticated;

drop policy if exists "Signed in users can read permitted jobs" on public.jobs;

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
  or private.candidate_has_saved_job(jobs.id)
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);
