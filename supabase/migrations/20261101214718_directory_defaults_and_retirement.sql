-- The advertised closing date wins; the listing otherwise retires 30 days after posting.
-- is_active records feed presence. Public queries also apply the deadline, so retirement
-- does not depend on a scheduled request running at the exact expiry time.
alter table public.directory_jobs add column closes_at timestamptz;
alter table public.directory_jobs alter column workplace set default 'On-site';
alter table public.directory_jobs alter column hours_type set default 'Full time';
alter table public.directory_jobs alter column contract_type set default 'Permanent';
update public.directory_jobs set
 workplace=case when workplace in ('Remote','Hybrid') then workplace else 'On-site' end,
 hours_type=case when hours_type in ('Part time','Full time · Part time') then hours_type else 'Full time' end,
 contract_type=case when contract_type='Fixed term' then contract_type else 'Permanent' end;
update public.career_areas set title='Wildlife Conservation' where slug='conservation-wildlife';

-- Saved history remains readable, but expired listings cannot be newly saved.
alter policy saved_insert on public.directory_saved_jobs with check(
 user_id=(select auth.uid()) and exists(
  select 1 from public.directory_jobs where id=job_id and is_active
  and coalesce(closes_at,posted_at+interval '720 hours')>now()
 )
);
