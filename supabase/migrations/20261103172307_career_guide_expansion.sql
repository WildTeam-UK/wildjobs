-- Extend the existing private evidence/review workflow; no source bodies become public.
alter table public.directory_role_aliases
  drop constraint directory_role_aliases_role_slug_check,
  add constraint directory_role_aliases_role_slug_check check (role_slug in (
    'ecologist','project-manager','project-officer','environmental-educator','biologist','chief-executive'
  ));
alter table public.career_guide_revisions
  drop constraint career_guide_revisions_guide_slug_check,
  add constraint career_guide_revisions_guide_slug_check check (guide_slug in (
    'wildlife-conservation','ecologist','carbon-climate-energy','ecology',
    'environmental-education','environmental-management','food-farming-horticulture',
    'marine-conservation','policy-campaigning','rivers-water-hydrology',
    'sustainability','sustainable-transport','project-manager','project-officer',
    'environmental-educator','biologist','chief-executive'
  ));

-- Generated metadata backfills retained snapshots. Existing private permissions remain.
alter table public.directory_guide_evidence add column is_detailed boolean
  generated always as (
    length(btrim(source_text)) >= 200
    and source_text !~* '^.{0,150}(ad closed|sorry.{0,20}no longer live|page not found|access denied)'
  ) stored;
comment on column public.directory_guide_evidence.is_detailed is
  'Threshold evidence has at least 200 characters and is not a recognised closed/error landing page. It does not verify every job fact.';
