insert into public.occupations (slug, title, description)
values
  ('arboricultural-consultant', 'Arboricultural consultant', 'Advise on tree health, safety, planning and management.'),
  ('conservation-adviser', 'Conservation adviser', 'Provide evidence-based advice that improves conservation decisions and land management.'),
  ('conservation-scientist', 'Conservation scientist', 'Research, monitor and analyse species, habitats and environmental change.'),
  ('countryside-operative', 'Countryside operative', 'Deliver practical countryside, habitat and access work.'),
  ('ecologist', 'Ecologist', 'Survey, assess and advise on species, habitats and ecological impacts.'),
  ('engineer', 'Engineer', 'Design or manage technical infrastructure and engineering work connected to the environment.'),
  ('environmental-education-officer', 'Environmental education officer', 'Design and deliver learning that connects people with nature.'),
  ('environmental-engagement-officer', 'Environmental engagement officer', 'Build participation, partnerships and public engagement around environmental work.'),
  ('estate-manager', 'Estate manager', 'Manage land, property, facilities and operational delivery across an estate.'),
  ('forester', 'Forester', 'Create, manage and restore forests and woodlands.'),
  ('fundraiser', 'Fundraiser', 'Secure grants, donations and other income for an organisation or programme.'),
  ('gardener', 'Gardener', 'Create and maintain gardens, planted spaces and horticultural collections.'),
  ('general-manager', 'General manager', 'Lead an organisation, service or multi-disciplinary operational team.'),
  ('grounds-maintenance-operative', 'Grounds maintenance operative', 'Maintain parks, grounds and outdoor public spaces.'),
  ('land-management-adviser', 'Land management adviser', 'Advise land managers on nature recovery, farming and sustainable land use.'),
  ('marketing-communications-officer', 'Marketing and communications officer', 'Create campaigns and content that build awareness and participation.'),
  ('programme-manager', 'Programme manager', 'Coordinate a portfolio of connected projects and their strategic outcomes.'),
  ('project-assistant', 'Project assistant', 'Provide delivery and administrative support to a project or programme.'),
  ('project-manager', 'Project manager', 'Plan, coordinate and deliver a defined conservation or environmental project.'),
  ('project-officer', 'Project officer', 'Deliver the practical, partnership and reporting work of a defined project.'),
  ('ranger', 'Ranger', 'Care for protected places, wildlife, visitors and countryside access.'),
  ('reserves-officer', 'Reserves officer', 'Manage nature reserves, habitats, volunteers and site work programmes.'),
  ('site-manager', 'Site manager', 'Lead the safe day-to-day management of a conservation or visitor site.'),
  ('visitor-services-officer', 'Visitor services officer', 'Welcome and support visitors at nature, heritage or outdoor sites.'),
  ('volunteer-coordinator', 'Volunteer coordinator', 'Recruit, support and develop volunteers and volunteer programmes.'),
  ('warden', 'Warden', 'Protect and manage wildlife sites while supporting visitors and local communities.')
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  is_active = true,
  updated_at = now();

with aliases(occupation_slug, alias, normalized_alias) as (
  values
    ('arboricultural-consultant', 'Arboriculture consultant', 'arboriculture consultant'),
    ('conservation-adviser', 'Conservation advisor', 'conservation advisor'),
    ('conservation-scientist', 'Researcher', 'researcher'),
    ('countryside-operative', 'Countryside worker', 'countryside worker'),
    ('environmental-education-officer', 'Education officer', 'education officer'),
    ('environmental-engagement-officer', 'Engagement officer', 'engagement officer'),
    ('estate-manager', 'Estates manager', 'estates manager'),
    ('forester', 'Forest manager', 'forest manager'),
    ('fundraiser', 'Fundraising manager', 'fundraising manager'),
    ('grounds-maintenance-operative', 'Groundskeeper', 'groundskeeper'),
    ('land-management-adviser', 'Land management advisor', 'land management advisor'),
    ('marketing-communications-officer', 'Communications officer', 'communications officer'),
    ('marketing-communications-officer', 'Marketing officer', 'marketing officer'),
    ('project-officer', 'Programme officer', 'programme officer'),
    ('ranger', 'Park ranger', 'park ranger'),
    ('reserves-officer', 'Reserve officer', 'reserve officer'),
    ('visitor-services-officer', 'Visitor engagement officer', 'visitor engagement officer'),
    ('volunteer-coordinator', 'Volunteering development manager', 'volunteering development manager')
)
insert into public.occupation_aliases (occupation_id, alias, normalized_alias)
select occupations.id, aliases.alias, aliases.normalized_alias
from aliases
join public.occupations on occupations.slug = aliases.occupation_slug
on conflict (normalized_alias) do update
set
  occupation_id = excluded.occupation_id,
  alias = excluded.alias;

