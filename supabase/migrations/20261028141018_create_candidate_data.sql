create table public.candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_jobs (
  user_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  job_id bigint not null references public.jobs(id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.candidate_preferences (
  user_id uuid primary key references public.candidate_profiles(user_id) on delete cascade,
  preferred_location text,
  experience_level text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint candidate_preferences_experience_level_valid check (
    experience_level in ('entry', 'developing', 'experienced', 'leadership', 'open')
  )
);

create table public.candidate_career_area_preferences (
  user_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  career_area_id bigint not null references public.career_areas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, career_area_id)
);

create table public.candidate_workplace_preferences (
  user_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  workplace_type text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, workplace_type),
  constraint candidate_workplace_preferences_type_valid check (
    workplace_type in ('remote', 'hybrid', 'on_site')
  )
);

create table public.candidate_contract_preferences (
  user_id uuid not null references public.candidate_profiles(user_id) on delete cascade,
  contract_type text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, contract_type),
  constraint candidate_contract_preferences_type_valid check (
    contract_type in ('permanent', 'fixed_term', 'temporary', 'internship', 'apprenticeship')
  )
);
