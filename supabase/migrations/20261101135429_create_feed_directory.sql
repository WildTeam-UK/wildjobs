-- Feed cards replace the editorial pipeline. Existing tables are retired separately at cutover.
create table public.directory_jobs (
 id bigint generated always as identity (start with 1000000) primary key,
 feed_id text not null unique, slug text not null unique, source_url text not null,
 title text not null, organisation_name text not null, feed_text text not null,
 feed_hash text not null, processed_hash text,
 summary text not null, summary_source text not null default 'source' check(summary_source in ('source','ai')),
 sector_slugs text[] not null default '{}', course_slugs text[] not null default '{}',
 location_text text not null, locality text, region text, country_code text,
 salary_text text not null, salary_min numeric,
 workplace text not null default 'Not specified' check(workplace in ('On-site','Remote','Hybrid','Not specified')),
 hours_type text, contract_type text, engagement_type text,
 posted_at timestamptz not null, first_seen_at timestamptz not null default now(),
 last_seen_at timestamptz not null default now(), is_active boolean not null default true,
 updated_at timestamptz not null default now()
);
create index directory_jobs_pending on public.directory_jobs(first_seen_at) where is_active and processed_hash is distinct from feed_hash;
create index directory_jobs_recent on public.directory_jobs(posted_at desc) where is_active;
create table public.directory_organisations(name text primary key, logo_url text);
insert into public.directory_organisations(name,logo_url)
 select name, max(logo_url) from public.employers group by name;
create table public.directory_settings (
 id boolean primary key default true check(id), enabled boolean not null default false,
 next_feed_at timestamptz not null default now(), last_feed_at timestamptz,
 running_until timestamptz, last_error text
);
insert into public.directory_settings(id) values(true);
create table public.directory_runs (
 id bigint generated always as identity primary key, started_at timestamptz not null default now(),
 finished_at timestamptz, status text not null default 'running', feed_seen integer not null default 0,
 changed integer not null default 0, ai_completed integer not null default 0,
 input_tokens integer not null default 0, output_tokens integer not null default 0,
 estimated_cost_usd numeric not null default 0, error text
);
create table public.directory_saved_jobs (
 user_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
 job_id bigint not null references public.directory_jobs(id) on delete cascade,
 saved_at timestamptz not null default now(), primary key(user_id,job_id)
);
alter table public.directory_jobs enable row level security;
alter table public.directory_organisations enable row level security;
alter table public.directory_settings enable row level security;
alter table public.directory_runs enable row level security;
alter table public.directory_saved_jobs enable row level security;
create policy directory_read on public.directory_jobs for select to anon,authenticated using(true);
create policy organisation_read on public.directory_organisations for select to anon,authenticated using(true);
create policy saved_read on public.directory_saved_jobs for select to authenticated using(user_id=(select auth.uid()));
create policy saved_delete on public.directory_saved_jobs for delete to authenticated using(user_id=(select auth.uid()));
create policy saved_insert on public.directory_saved_jobs for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.directory_jobs where id=job_id and is_active));
grant select on public.directory_jobs,public.directory_organisations to anon,authenticated;
grant select,insert,delete on public.directory_saved_jobs to authenticated;
grant all on public.directory_jobs,public.directory_organisations,public.directory_settings,public.directory_runs,public.directory_saved_jobs to service_role;
grant usage,select on sequence public.directory_jobs_id_seq,public.directory_runs_id_seq to service_role;
create function public.claim_directory_run(p_force boolean default false) returns boolean language plpgsql security definer set search_path='' as $$
begin
 update public.directory_settings set running_until=now()+interval '150 seconds'
 where id and (enabled or p_force) and (running_until is null or running_until<now())
 and (p_force or next_feed_at<=now() or exists(select 1 from public.directory_jobs where is_active and processed_hash is distinct from feed_hash));
 return found;
end $$;
revoke all on function public.claim_directory_run(boolean) from public,anon,authenticated;
grant execute on function public.claim_directory_run(boolean) to service_role;
-- Keep course information locally; matching is direct from feed text rather than capabilities.
alter table public.courses add column if not exists matching_notes text not null default '';
-- A small sector catalogue replaces the old capability-driven classification.
update public.career_areas set is_active=false;
insert into public.career_areas(slug,title,description,display_order,is_active) values
('carbon-climate-energy','Carbon, Climate & Energy','Climate action, carbon and clean energy.',1,true),
('conservation-wildlife','Conservation & Wildlife','Protecting wildlife and restoring habitats.',2,true),
('ecology','Ecology','Ecological surveys, assessment and applied ecology.',3,true),
('environmental-education','Environmental Education','Teaching and public learning about the environment.',4,true),
('environmental-management','Environmental Management','Managing environmental impacts and compliance.',5,true),
('food-farming-horticulture','Food, Farming & Horticulture','Sustainable food, farming and horticulture.',6,true),
('marine-conservation','Marine Conservation','Protecting marine and coastal environments.',7,true),
('policy-campaigning','Policy & Campaigning','Environmental policy, advocacy and campaigns.',8,true),
('rivers-water-hydrology','Rivers, Water & Hydrology','Freshwater ecosystems, water management and hydrology.',9,true),
('sustainability','Sustainability','Practical sustainability across organisations and communities.',10,true),
('sustainable-transport','Sustainable Transport','Lower-impact transport and active travel.',11,true)
on conflict(slug) do update set title=excluded.title,description=excluded.description,display_order=excluded.display_order,is_active=true;
