-- Keep the deployed staff client compatible while enforcing the new independent review contract.

create or replace function public.update_job_review_draft(
  p_job_id bigint,
  p_job_slug text,
  p_title text,
  p_summary text,
  p_description text,
  p_responsibilities text,
  p_requirements text,
  p_location_text text,
  p_country_code text,
  p_workplace_type text,
  p_contract_type text,
  p_hours_type text,
  p_experience_level text,
  p_salary_text text,
  p_application_url text,
  p_posted_at date,
  p_closes_at date,
  p_canonical_url text,
  p_employer_website_url text,
  p_employer_mission text,
  p_employer_overview text,
  p_engagement_type text
)
returns bigint language plpgsql security invoker set search_path='' as $$
begin
  perform public.save_pipeline_review(p_job_id,jsonb_build_object('title',p_title,'summary',p_summary,'description',p_description,'responsibilities',p_responsibilities,'requirements',p_requirements,'location_text',p_location_text,'country_code',p_country_code,'workplace_type',p_workplace_type,'contract_type',p_contract_type,'hours_type',p_hours_type,'experience_level',p_experience_level,'salary_text',p_salary_text,'application_url',p_application_url,'posted_at',p_posted_at,'closes_at',p_closes_at,'source_url',p_canonical_url,'engagement_type',p_engagement_type));
  return p_job_id;
end $$;

create or replace function public.update_job_review_draft(
  p_job_id bigint,
  p_job_slug text,
  p_title text,
  p_summary text,
  p_description text,
  p_responsibilities text,
  p_requirements text,
  p_location_text text,
  p_location_locality text,
  p_location_region text,
  p_postal_code text,
  p_country_code text,
  p_workplace_type text,
  p_contract_type text,
  p_hours_type text,
  p_experience_level text,
  p_salary_text text,
  p_application_url text,
  p_posted_at date,
  p_closes_at date,
  p_canonical_url text,
  p_employer_website_url text,
  p_employer_mission text,
  p_employer_overview text,
  p_engagement_type text
)
returns bigint language plpgsql security invoker set search_path='' as $$
begin
  perform public.save_pipeline_review(p_job_id,jsonb_build_object('title',p_title,'summary',p_summary,'description',p_description,'responsibilities',p_responsibilities,'requirements',p_requirements,'location_text',p_location_text,'locality',p_location_locality,'region',p_location_region,'postal_code',p_postal_code,'country_code',p_country_code,'workplace_type',p_workplace_type,'contract_type',p_contract_type,'hours_type',p_hours_type,'experience_level',p_experience_level,'salary_text',p_salary_text,'application_url',p_application_url,'posted_at',p_posted_at,'closes_at',p_closes_at,'source_url',p_canonical_url,'engagement_type',p_engagement_type));
  return p_job_id;
end $$;

create or replace function public.publish_job_review_draft(p_job_id bigint)
returns text language plpgsql security invoker set search_path='' as $$
declare v_slug text;
begin
  perform public.publish_reviewed_brief(p_job_id);
  select slug into v_slug from public.jobs where id=p_job_id;
  return v_slug;
end $$;
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('publish_job_review_draft','update_job_review_draft') loop
    execute format('revoke all on function %s from public,anon',f);
    execute format('grant execute on function %s to authenticated',f);
  end loop;
end $$;