insert into public.benefits (slug, title, description)
values
  ('accommodation', 'Accommodation', 'Employer-provided or subsidised accommodation.'),
  ('annual-leave', 'Enhanced annual leave', 'Annual leave above the statutory minimum or additional leave purchase.'),
  ('cycle-to-work', 'Cycle to work scheme', 'Tax-efficient bicycle purchase or cycling support.'),
  ('employee-assistance', 'Employee assistance programme', 'Confidential wellbeing, counselling or practical support.'),
  ('equipment-or-vehicle', 'Equipment or vehicle provided', 'Role-specific equipment, vehicle or transport supplied by the employer.'),
  ('expenses', 'Expenses', 'Reimbursement of approved travel, subsistence or volunteering costs.'),
  ('flexible-working', 'Flexible working', 'Flexibility over working hours, patterns or location.'),
  ('healthcare', 'Healthcare', 'Private medical, dental, optical or health cash-plan support.'),
  ('life-assurance', 'Life assurance', 'Employer-funded life assurance or death-in-service cover.'),
  ('parental-leave', 'Enhanced parental leave', 'Maternity, paternity, adoption or shared-parental leave above statutory provision.'),
  ('pension', 'Pension', 'Employer pension contribution or enhanced pension scheme.'),
  ('professional-development', 'Professional development', 'Training, qualifications, mentoring or a professional development budget.'),
  ('relocation-support', 'Relocation support', 'Financial or practical help with relocation.'),
  ('remote-or-hybrid-working', 'Remote or hybrid working', 'A supported remote or hybrid working arrangement.'),
  ('sick-pay', 'Enhanced sick pay', 'Sick pay above statutory provision.'),
  ('staff-discount', 'Staff discount', 'Discounts on employer or partner products, services or memberships.'),
  ('visa-sponsorship', 'Visa sponsorship', 'Employer sponsorship for an eligible work visa.'),
  ('volunteering-leave', 'Volunteering leave', 'Paid time away from normal duties to volunteer.'),
  ('wellbeing-support', 'Wellbeing support', 'Structured health, wellbeing or mental-health support.')
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  is_active = true,
  updated_at = now();

with aliases(benefit_slug, alias, normalized_alias) as (
  values
    ('annual-leave', 'Holiday allowance', 'holiday allowance'),
    ('employee-assistance', 'EAP', 'eap'),
    ('expenses', 'Travel expenses', 'travel expenses'),
    ('flexible-working', 'Flexitime', 'flexitime'),
    ('flexible-working', 'Flexible hours', 'flexible hours'),
    ('healthcare', 'Health cash plan', 'health cash plan'),
    ('life-assurance', 'Death in service', 'death in service'),
    ('pension', 'Employer pension contribution', 'employer pension contribution'),
    ('professional-development', 'Training budget', 'training budget'),
    ('remote-or-hybrid-working', 'Home working', 'home working'),
    ('remote-or-hybrid-working', 'Hybrid working', 'hybrid working'),
    ('staff-discount', 'Employee discount', 'employee discount')
)
insert into public.benefit_aliases (benefit_id, alias, normalized_alias)
select benefits.id, aliases.alias, aliases.normalized_alias
from aliases
join public.benefits on benefits.slug = aliases.benefit_slug
on conflict (normalized_alias) do update
set
  benefit_id = excluded.benefit_id,
  alias = excluded.alias;

insert into public.career_areas (slug, title, description, display_order)
values
  ('ecology-and-assessment', 'Ecology and environmental assessment', 'Survey, assess and advise on species, habitats and environmental impacts.', 25),
  ('land-and-reserves-management', 'Land and reserves management', 'Care for habitats, protected places, farms, forests and countryside access.', 35),
  ('education-and-engagement', 'Education and engagement', 'Help people learn about, participate in and support conservation.', 45),
  ('fundraising-and-development', 'Fundraising and development', 'Build the income and partnerships that make conservation work possible.', 55),
  ('operations-and-visitor-services', 'Operations and visitor services', 'Run sites, estates, facilities and welcoming visitor experiences.', 65),
  ('policy-and-advocacy', 'Policy and advocacy', 'Influence decisions, regulation and public policy for nature.', 75)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

