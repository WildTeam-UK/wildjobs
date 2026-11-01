create or replace function public.finish_pipeline_task(p_task_id bigint,p_lease_token uuid,p_status text,p_error text default null)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  if current_user<>'service_role' then raise insufficient_privilege; end if;
  if p_status not in ('completed','review','failed','cancelled','deferred') then raise check_violation; end if;
  update public.job_pipeline_tasks set
    status=case when p_status='deferred' or (p_status='failed' and attempts<max_attempts) then 'pending' else p_status end,
    attempts=case when p_status='deferred' then greatest(0,attempts-1) else attempts end,
    due_at=case when p_status='deferred' then (date_trunc('day',now() at time zone 'UTC')+interval '1 day') at time zone 'UTC'
      when p_status='failed' then now()+make_interval(mins=>least(60,attempts*attempts*5)) else due_at end,
    error_code=p_error,lease_token=null,lease_expires_at=null,
    finished_at=case when p_status='deferred' or (p_status='failed' and attempts<max_attempts) then null else now() end
  where id=p_task_id and status='running' and lease_token=p_lease_token and lease_expires_at>now();
  return found;
end $$;

-- A minimal public identity projection lets jobs link private employers without exposing profile drafts.
create table public.employer_public_identities (
  id bigint primary key references public.employers(id) on delete cascade,
  slug text not null,name text not null,short_name text,website_url text,
  profile_published boolean not null,is_active boolean not null
);
alter table public.employer_public_identities enable row level security;
revoke all on public.employer_public_identities from public,anon,authenticated;
grant select on public.employer_public_identities to anon,authenticated;
grant all on public.employer_public_identities to service_role;
create policy "Visible vacancy employer identities" on public.employer_public_identities for select to anon,authenticated
using(is_active and exists(select 1 from public.jobs j where j.employer_id=employer_public_identities.id));
insert into public.employer_public_identities
select id,slug,name,short_name,website_url,status='published',status<>'archived' from public.employers;
create function private.sync_employer_public_identity() returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.employer_public_identities values(new.id,new.slug,new.name,new.short_name,new.website_url,new.status='published',new.status<>'archived')
  on conflict(id) do update set slug=excluded.slug,name=excluded.name,short_name=excluded.short_name,website_url=excluded.website_url,
    profile_published=excluded.profile_published,is_active=excluded.is_active;
  return new;
end $$;
revoke all on function private.sync_employer_public_identity() from public,anon,authenticated;
create trigger sync_employer_public_identity after insert or update on public.employers for each row execute function private.sync_employer_public_identity();

create or replace function public.public_job_employer(p_employer_id bigint)
returns table(id bigint,slug text,name text,short_name text,website_url text,logo_url text,overview text,ai_summary text,profile_published boolean)
language sql stable security invoker set search_path='' as $$
  select i.id,i.slug,i.name,i.short_name,i.website_url,null::text,
    case when e.status='published' then e.overview else null end,
    case when e.status='published' then e.ai_summary else null end,i.profile_published
  from public.employer_public_identities i left join public.employers e on e.id=i.id where i.id=p_employer_id;
$$;

create or replace function private.track_job_staff_fields() returns trigger language plpgsql security invoker set search_path='' as $$
declare k text; changed boolean=false;
begin
  if current_user='authenticated' and exists(select 1 from public.staff_members where user_id=(select auth.uid()) and is_active) then
    foreach k in array array['title','summary','description','responsibilities','requirements','location_text','country_code','locality','region','postal_code','workplace_type','engagement_type','contract_type','hours_type','experience_level','salary_text','application_url','posted_at','closes_at'] loop
      if to_jsonb(new)->k is distinct from to_jsonb(old)->k then
        changed=true;
        if not k=any(new.staff_reviewed_fields) then new.staff_reviewed_fields=array_append(new.staff_reviewed_fields,k); end if;
      end if;
    end loop;
    if changed then new.indexing_eligible=false;new.jobposting_eligible=false;new.editorial_brief='{}';new.brief_status='review'; end if;
  end if;
  return new;
end $$;

