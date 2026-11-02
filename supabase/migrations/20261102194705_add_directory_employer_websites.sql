alter table public.directory_organisations
  add column website_url text
  check (website_url is null or website_url ~ '^https?://[^[:space:]]+$');