alter table public.job_career_areas
add column original_text text,
add column evidence_text text,
add column confidence smallint,
add column assignment_source text not null default 'staff',
add column policy_version text,
add column reviewed_at timestamptz,
add column updated_at timestamptz not null default now();

update public.job_career_areas
set reviewed_at = coalesce(reviewed_at, created_at)
where assignment_source = 'staff' and reviewed_at is null;

alter table public.job_career_areas
add constraint job_career_areas_confidence_valid check (
  confidence is null or confidence between 0 and 100
),
add constraint job_career_areas_assignment_source_valid check (
  assignment_source in ('deterministic', 'ai', 'staff')
),
add constraint job_career_areas_ai_evidence_required check (
  assignment_source <> 'ai'
  or (
    nullif(trim(evidence_text), '') is not null
    and confidence is not null
    and nullif(trim(policy_version), '') is not null
  )
),
add constraint job_career_areas_staff_review_required check (
  assignment_source <> 'staff' or reviewed_at is not null
);

with ranked as (
  select
    job_id,
    career_area_id,
    row_number() over (partition by job_id order by created_at, career_area_id) as position
  from public.job_career_areas
  where is_primary
)
update public.job_career_areas
set is_primary = false
from ranked
where job_career_areas.job_id = ranked.job_id
  and job_career_areas.career_area_id = ranked.career_area_id
  and ranked.position > 1;

create unique index job_career_areas_one_primary_idx
on public.job_career_areas (job_id)
where is_primary;

create table public.taxonomy_candidates (
  id bigint generated always as identity primary key,
  source_record_id bigint not null references public.job_source_records(id) on delete cascade,
  job_id bigint not null references public.jobs(id) on delete cascade,
  taxonomy_type text not null,
  proposed_title text not null,
  normalized_title text not null,
  original_text text,
  evidence_text text not null,
  confidence smallint not null,
  status text not null default 'pending',
  resolved_occupation_id bigint references public.occupations(id) on delete set null,
  resolved_benefit_id bigint references public.benefits(id) on delete set null,
  policy_version text not null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxonomy_candidates_type_valid check (
    taxonomy_type in ('occupation', 'benefit')
  ),
  constraint taxonomy_candidates_title_present check (
    char_length(trim(proposed_title)) between 2 and 160
  ),
  constraint taxonomy_candidates_normalized_title_present check (
    char_length(trim(normalized_title)) between 2 and 160
  ),
  constraint taxonomy_candidates_evidence_present check (
    char_length(trim(evidence_text)) between 2 and 500
  ),
  constraint taxonomy_candidates_confidence_valid check (
    confidence between 0 and 100
  ),
  constraint taxonomy_candidates_status_valid check (
    status in ('pending', 'merged', 'promoted', 'rejected')
  ),
  constraint taxonomy_candidates_resolution_valid check (
    (taxonomy_type = 'occupation' and resolved_benefit_id is null)
    or (taxonomy_type = 'benefit' and resolved_occupation_id is null)
  ),
  constraint taxonomy_candidates_review_valid check (
    status = 'pending'
    or reviewed_at is not null
  ),
  unique (source_record_id, taxonomy_type, normalized_title)
);

create index taxonomy_candidates_review_idx
on public.taxonomy_candidates (status, taxonomy_type, created_at);

alter table public.taxonomy_candidates enable row level security;

revoke all on table public.taxonomy_candidates from public, anon, authenticated;
grant select, update on table public.taxonomy_candidates to authenticated;
grant all on table public.taxonomy_candidates to service_role;
grant usage, select on sequence public.taxonomy_candidates_id_seq to service_role;

create policy "Staff can read taxonomy candidates"
on public.taxonomy_candidates for select
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create policy "Staff can update taxonomy candidates"
on public.taxonomy_candidates for update
to authenticated
using (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
)
with check (
  exists (
    select 1 from public.staff_members
    where user_id = (select auth.uid()) and is_active
  )
);

