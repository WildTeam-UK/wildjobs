-- Pilot guides use the existing canonical directory, not a second jobs database.
alter table public.directory_jobs
 add column salary_full_time_evidence boolean not null default false,
 add column salary_evidence_hash text;
comment on column public.directory_jobs.salary_evidence_hash is 'Feed hash for which the retained original explicitly supports full-time hours. Stale evidence cannot qualify a salary.';
create index directory_jobs_guide_history on public.directory_jobs(posted_at,id) where merged_into is null;
create table public.directory_role_aliases (
 normalized_title text primary key check(length(normalized_title) between 1 and 300),
 role_slug text check(role_slug = 'ecologist'),
 updated_at timestamptz not null default now()
);
comment on column public.directory_role_aliases.role_slug is 'NULL is an explicit exclusion. Only staff-reviewed title mappings are stored here.';
alter table public.directory_role_aliases enable row level security;
revoke all on public.directory_role_aliases from anon,authenticated;
create policy role_alias_read on public.directory_role_aliases for select to anon,authenticated using(true);
grant select on public.directory_role_aliases to anon,authenticated;
grant all on public.directory_role_aliases to service_role;

create table public.directory_guide_evidence (
 job_id bigint not null references public.directory_jobs(id) on delete cascade,
 feed_hash text not null,
 source_url text not null,
 source_kind text not null check(source_kind in ('advert','feed')),
 source_text text not null check(length(source_text) <= 40000),
 captured_at timestamptz not null default now(),
 primary key(job_id,feed_hash)
);
alter table public.directory_guide_evidence enable row level security;
revoke all on public.directory_guide_evidence from anon,authenticated;
grant all on public.directory_guide_evidence to service_role;

create table public.career_guide_revisions (
 id bigint generated always as identity primary key,
 guide_slug text not null check(guide_slug in ('wildlife-conservation','ecologist')),
 input_hash text not null,
 content jsonb not null check(jsonb_typeof(content)='object'),
 evidence jsonb not null check(jsonb_typeof(evidence)='object'),
 status text not null default 'draft' check(status in ('draft','published','archived')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 unique(guide_slug,input_hash),
 check(status <> 'published' or reviewed_at is not null)
);
create unique index career_guide_one_published on public.career_guide_revisions(guide_slug) where status='published';
create unique index career_guide_one_draft on public.career_guide_revisions(guide_slug) where status='draft';
alter table public.career_guide_revisions enable row level security;
revoke all on public.career_guide_revisions from anon,authenticated;
revoke all on sequence public.career_guide_revisions_id_seq from anon,authenticated;
create policy reviewed_guide_read on public.career_guide_revisions for select to anon,authenticated using(status='published');
grant select on public.career_guide_revisions to anon,authenticated;
grant all on public.career_guide_revisions to service_role;
grant usage,select on sequence public.career_guide_revisions_id_seq to service_role;

-- Publication swaps versions atomically. Only the authenticated staff server action
-- can invoke this function with server credentials; clients have no write grants.
create function public.publish_career_guide(p_id bigint, p_input_hash text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare target public.career_guide_revisions;
begin
 select * into target from public.career_guide_revisions where id=p_id;
 if not found then return false; end if;
 perform pg_advisory_xact_lock(hashtext('career-guide:'||target.guide_slug));
 select * into target from public.career_guide_revisions where id=p_id for update;
 if target.status<>'draft' or target.input_hash<>p_input_hash then return false; end if;
 update public.career_guide_revisions set status='archived' where guide_slug=target.guide_slug and status='published';
 update public.career_guide_revisions set status='published',reviewed_at=now() where id=p_id;
 return true;
end $$;
revoke all on function public.publish_career_guide(bigint,text) from public,anon,authenticated;
grant execute on function public.publish_career_guide(bigint,text) to service_role;
