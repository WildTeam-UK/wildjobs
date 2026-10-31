alter table public.job_sources
add column description_display_mode text not null default 'link_only',
add column logo_reuse_allowed boolean not null default false,
add column permissions_reviewed_at date,
add column permission_notes text,
add constraint job_sources_description_display_mode_valid check (
  description_display_mode in ('full', 'summary_only', 'link_only')
),
add constraint job_sources_permission_notes_length check (
  permission_notes is null or char_length(permission_notes) <= 2000
);

alter table public.jobs
add column remote_scope_type text,
add column remote_scope_text text,
add constraint jobs_remote_scope_type_valid check (
  remote_scope_type is null
  or remote_scope_type in ('worldwide', 'country', 'region', 'timezone', 'other')
),
add constraint jobs_remote_scope_text_length check (
  remote_scope_text is null or char_length(remote_scope_text) <= 240
),
add constraint jobs_remote_scope_requires_remote_work check (
  remote_scope_type is null or workplace_type in ('remote', 'hybrid')
);

alter table public.job_source_records
add column remote_scope_type text,
add column remote_scope_text text,
add constraint job_source_records_remote_scope_type_valid check (
  remote_scope_type is null
  or remote_scope_type in ('worldwide', 'country', 'region', 'timezone', 'other')
),
add constraint job_source_records_remote_scope_text_length check (
  remote_scope_text is null or char_length(remote_scope_text) <= 240
);

