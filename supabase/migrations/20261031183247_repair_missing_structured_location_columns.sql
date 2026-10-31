-- Bring production in line with the structured location fields already used by the app.
alter table public.jobs
add column if not exists locality text,
add column if not exists postal_code text;

alter table public.job_source_records
add column if not exists country_code text,
add column if not exists location_locality text,
add column if not exists location_region text,
add column if not exists postal_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_locality_length'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
    add constraint jobs_locality_length check (
      locality is null or char_length(locality) <= 120
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_region_length'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
    add constraint jobs_region_length check (
      region is null or char_length(region) <= 120
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'jobs_postal_code_length'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
    add constraint jobs_postal_code_length check (
      postal_code is null or char_length(postal_code) <= 40
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'job_source_records_country_code_valid'
      and conrelid = 'public.job_source_records'::regclass
  ) then
    alter table public.job_source_records
    add constraint job_source_records_country_code_valid check (
      country_code is null or country_code ~ '^[A-Z]{2}$'
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'job_source_records_location_locality_length'
      and conrelid = 'public.job_source_records'::regclass
  ) then
    alter table public.job_source_records
    add constraint job_source_records_location_locality_length check (
      location_locality is null or char_length(location_locality) <= 120
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'job_source_records_location_region_length'
      and conrelid = 'public.job_source_records'::regclass
  ) then
    alter table public.job_source_records
    add constraint job_source_records_location_region_length check (
      location_region is null or char_length(location_region) <= 120
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'job_source_records_postal_code_length'
      and conrelid = 'public.job_source_records'::regclass
  ) then
    alter table public.job_source_records
    add constraint job_source_records_postal_code_length check (
      postal_code is null or char_length(postal_code) <= 40
    );
  end if;
end;
$$;

create or replace function public.sync_job_location_from_source_record()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.job_id is not null then
    update public.jobs
    set locality = coalesce(new.location_locality, locality),
        region = coalesce(new.location_region, region),
        postal_code = coalesce(new.postal_code, postal_code),
        country_code = coalesce(new.country_code, country_code),
        updated_at = now()
    where id = new.job_id;
  end if;

  return new;
end;
$$;

revoke execute on function public.sync_job_location_from_source_record()
from public, anon, authenticated;

drop trigger if exists sync_job_location_from_source_record
on public.job_source_records;

create trigger sync_job_location_from_source_record
after insert or update of job_id, location_locality, location_region, postal_code, country_code
on public.job_source_records
for each row
execute function public.sync_job_location_from_source_record();