create function public.replace_job_taxonomy_enrichment(
  p_source_record_id bigint,
  p_job_id bigint,
  p_occupation_matches jsonb,
  p_benefit_matches jsonb,
  p_career_area_matches jsonb,
  p_locations jsonb,
  p_candidates jsonb,
  p_policy_version text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'service_role' then
    raise insufficient_privilege using message = 'Service access is required.';
  end if;

  if char_length(coalesce(trim(p_policy_version), '')) < 2 then
    raise check_violation using message = 'A taxonomy policy version is required.';
  end if;

  if not exists (
    select 1
    from public.job_source_records
    join public.jobs on jobs.id = job_source_records.job_id
    where job_source_records.id = p_source_record_id
      and job_source_records.job_id = p_job_id
      and jobs.status <> 'withdrawn'
  ) then
    raise check_violation using message = 'The source record is not linked to an eligible job.';
  end if;

  delete from public.job_occupations
  where job_id = p_job_id and assignment_source = 'ai';

  with valid as (
    select
      occupations.id as occupation_id,
      item,
      row_number() over (
        order by (item->>'confidence')::smallint desc, occupations.id
      ) as position
    from jsonb_array_elements(coalesce(p_occupation_matches, '[]'::jsonb)) as item
    join public.occupations
      on occupations.id = (item->>'termId')::bigint
     and occupations.is_active
    where (item->>'confidence')::smallint between 60 and 100
      and char_length(coalesce(trim(item->>'evidence'), '')) between 2 and 500
  )
  insert into public.job_occupations (
    job_id, occupation_id, is_primary, original_text, evidence_text,
    confidence, assignment_source, policy_version
  )
  select
    p_job_id,
    valid.occupation_id,
    valid.position = 1 and not exists (
      select 1 from public.job_occupations
      where job_id = p_job_id and is_primary
    ),
    nullif(trim(valid.item->>'originalText'), ''),
    trim(valid.item->>'evidence'),
    (valid.item->>'confidence')::smallint,
    'ai',
    p_policy_version
  from valid
  on conflict (job_id, occupation_id) do update
  set
    original_text = excluded.original_text,
    evidence_text = excluded.evidence_text,
    confidence = excluded.confidence,
    policy_version = excluded.policy_version,
    updated_at = now()
  where public.job_occupations.assignment_source = 'ai'
    and public.job_occupations.reviewed_at is null;

  delete from public.job_benefits
  where job_id = p_job_id and assignment_source = 'ai';

  insert into public.job_benefits (
    job_id, benefit_id, original_text, evidence_text,
    confidence, assignment_source, policy_version
  )
  select
    p_job_id,
    benefits.id,
    nullif(trim(item->>'originalText'), ''),
    trim(item->>'evidence'),
    (item->>'confidence')::smallint,
    'ai',
    p_policy_version
  from jsonb_array_elements(coalesce(p_benefit_matches, '[]'::jsonb)) as item
  join public.benefits
    on benefits.id = (item->>'termId')::bigint
   and benefits.is_active
  where (item->>'confidence')::smallint between 60 and 100
    and char_length(coalesce(trim(item->>'evidence'), '')) between 2 and 500
  on conflict (job_id, benefit_id) do update
  set
    original_text = excluded.original_text,
    evidence_text = excluded.evidence_text,
    confidence = excluded.confidence,
    policy_version = excluded.policy_version,
    updated_at = now()
  where public.job_benefits.assignment_source = 'ai'
    and public.job_benefits.reviewed_at is null;

  delete from public.job_career_areas
  where job_id = p_job_id and assignment_source = 'ai';

  with valid as (
    select
      career_areas.id as career_area_id,
      item,
      row_number() over (
        order by (item->>'confidence')::smallint desc, career_areas.display_order, career_areas.id
      ) as position
    from jsonb_array_elements(coalesce(p_career_area_matches, '[]'::jsonb)) as item
    join public.career_areas
      on career_areas.id = (item->>'termId')::bigint
     and career_areas.is_active
    where (item->>'confidence')::smallint between 60 and 100
      and char_length(coalesce(trim(item->>'evidence'), '')) between 2 and 500
  )
  insert into public.job_career_areas (
    job_id, career_area_id, is_primary, original_text, evidence_text,
    confidence, assignment_source, policy_version
  )
  select
    p_job_id,
    valid.career_area_id,
    valid.position = 1 and not exists (
      select 1 from public.job_career_areas
      where job_id = p_job_id and is_primary
    ),
    nullif(trim(valid.item->>'originalText'), ''),
    trim(valid.item->>'evidence'),
    (valid.item->>'confidence')::smallint,
    'ai',
    p_policy_version
  from valid
  on conflict (job_id, career_area_id) do update
  set
    original_text = excluded.original_text,
    evidence_text = excluded.evidence_text,
    confidence = excluded.confidence,
    policy_version = excluded.policy_version,
    updated_at = now()
  where public.job_career_areas.assignment_source = 'ai'
    and public.job_career_areas.reviewed_at is null;

  delete from public.job_locations
  where job_id = p_job_id and assignment_source = 'ai';

  with valid as (
    select
      item,
      row_number() over (
        order by (item->>'confidence')::smallint desc, item->>'rawText'
      ) as position
    from jsonb_array_elements(coalesce(p_locations, '[]'::jsonb)) as item
    where (item->>'confidence')::smallint between 60 and 100
      and char_length(coalesce(trim(item->>'rawText'), '')) between 2 and 500
      and char_length(coalesce(trim(item->>'evidence'), '')) between 2 and 500
      and item->>'precision' in ('exact', 'postcode', 'locality', 'region', 'country')
      and (
        nullif(trim(item->>'countryCode'), '') is null
        or item->>'countryCode' ~ '^[A-Z]{2}$'
      )
  )
  insert into public.job_locations (
    job_id, raw_text, address_line_1, address_line_2, locality, region,
    postal_code, country_code, precision, is_primary, evidence_text,
    confidence, assignment_source, policy_version
  )
  select
    p_job_id,
    trim(valid.item->>'rawText'),
    nullif(trim(valid.item->>'addressLine1'), ''),
    nullif(trim(valid.item->>'addressLine2'), ''),
    nullif(trim(valid.item->>'locality'), ''),
    nullif(trim(valid.item->>'region'), ''),
    nullif(trim(valid.item->>'postalCode'), ''),
    nullif(trim(valid.item->>'countryCode'), ''),
    valid.item->>'precision',
    valid.position = 1 and not exists (
      select 1 from public.job_locations
      where job_id = p_job_id and is_primary
    ),
    trim(valid.item->>'evidence'),
    (valid.item->>'confidence')::smallint,
    'ai',
    p_policy_version
  from valid
  where not exists (
    select 1 from public.job_locations
    where job_id = p_job_id
      and lower(trim(raw_text)) = lower(trim(valid.item->>'rawText'))
  );

  delete from public.taxonomy_candidates
  where source_record_id = p_source_record_id
    and status = 'pending';

  insert into public.taxonomy_candidates (
    source_record_id, job_id, taxonomy_type, proposed_title, normalized_title,
    original_text, evidence_text, confidence, policy_version
  )
  select
    p_source_record_id,
    p_job_id,
    item->>'taxonomyType',
    trim(item->>'title'),
    trim(item->>'normalizedTitle'),
    nullif(trim(item->>'originalText'), ''),
    trim(item->>'evidence'),
    (item->>'confidence')::smallint,
    p_policy_version
  from jsonb_array_elements(coalesce(p_candidates, '[]'::jsonb)) as item
  where item->>'taxonomyType' in ('occupation', 'benefit')
    and char_length(coalesce(trim(item->>'title'), '')) between 2 and 160
    and char_length(coalesce(trim(item->>'normalizedTitle'), '')) between 2 and 160
    and char_length(coalesce(trim(item->>'evidence'), '')) between 2 and 500
    and (item->>'confidence')::smallint between 75 and 100
  on conflict (source_record_id, taxonomy_type, normalized_title) do update
  set
    proposed_title = excluded.proposed_title,
    original_text = excluded.original_text,
    evidence_text = excluded.evidence_text,
    confidence = greatest(public.taxonomy_candidates.confidence, excluded.confidence),
    policy_version = excluded.policy_version,
    updated_at = now()
  where public.taxonomy_candidates.status = 'pending';
end;
$$;

revoke execute on function public.replace_job_taxonomy_enrichment(
  bigint, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, text
) from public, anon, authenticated;
grant execute on function public.replace_job_taxonomy_enrichment(
  bigint, bigint, jsonb, jsonb, jsonb, jsonb, jsonb, text
) to service_role;
