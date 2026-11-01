-- The same advert and unchanged feed content identify a cached card even when
-- linked-advert enrichment cleaned its location after the initial feed import.
-- Different content still requires compatible locations; separate vacancies stay separate.
create or replace function private.directory_find_job(p jsonb,exclude_id bigint default null) returns bigint language sql stable set search_path='' as $$
 select j.id from public.directory_jobs j where j.merged_into is null and j.id is distinct from exclude_id and (
  (j.canonical_url=coalesce(p->>'canonical_url',p->>'source_url')
   and private.directory_normalise(j.title)=private.directory_normalise(p->>'title')
   and (private.directory_org(j.organisation_name)=private.directory_org(p->>'organisation_name') or private.directory_org(p->>'organisation_name') in ('','organisation not stated') or private.directory_org(j.organisation_name)='organisation not stated')
   and (j.feed_hash=p->>'feed_hash' or private.directory_place(j.location_text)=private.directory_place(p->>'location_text') or private.directory_place(p->>'location_text') in ('','location not stated') or private.directory_place(j.location_text)='location not stated'))
  or (j.identity_key=private.directory_identity(p) and j.is_active and abs(extract(epoch from (j.posted_at-(p->>'posted_at')::timestamptz)))<=2592000
   and coalesce(j.closes_at,j.posted_at+interval '720 hours')>now()
   and not exists(select 1 from public.directory_source_jobs same_source where same_source.job_id=j.id and same_source.source_id=coalesce((p->>'_source_id')::bigint,(p->>'primary_source_id')::bigint) and same_source.external_id<>p->>'feed_id' ))
 ) order by j.id limit 1
$$;
