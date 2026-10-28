create table public.employers (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  short_name text,
  status text not null default 'draft',
  website_url text,
  website_domain text,
  focus text,
  mission text,
  overview text,
  culture text,
  locations text[] not null default '{}',
  benefits text[] not null default '{}',
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employers_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint employers_status_valid check (status in ('draft', 'in_review', 'published', 'archived')),
  constraint employers_website_url_valid check (website_url is null or website_url ~ '^https?://'),
  constraint employers_publication_complete check (
    status <> 'published'
    or (published_at is not null and mission is not null and overview is not null)
  )
);

create table public.career_areas (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null unique,
  description text,
  display_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_areas_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint career_areas_display_order_valid check (display_order >= 0)
);

create table public.courses (
  id bigint generated always as identity primary key,
  learnworlds_course_id text not null unique,
  slug text not null unique,
  title text not null,
  short_title text not null,
  summary text not null,
  public_url text not null,
  availability_status text not null default 'available',
  provenance text not null,
  reviewed_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint courses_public_url_valid check (public_url ~ '^https://'),
  constraint courses_availability_status_valid check (
    availability_status in ('available', 'unavailable', 'archived')
  )
);

create table public.capabilities (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null unique,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint capabilities_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.jobs (
  id bigint generated always as identity primary key,
  slug text not null unique,
  employer_id bigint not null references public.employers(id) on delete restrict,
  title text not null,
  summary text,
  description text,
  responsibilities text,
  requirements text,
  status text not null default 'draft',
  location_text text,
  country_code text,
  region text,
  workplace_type text,
  contract_type text,
  hours_type text,
  experience_level text,
  is_field_based boolean not null default false,
  salary_text text,
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  salary_currency text,
  salary_period text,
  application_url text,
  application_notes text,
  posted_at date,
  closes_at date,
  published_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_slug_format check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint jobs_status_valid check (
    status in ('draft', 'in_review', 'published', 'expired', 'withdrawn', 'rejected')
  ),
  constraint jobs_workplace_type_valid check (
    workplace_type is null or workplace_type in ('remote', 'hybrid', 'on_site')
  ),
  constraint jobs_contract_type_valid check (
    contract_type is null
    or contract_type in ('permanent', 'fixed_term', 'temporary', 'internship', 'apprenticeship')
  ),
  constraint jobs_hours_type_valid check (
    hours_type is null or hours_type in ('full_time', 'part_time', 'flexible')
  ),
  constraint jobs_experience_level_valid check (
    experience_level is null
    or experience_level in ('entry', 'developing', 'experienced', 'leadership', 'open')
  ),
  constraint jobs_salary_period_valid check (
    salary_period is null or salary_period in ('hour', 'day', 'week', 'month', 'year', 'pro_rata')
  ),
  constraint jobs_salary_values_valid check (
    (salary_min is null or salary_min >= 0)
    and (salary_max is null or salary_max >= 0)
    and (salary_min is null or salary_max is null or salary_max >= salary_min)
  ),
  constraint jobs_salary_currency_valid check (
    salary_currency is null or salary_currency ~ '^[A-Z]{3}$'
  ),
  constraint jobs_country_code_valid check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  constraint jobs_application_url_valid check (
    application_url is null or application_url ~ '^https?://'
  ),
  constraint jobs_reviewed_content_complete check (
    status not in ('published', 'expired', 'withdrawn')
    or (
      summary is not null
      and description is not null
      and location_text is not null
      and workplace_type is not null
      and contract_type is not null
      and hours_type is not null
      and experience_level is not null
      and salary_text is not null
      and application_url is not null
      and closes_at is not null
      and published_at is not null
    )
  ),
  constraint jobs_withdrawn_state_valid check (
    status = 'withdrawn' or withdrawn_at is null
  )
);

create table public.job_career_areas (
  job_id bigint not null references public.jobs(id) on delete cascade,
  career_area_id bigint not null references public.career_areas(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (job_id, career_area_id)
);

create table public.course_capabilities (
  course_id bigint not null references public.courses(id) on delete cascade,
  capability_id bigint not null references public.capabilities(id) on delete restrict,
  is_primary boolean not null default false,
  reviewed_at date not null,
  created_at timestamptz not null default now(),
  primary key (course_id, capability_id)
);

create table public.job_capabilities (
  job_id bigint not null references public.jobs(id) on delete cascade,
  capability_id bigint not null references public.capabilities(id) on delete restrict,
  importance text not null default 'useful',
  created_at timestamptz not null default now(),
  primary key (job_id, capability_id),
  constraint job_capabilities_importance_valid check (importance in ('essential', 'useful', 'development'))
);
