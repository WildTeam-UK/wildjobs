alter table public.courses
add column image_url text,
add column image_alt text,
add column theme_colour text,
add column display_order smallint not null default 0,
add column is_filter_visible boolean not null default false,
add constraint courses_image_url_valid check (image_url is null or image_url ~ '^https://'),
add constraint courses_theme_colour_valid check (theme_colour is null or theme_colour ~ '^#[0-9A-Fa-f]{6}$'),
add constraint courses_display_order_valid check (display_order >= 0),
add constraint courses_image_alt_length check (image_alt is null or char_length(image_alt) <= 240);

alter table public.course_capabilities
add column coverage_score smallint not null default 100,
add column rationale text,
add column outcome_id bigint,
add constraint course_capabilities_coverage_score_valid check (coverage_score between 1 and 100),
add constraint course_capabilities_rationale_length check (rationale is null or char_length(rationale) <= 1000);

alter table public.job_capabilities
add column relevance_score smallint not null default 50,
add column confidence smallint not null default 50,
add column evidence_text text,
add column assignment_source text not null default 'staff',
add column policy_version text,
add column source_record_id bigint references public.job_source_records(id) on delete set null,
add constraint job_capabilities_relevance_score_valid check (relevance_score between 1 and 100),
add constraint job_capabilities_confidence_valid check (confidence between 1 and 100),
add constraint job_capabilities_evidence_length check (evidence_text is null or char_length(evidence_text) <= 500),
add constraint job_capabilities_assignment_source_valid check (assignment_source in ('ai', 'staff', 'migration')),
add constraint job_capabilities_policy_version_length check (policy_version is null or char_length(policy_version) between 1 and 80);

create table public.course_learning_outcomes (
  id bigint generated always as identity primary key,
  course_id bigint not null references public.courses(id) on delete cascade,
  outcome_text text not null,
  source_url text not null,
  display_order smallint not null default 0,
  is_active boolean not null default true,
  reviewed_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_learning_outcomes_text_length check (char_length(outcome_text) between 3 and 1000),
  constraint course_learning_outcomes_source_url_valid check (source_url ~ '^https://'),
  constraint course_learning_outcomes_display_order_valid check (display_order >= 0)
);

alter table public.course_capabilities
add constraint course_capabilities_outcome_id_fkey
foreign key (outcome_id) references public.course_learning_outcomes(id) on delete set null;

create table public.capability_aliases (
  id bigint generated always as identity primary key,
  capability_id bigint not null references public.capabilities(id) on delete cascade,
  alias text not null,
  normalised_alias text generated always as (
    lower(regexp_replace(trim(alias), '[^[:alnum:]]+', ' ', 'g'))
  ) stored,
  provenance text not null default 'staff',
  created_at timestamptz not null default now(),
  unique (normalised_alias),
  constraint capability_aliases_alias_length check (char_length(alias) between 2 and 160),
  constraint capability_aliases_provenance_valid check (provenance in ('staff', 'course_outcome', 'reviewed_candidate'))
);

create table public.source_record_capabilities (
  source_record_id bigint not null references public.job_source_records(id) on delete cascade,
  capability_id bigint not null references public.capabilities(id) on delete restrict,
  importance text not null,
  relevance_score smallint not null,
  confidence smallint not null,
  evidence_text text not null,
  policy_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_record_id, capability_id),
  constraint source_record_capabilities_importance_valid check (importance in ('essential', 'useful', 'development')),
  constraint source_record_capabilities_relevance_score_valid check (relevance_score between 1 and 100),
  constraint source_record_capabilities_confidence_valid check (confidence between 1 and 100),
  constraint source_record_capabilities_evidence_length check (char_length(evidence_text) between 2 and 500),
  constraint source_record_capabilities_policy_version_length check (char_length(policy_version) between 1 and 80)
);

create table public.capability_candidates (
  id bigint generated always as identity primary key,
  source_record_id bigint references public.job_source_records(id) on delete cascade,
  proposed_title text not null,
  normalised_title text generated always as (
    lower(regexp_replace(trim(proposed_title), '[^[:alnum:]]+', ' ', 'g'))
  ) stored,
  evidence_text text not null,
  confidence smallint not null,
  status text not null default 'pending',
  occurrence_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_capability_id bigint references public.capabilities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalised_title),
  constraint capability_candidates_title_length check (char_length(proposed_title) between 2 and 160),
  constraint capability_candidates_evidence_length check (char_length(evidence_text) between 2 and 500),
  constraint capability_candidates_confidence_valid check (confidence between 1 and 100),
  constraint capability_candidates_status_valid check (status in ('pending', 'promoted', 'merged', 'rejected')),
  constraint capability_candidates_occurrence_count_valid check (occurrence_count > 0)
);

create index course_learning_outcomes_course_idx
on public.course_learning_outcomes (course_id, display_order, id);

create index capability_aliases_capability_idx
on public.capability_aliases (capability_id);

create index source_record_capabilities_capability_idx
on public.source_record_capabilities (capability_id, relevance_score desc);

create index capability_candidates_review_idx
on public.capability_candidates (status, occurrence_count desc, last_seen_at desc);

alter table public.course_learning_outcomes enable row level security;
alter table public.capability_aliases enable row level security;
alter table public.source_record_capabilities enable row level security;
alter table public.capability_candidates enable row level security;

grant select, insert, update, delete on table
  public.course_learning_outcomes,
  public.capability_aliases
to authenticated;

grant delete on table public.course_capabilities to authenticated;

grant select on table
  public.source_record_capabilities,
  public.capability_candidates
to authenticated;

grant usage, select on sequence
  public.course_learning_outcomes_id_seq,
  public.capability_aliases_id_seq
