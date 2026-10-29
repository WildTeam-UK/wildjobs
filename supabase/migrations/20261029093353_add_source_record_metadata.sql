alter table public.job_source_records
add column source_title text,
add column employer_name text,
add column location_text text,
add column summary text,
add column closes_at date,
add constraint job_source_records_source_title_length check (
  source_title is null or char_length(source_title) <= 240
),
add constraint job_source_records_employer_name_length check (
  employer_name is null or char_length(employer_name) <= 200
),
add constraint job_source_records_location_text_length check (
  location_text is null or char_length(location_text) <= 240
),
add constraint job_source_records_summary_length check (
  summary is null or char_length(summary) <= 2000
);
