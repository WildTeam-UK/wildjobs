create table public.staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_members_role_valid check (role in ('reviewer', 'admin'))
);

create table public.job_sources (
  id bigint generated always as identity primary key,
  name text not null unique,
  source_type text not null,
  authoritative_base_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_sources_type_valid check (
    source_type in ('manual_curation', 'employer_submission', 'feed', 'api')
  ),
  constraint job_sources_url_valid check (
    authoritative_base_url is null or authoritative_base_url ~ '^https?://'
  )
);

create table public.job_source_records (
  id bigint generated always as identity primary key,
  source_id bigint not null references public.job_sources(id) on delete restrict,
  job_id bigint references public.jobs(id) on delete set null,
  external_id text,
  canonical_url text,
  content_hash text,
  mapping_status text not null default 'unmapped',
  source_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_source_records_identity_present check (
    external_id is not null or canonical_url is not null
  ),
  constraint job_source_records_canonical_url_valid check (
    canonical_url is null or canonical_url ~ '^https?://'
  ),
  constraint job_source_records_content_hash_valid check (
    content_hash is null or content_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint job_source_records_mapping_status_valid check (
    mapping_status in ('unmapped', 'mapped', 'possible_duplicate', 'ignored')
  ),
  constraint job_source_records_seen_order_valid check (last_seen_at >= first_seen_at)
);

create table public.import_runs (
  id bigint generated always as identity primary key,
  source_id bigint not null references public.job_sources(id) on delete restrict,
  status text not null default 'started',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_seen integer not null default 0,
  records_created integer not null default 0,
  records_updated integer not null default 0,
  records_flagged integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  constraint import_runs_status_valid check (status in ('started', 'completed', 'failed', 'cancelled')),
  constraint import_runs_counts_valid check (
    records_seen >= 0
    and records_created >= 0
    and records_updated >= 0
    and records_flagged >= 0
  ),
  constraint import_runs_finish_valid check (
    (status = 'started' and finished_at is null)
    or (status <> 'started' and finished_at is not null and finished_at >= started_at)
  )
);

create table public.submission_invites (
  id bigint generated always as identity primary key,
  token_hash text not null unique,
  invitee_email text not null,
  employer_id bigint references public.employers(id) on delete set null,
  created_by_staff_user_id uuid not null references public.staff_members(user_id) on delete restrict,
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint submission_invites_token_hash_valid check (token_hash ~ '^[a-f0-9]{64}$'),
  constraint submission_invites_expiry_valid check (expires_at > created_at),
  constraint submission_invites_use_valid check (used_at is null or used_at <= expires_at),
  constraint submission_invites_revocation_valid check (used_at is null or revoked_at is null)
);

create table public.employer_submissions (
  id bigint generated always as identity primary key,
  invite_id bigint not null unique references public.submission_invites(id) on delete restrict,
  matched_employer_id bigint references public.employers(id) on delete set null,
  resulting_job_id bigint references public.jobs(id) on delete set null,
  contact_name text not null,
  contact_email text not null,
  organisation_name text not null,
  role_title text not null,
  salary_text text not null,
  closing_date date not null,
  location_text text not null,
  workplace_type text not null,
  role_summary text not null,
  application_url text not null,
  authority_confirmed_at timestamptz not null,
  status text not null default 'new',
  completeness_score smallint not null default 0,
  received_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_submissions_workplace_type_valid check (
    workplace_type in ('remote', 'hybrid', 'on_site')
  ),
  constraint employer_submissions_application_url_valid check (application_url ~ '^https?://'),
  constraint employer_submissions_status_valid check (
    status in ('new', 'changes_requested', 'ready_for_job_review', 'accepted', 'rejected')
  ),
  constraint employer_submissions_completeness_valid check (
    completeness_score between 0 and 100
  ),
  constraint employer_submissions_resolution_valid check (
    (status not in ('accepted', 'rejected') and resolved_at is null)
    or (
      status = 'accepted'
      and resolved_at is not null
      and resulting_job_id is not null
    )
    or (status = 'rejected' and resolved_at is not null)
  )
);

create table public.moderation_events (
  id bigint generated always as identity primary key,
  job_id bigint references public.jobs(id) on delete restrict,
  employer_submission_id bigint references public.employer_submissions(id) on delete restrict,
  actor_user_id uuid not null references public.staff_members(user_id) on delete restrict,
  action text not null,
  previous_status text,
  next_status text,
  review_note text,
  created_at timestamptz not null default now(),
  constraint moderation_events_one_target check (
    num_nonnulls(job_id, employer_submission_id) = 1
  ),
  constraint moderation_events_action_valid check (
    action in (
      'created',
      'assigned',
      'changes_requested',
      'approved',
      'published',
      'expired',
      'withdrawn',
      'rejected',
      'duplicate_flagged',
      'duplicate_resolved'
    )
  )
);