to authenticated;

grant all on table
  public.course_learning_outcomes,
  public.capability_aliases,
  public.source_record_capabilities,
  public.capability_candidates
to service_role;

grant all on sequence
  public.course_learning_outcomes_id_seq,
  public.capability_aliases_id_seq,
  public.capability_candidates_id_seq
to service_role;

create policy "Staff can manage course learning outcomes"
on public.course_learning_outcomes for all
to authenticated
using (exists (select 1 from public.staff_members where user_id = (select auth.uid()) and is_active))
with check (exists (select 1 from public.staff_members where user_id = (select auth.uid()) and is_active));

create policy "Staff can manage capability aliases"
on public.capability_aliases for all
to authenticated
using (exists (select 1 from public.staff_members where user_id = (select auth.uid()) and is_active))
with check (exists (select 1 from public.staff_members where user_id = (select auth.uid()) and is_active));

create policy "Staff can read source capability matches"
on public.source_record_capabilities for select
to authenticated
using (exists (select 1 from public.staff_members where user_id = (select auth.uid()) and is_active));

create policy "Staff can read capability candidates"
on public.capability_candidates for select
to authenticated
using (exists (select 1 from public.staff_members where user_id = (select auth.uid()) and is_active));

create or replace function public.copy_source_capabilities_to_job()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.job_id is not null and new.job_id is distinct from old.job_id then
    insert into public.job_capabilities (
      job_id, capability_id, importance, relevance_score, confidence,
      evidence_text, assignment_source, policy_version, source_record_id
    )
    select
      new.job_id, capability_id, importance, relevance_score, confidence,
      evidence_text, 'ai', policy_version, new.id
    from public.source_record_capabilities
    where source_record_id = new.id
    on conflict (job_id, capability_id) do update
    set importance = excluded.importance,
        relevance_score = excluded.relevance_score,
        confidence = excluded.confidence,
        evidence_text = excluded.evidence_text,
        assignment_source = excluded.assignment_source,
        policy_version = excluded.policy_version,
        source_record_id = excluded.source_record_id;
  end if;
  return new;
end;
$$;

create trigger copy_source_capabilities_after_job_link
after update of job_id on public.job_source_records
for each row execute function public.copy_source_capabilities_to_job();

revoke execute on function public.copy_source_capabilities_to_job()
from public, anon, authenticated;

create or replace function public.replace_source_capability_classification(
  p_source_record_id bigint,
  p_matches jsonb,
  p_candidates jsonb,
  p_policy_version text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  candidate jsonb;
begin
  if current_user <> 'service_role' then
    raise exception 'Service role required.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.job_source_records where id = p_source_record_id) then
    raise exception 'Source record not found.' using errcode = 'P0002';
  end if;

  delete from public.source_record_capabilities where source_record_id = p_source_record_id;
  delete from public.job_capabilities
  where source_record_id = p_source_record_id and assignment_source = 'ai';

  insert into public.source_record_capabilities (
    source_record_id, capability_id, importance, relevance_score, confidence,
    evidence_text, policy_version
  )
  select
    p_source_record_id,
    (item->>'capabilityId')::bigint,
    item->>'importance',
    (item->>'relevanceScore')::smallint,
    (item->>'confidence')::smallint,
    item->>'evidence',
    p_policy_version
  from jsonb_array_elements(coalesce(p_matches, '[]'::jsonb)) as item
  join public.capabilities on capabilities.id = (item->>'capabilityId')::bigint
  where capabilities.is_active
  on conflict (source_record_id, capability_id) do update
  set importance = excluded.importance,
      relevance_score = excluded.relevance_score,
      confidence = excluded.confidence,
      evidence_text = excluded.evidence_text,
      policy_version = excluded.policy_version,
      updated_at = now();

  insert into public.job_capabilities (
    job_id, capability_id, importance, relevance_score, confidence,
    evidence_text, assignment_source, policy_version, source_record_id
  )
  select
    source_record.job_id, match.capability_id, match.importance,
    match.relevance_score, match.confidence, match.evidence_text, 'ai', match.policy_version,
    source_record.id
  from public.job_source_records as source_record
  join public.source_record_capabilities as match
    on match.source_record_id = source_record.id
  where source_record.id = p_source_record_id
    and source_record.job_id is not null
  on conflict (job_id, capability_id) do update
  set importance = excluded.importance,
      relevance_score = excluded.relevance_score,
      confidence = excluded.confidence,
      evidence_text = excluded.evidence_text,
      assignment_source = excluded.assignment_source,
      policy_version = excluded.policy_version,
      source_record_id = excluded.source_record_id;

  for candidate in select * from jsonb_array_elements(coalesce(p_candidates, '[]'::jsonb))
  loop
    insert into public.capability_candidates (
      source_record_id, proposed_title, evidence_text, confidence
    )
    values (
      p_source_record_id,
      candidate->>'title',
      candidate->>'evidence',
      (candidate->>'confidence')::smallint
    )
    on conflict (normalised_title) do update
    set source_record_id = excluded.source_record_id,
        evidence_text = excluded.evidence_text,
        confidence = greatest(public.capability_candidates.confidence, excluded.confidence),
        occurrence_count = public.capability_candidates.occurrence_count
          + case when public.capability_candidates.source_record_id is distinct from excluded.source_record_id then 1 else 0 end,
        last_seen_at = now(),
        updated_at = now()
    where public.capability_candidates.status = 'pending';
  end loop;
end;
$$;

revoke execute on function public.replace_source_capability_classification(bigint, jsonb, jsonb, text)
from public, anon, authenticated;
grant execute on function public.replace_source_capability_classification(bigint, jsonb, jsonb, text)
to service_role;
