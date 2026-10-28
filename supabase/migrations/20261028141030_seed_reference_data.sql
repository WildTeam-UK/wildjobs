insert into public.career_areas (slug, title, description, display_order)
values
  ('community-conservation', 'Community conservation', 'Work with communities and partners to create durable local change.', 10),
  ('marine-conservation', 'Marine conservation', 'Protect and restore coastal and marine ecosystems.', 20),
  ('science-and-research', 'Science and research', 'Use evidence, monitoring and analysis to guide conservation action.', 30),
  ('programme-management', 'Programme management', 'Plan, coordinate and strengthen conservation programmes.', 40),
  ('communications', 'Communications', 'Turn conservation evidence into clear and useful communication.', 50),
  ('early-careers', 'Early careers', 'Build practical experience and begin a conservation career.', 60)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

-- Courses, capabilities and their mappings are intentionally not seeded until
-- the approved LearnWorlds identifiers, URLs and learning outcomes are supplied.
