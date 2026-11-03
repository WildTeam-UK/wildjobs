-- Extend the existing review workflow to the complete sector catalogue.
-- Publication state, RLS, source privacy and existing revisions are preserved.
alter table public.career_guide_revisions
  drop constraint career_guide_revisions_guide_slug_check,
  add constraint career_guide_revisions_guide_slug_check check (guide_slug in (
    'wildlife-conservation', 'ecologist', 'carbon-climate-energy', 'ecology',
    'environmental-education', 'environmental-management', 'food-farming-horticulture',
    'marine-conservation', 'policy-campaigning', 'rivers-water-hydrology',
    'sustainability', 'sustainable-transport'
  ));