create table public.employer_aliases (
  id bigint generated always as identity primary key,
  employer_id bigint not null references public.employers(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  constraint employer_aliases_alias_present check (nullif(trim(alias), '') is not null),
  constraint employer_aliases_normalized_alias_present check (
    nullif(trim(normalized_alias), '') is not null
  ),
  constraint employer_aliases_normalized_alias_unique unique (normalized_alias)
);

create index employer_aliases_employer_id_idx
on public.employer_aliases (employer_id);

create table public.occupations (
  id bigint generated always as identity primary key,
  parent_id bigint references public.occupations(id) on delete restrict,
  slug text not null unique,
  title text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint occupations_slug_format check (
    slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint occupations_title_present check (nullif(trim(title), '') is not null),
  constraint occupations_parent_not_self check (parent_id is null or parent_id <> id)
);

create index occupations_parent_id_idx
on public.occupations (parent_id);

create table public.occupation_aliases (
  id bigint generated always as identity primary key,
  occupation_id bigint not null references public.occupations(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  constraint occupation_aliases_alias_present check (nullif(trim(alias), '') is not null),
  constraint occupation_aliases_normalized_alias_present check (
    nullif(trim(normalized_alias), '') is not null
  ),
  constraint occupation_aliases_normalized_alias_unique unique (normalized_alias)
);

create index occupation_aliases_occupation_id_idx
on public.occupation_aliases (occupation_id);

create table public.job_occupations (
  job_id bigint not null references public.jobs(id) on delete cascade,
  occupation_id bigint not null references public.occupations(id) on delete restrict,
  is_primary boolean not null default false,
  original_text text,
  evidence_text text,
  confidence smallint,
  assignment_source text not null,
  policy_version text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (job_id, occupation_id),
  constraint job_occupations_confidence_valid check (
    confidence is null or confidence between 0 and 100
  ),
  constraint job_occupations_assignment_source_valid check (
    assignment_source in ('deterministic', 'ai', 'staff')
  ),
  constraint job_occupations_ai_evidence_required check (
    assignment_source <> 'ai'
    or (
      nullif(trim(evidence_text), '') is not null
      and confidence is not null
      and nullif(trim(policy_version), '') is not null
    )
  ),
  constraint job_occupations_staff_review_required check (
    assignment_source <> 'staff' or reviewed_at is not null
  )
);

create index job_occupations_occupation_id_job_id_idx
on public.job_occupations (occupation_id, job_id);

create unique index job_occupations_one_primary_idx
on public.job_occupations (job_id)
where is_primary;

create table public.benefits (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint benefits_slug_format check (
    slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint benefits_title_present check (nullif(trim(title), '') is not null)
);

create table public.benefit_aliases (
  id bigint generated always as identity primary key,
  benefit_id bigint not null references public.benefits(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  created_at timestamptz not null default now(),
  constraint benefit_aliases_alias_present check (nullif(trim(alias), '') is not null),
  constraint benefit_aliases_normalized_alias_present check (
    nullif(trim(normalized_alias), '') is not null
  ),
  constraint benefit_aliases_normalized_alias_unique unique (normalized_alias)
);

create index benefit_aliases_benefit_id_idx
on public.benefit_aliases (benefit_id);

create table public.job_benefits (
  job_id bigint not null references public.jobs(id) on delete cascade,
  benefit_id bigint not null references public.benefits(id) on delete restrict,
  original_text text,
  evidence_text text,
  confidence smallint,
  assignment_source text not null,
  policy_version text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (job_id, benefit_id),
  constraint job_benefits_confidence_valid check (
    confidence is null or confidence between 0 and 100
  ),
  constraint job_benefits_assignment_source_valid check (
    assignment_source in ('deterministic', 'ai', 'staff')
  ),
  constraint job_benefits_ai_evidence_required check (
    assignment_source <> 'ai'
    or (
      nullif(trim(evidence_text), '') is not null
      and confidence is not null
      and nullif(trim(policy_version), '') is not null
    )
  ),
  constraint job_benefits_staff_review_required check (
    assignment_source <> 'staff' or reviewed_at is not null
  )
);

create index job_benefits_benefit_id_job_id_idx
on public.job_benefits (benefit_id, job_id);

create table public.employer_benefits (
  employer_id bigint not null references public.employers(id) on delete cascade,
  benefit_id bigint not null references public.benefits(id) on delete restrict,
  original_text text,
  evidence_text text,
  source_url text,
  confidence smallint,
  assignment_source text not null,
  policy_version text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (employer_id, benefit_id),
  constraint employer_benefits_source_url_valid check (
    source_url is null or source_url ~ '^https://'
  ),
  constraint employer_benefits_confidence_valid check (
    confidence is null or confidence between 0 and 100
  ),
  constraint employer_benefits_assignment_source_valid check (
    assignment_source in ('deterministic', 'ai', 'staff')
  ),
  constraint employer_benefits_ai_evidence_required check (
    assignment_source <> 'ai'
    or (
      nullif(trim(evidence_text), '') is not null
      and source_url is not null
      and confidence is not null
      and nullif(trim(policy_version), '') is not null
    )
  ),
  constraint employer_benefits_staff_review_required check (
    assignment_source <> 'staff' or reviewed_at is not null
  )
);

create index employer_benefits_benefit_id_employer_id_idx
on public.employer_benefits (benefit_id, employer_id);

create table public.job_locations (
  id bigint generated always as identity primary key,
  job_id bigint not null references public.jobs(id) on delete cascade,
  raw_text text not null,
  address_line_1 text,
  address_line_2 text,
  locality text,
  region text,
  postal_code text,
  country_code text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  precision text not null,
  is_primary boolean not null default false,
  evidence_text text,
  confidence smallint,
  assignment_source text not null,
  policy_version text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_locations_raw_text_present check (nullif(trim(raw_text), '') is not null),
  constraint job_locations_country_code_valid check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  constraint job_locations_coordinates_complete check (
    (latitude is null and longitude is null)
    or (latitude is not null and longitude is not null)
  ),
  constraint job_locations_latitude_valid check (
    latitude is null or latitude between -90 and 90
  ),
  constraint job_locations_longitude_valid check (
    longitude is null or longitude between -180 and 180
  ),
  constraint job_locations_precision_valid check (
    precision in ('exact', 'postcode', 'locality', 'region', 'country')
  ),
  constraint job_locations_confidence_valid check (
    confidence is null or confidence between 0 and 100
  ),
  constraint job_locations_assignment_source_valid check (
    assignment_source in ('deterministic', 'ai', 'staff')
  ),
  constraint job_locations_ai_evidence_required check (
    assignment_source <> 'ai'
    or (
      nullif(trim(evidence_text), '') is not null
      and confidence is not null
      and nullif(trim(policy_version), '') is not null
    )
  ),
  constraint job_locations_staff_review_required check (
    assignment_source <> 'staff' or reviewed_at is not null
  )
);

create index job_locations_job_id_idx
on public.job_locations (job_id);

create index job_locations_geography_idx
on public.job_locations (country_code, region, locality, job_id);

create unique index job_locations_one_primary_idx
on public.job_locations (job_id)
where is_primary;

alter table public.employer_aliases enable row level security;
alter table public.occupations enable row level security;
alter table public.occupation_aliases enable row level security;
alter table public.job_occupations enable row level security;
alter table public.benefits enable row level security;
alter table public.benefit_aliases enable row level security;
alter table public.job_benefits enable row level security;
alter table public.employer_benefits enable row level security;
alter table public.job_locations enable row level security;

grant select on table
  public.occupations,
  public.job_occupations,
  public.benefits,
  public.job_benefits,
  public.employer_benefits,
  public.job_locations
to anon, authenticated;

grant select, insert, update on table
  public.employer_aliases,
  public.occupation_aliases,
  public.benefit_aliases
to authenticated;

grant insert, update on table
  public.occupations,
  public.job_occupations,
  public.benefits,
  public.job_benefits,
  public.employer_benefits,
  public.job_locations
to authenticated;

grant usage, select on sequence
  public.employer_aliases_id_seq,
  public.occupations_id_seq,
  public.occupation_aliases_id_seq,
  public.benefits_id_seq,
  public.benefit_aliases_id_seq,
  public.job_locations_id_seq
to authenticated;

grant all on table
  public.employer_aliases,
  public.occupations,
  public.occupation_aliases,
  public.job_occupations,
  public.benefits,
  public.benefit_aliases,
  public.job_benefits,
  public.employer_benefits,
  public.job_locations
to service_role;

grant all on sequence
  public.employer_aliases_id_seq,
  public.occupations_id_seq,
  public.occupation_aliases_id_seq,
  public.benefits_id_seq,
  public.benefit_aliases_id_seq,
  public.job_locations_id_seq
to service_role;

create policy "Anonymous visitors can read active occupations"
on public.occupations for select
to anon
using (is_active);

create policy "Signed in users can read permitted occupations"
on public.occupations for select
to authenticated
using (
  is_active
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create occupations"
on public.occupations for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update occupations"
on public.occupations for update
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

create policy "Anonymous visitors can read active benefits"
on public.benefits for select
to anon
using (is_active);

create policy "Signed in users can read permitted benefits"
on public.benefits for select
to authenticated
using (
  is_active
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can create benefits"
on public.benefits for insert
to authenticated
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update benefits"
on public.benefits for update
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

create policy "Staff can manage employer aliases"
on public.employer_aliases for all
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

create policy "Staff can manage occupation aliases"
on public.occupation_aliases for all
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

create policy "Staff can manage benefit aliases"
on public.benefit_aliases for all
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

create policy "Anonymous visitors can read current job occupations"
on public.job_occupations for select
to anon
using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_occupations.job_id
      and jobs.status = 'published'
      and jobs.published_at <= now()
      and (
        jobs.closes_at >= current_date
        or (jobs.closes_at is null and jobs.expires_at >= current_date)
      )
      and jobs.withdrawn_at is null
  )
  and exists (
    select 1 from public.occupations
    where occupations.id = job_occupations.occupation_id and occupations.is_active
  )
);

create policy "Signed in users can read permitted job occupations"
on public.job_occupations for select
to authenticated
using (
  (
    exists (
      select 1 from public.jobs
      where jobs.id = job_occupations.job_id
        and (
          (
            jobs.status = 'published'
            and jobs.published_at <= now()
            and (
              jobs.closes_at >= current_date
              or (jobs.closes_at is null and jobs.expires_at >= current_date)
            )
            and jobs.withdrawn_at is null
          )
          or exists (
            select 1 from public.saved_jobs
            where saved_jobs.job_id = jobs.id
              and saved_jobs.user_id = (select auth.uid())
          )
        )
    )
    and exists (
      select 1 from public.occupations
      where occupations.id = job_occupations.occupation_id and occupations.is_active
    )
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage job occupations"
on public.job_occupations for all
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

create policy "Anonymous visitors can read current job benefits"
on public.job_benefits for select
to anon
using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_benefits.job_id
      and jobs.status = 'published'
      and jobs.published_at <= now()
      and (
        jobs.closes_at >= current_date
        or (jobs.closes_at is null and jobs.expires_at >= current_date)
      )
      and jobs.withdrawn_at is null
  )
  and exists (
    select 1 from public.benefits
    where benefits.id = job_benefits.benefit_id and benefits.is_active
  )
);

create policy "Signed in users can read permitted job benefits"
on public.job_benefits for select
to authenticated
using (
  (
    exists (
      select 1 from public.jobs
      where jobs.id = job_benefits.job_id
        and (
          (
            jobs.status = 'published'
            and jobs.published_at <= now()
            and (
              jobs.closes_at >= current_date
              or (jobs.closes_at is null and jobs.expires_at >= current_date)
            )
            and jobs.withdrawn_at is null
          )
          or exists (
            select 1 from public.saved_jobs
            where saved_jobs.job_id = jobs.id
              and saved_jobs.user_id = (select auth.uid())
          )
        )
    )
    and exists (
      select 1 from public.benefits
      where benefits.id = job_benefits.benefit_id and benefits.is_active
    )
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage job benefits"
on public.job_benefits for all
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

create policy "Anonymous visitors can read published employer benefits"
on public.employer_benefits for select
to anon
using (
  exists (
    select 1 from public.employers
    where employers.id = employer_benefits.employer_id
      and employers.status = 'published'
      and employers.published_at <= now()
  )
  and exists (
    select 1 from public.benefits
    where benefits.id = employer_benefits.benefit_id and benefits.is_active
  )
);

create policy "Signed in users can read permitted employer benefits"
on public.employer_benefits for select
to authenticated
using (
  (
    exists (
      select 1 from public.employers
      where employers.id = employer_benefits.employer_id
        and employers.status = 'published'
        and employers.published_at <= now()
    )
    and exists (
      select 1 from public.benefits
      where benefits.id = employer_benefits.benefit_id and benefits.is_active
    )
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage employer benefits"
on public.employer_benefits for all
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

create policy "Anonymous visitors can read current job locations"
on public.job_locations for select
to anon
using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_locations.job_id
      and jobs.status = 'published'
      and jobs.published_at <= now()
      and (
        jobs.closes_at >= current_date
        or (jobs.closes_at is null and jobs.expires_at >= current_date)
      )
      and jobs.withdrawn_at is null
  )
);

create policy "Signed in users can read permitted job locations"
on public.job_locations for select
to authenticated
using (
  exists (
    select 1 from public.jobs
    where jobs.id = job_locations.job_id
      and (
        (
          jobs.status = 'published'
          and jobs.published_at <= now()
          and (
            jobs.closes_at >= current_date
            or (jobs.closes_at is null and jobs.expires_at >= current_date)
          )
          and jobs.withdrawn_at is null
        )
        or exists (
          select 1 from public.saved_jobs
          where saved_jobs.job_id = jobs.id
            and saved_jobs.user_id = (select auth.uid())
        )
      )
  )
  or exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can manage job locations"
on public.job_locations for all
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