create function public.save_pipeline_review(p_job_id bigint,p_patch jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.jobs%rowtype; v public.jobs%rowtype;
begin
  if not exists(select 1 from public.staff_members where user_id=(select auth.uid()) and is_active) then raise insufficient_privilege; end if;
  select * into j from public.jobs where id=p_job_id and status in ('draft','in_review') for update;
  if not found then raise check_violation; end if;
  select * into v from jsonb_populate_record(j,p_patch);
  if char_length(coalesce(trim(v.title),''))<2 or char_length(coalesce(trim(v.summary),''))<20 or char_length(coalesce(trim(v.description),''))<80
    or coalesce(v.source_url,'')!~'^https://' or coalesce(v.application_url,'')!~'^https://' then raise check_violation; end if;
  update public.jobs set title=v.title,summary=v.summary,description=v.description,responsibilities=v.responsibilities,requirements=v.requirements,
    location_text=v.location_text,locality=v.locality,region=v.region,country_code=v.country_code,postal_code=v.postal_code,
    engagement_type=v.engagement_type,workplace_type=v.workplace_type,contract_type=v.contract_type,hours_type=v.hours_type,
    experience_level=v.experience_level,salary_text=v.salary_text,application_url=v.application_url,source_url=v.source_url,
    posted_at=v.posted_at,closes_at=v.closes_at,expires_at=coalesce(v.closes_at,j.expires_at,j.created_at::date+30),status='in_review',updated_at=now() where id=j.id;
  if v.source_url is distinct from j.source_url then
    update public.job_source_records set canonical_url=v.source_url,verified_at=null where job_id=j.id;
  end if;
  insert into public.moderation_events(job_id,actor_type,actor_user_id,action,previous_status,next_status,review_note)
    values(j.id,'staff',(select auth.uid()),'updated',j.status,'in_review','Saved original vacancy brief and protected staff corrections.');
end $$;
revoke all on function public.save_pipeline_review(bigint,jsonb) from public,anon;
grant execute on function public.save_pipeline_review(bigint,jsonb) to authenticated;

create function public.publish_reviewed_brief(p_job_id bigint)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.jobs%rowtype; r public.job_source_records%rowtype;
begin
  if not exists(select 1 from public.staff_members where user_id=(select auth.uid()) and is_active and role='admin') then raise insufficient_privilege; end if;
  select * into j from public.jobs where id=p_job_id for update;
  select r1.* into r from public.job_source_records r1 join public.job_sources s on s.id=r1.source_id
    where r1.job_id=j.id and r1.mapping_status='mapped' and r1.verified_at>=now()-interval '48 hours'
      and s.is_active and s.publication_allowed and s.permissions_reviewed_at is not null and nullif(trim(s.permission_notes),'') is not null
    order by r1.verified_at desc limit 1;
  if j.status<>'in_review' or r.id is null or char_length(coalesce(trim(j.title),''))<2
    or char_length(coalesce(trim(j.summary),''))<20 or char_length(coalesce(trim(j.description),''))<80
    or nullif(trim(j.location_text),'') is null or coalesce(j.country_code,'')!~'^[A-Z]{2}$'
    or j.engagement_type is null or coalesce(j.application_url,'')!~'^https://'
    or coalesce(j.closes_at,j.expires_at) is null or coalesce(j.closes_at,j.expires_at)<current_date then
    raise check_violation using message='Review requires a current permitted source, complete role facts and application destination.';
  end if;
  update public.jobs set status='published',published_at=coalesce(published_at,now()),brief_status='verified',brief_policy_version='wildteam-brief-v1',
    brief_source_hash=r.detail_content_hash,editorial_brief='{}',source_verified_at=r.verified_at,indexing_eligible=true,jobposting_eligible=false,updated_at=now()
    where id=j.id;
  insert into public.moderation_events(job_id,actor_type,actor_user_id,action,previous_status,next_status,review_note)
    values(j.id,'staff',(select auth.uid()),'published','in_review','published','Staff approved the original brief and advertised facts.');
end $$;
revoke all on function public.publish_reviewed_brief(bigint) from public,anon;
grant execute on function public.publish_reviewed_brief(bigint) to authenticated;

-- Operational activation is separate from schema installation. Existing source states are unchanged.
