# WildJobs local Supabase development

This folder is the source of truth for the WildJobs database. It is not linked to a hosted Supabase project yet.

## Prerequisites

- Node.js and pnpm versions supported by the repository.

The Supabase CLI is pinned in `devDependencies`; do not install or rely on an unrelated global version.

Docker Desktop is optional. It is needed only when a developer chooses to run a disposable Supabase stack locally.

## Hosted verification

The `wildjobs` project in the WildTeam UK Supabase organisation is the hosted beta database. Apply migrations in filename order through an authenticated Supabase workflow, then run:

- The rollback-only pgTAP suite in `supabase/tests`.
- Supabase security advisors.
- Supabase performance advisors.
- A final check that no test users, jobs or submissions remain.

Never paste hosted credentials into this repository or commit local Supabase link metadata.

## Optional local verification

From the repository root:

```sh
pnpm db:start
pnpm db:reset
pnpm db:lint
pnpm db:test
pnpm db:stop
```

`db:reset` creates a clean local database and applies every migration in order. `db:test` runs the pgTAP security suite, including anonymous, candidate, staff and inactive-staff access checks.

## Migration rules

- Create every new migration with `pnpm exec supabase migration new <descriptive_name>`.
- Never edit a migration that has been applied to a shared or hosted environment; add a new migration instead.
- Keep reference data keyed by stable slugs or approved external identifiers rather than generated database IDs.
- Run the database lint and test commands before committing migration changes.
- Never commit project secrets, database passwords, API keys, invitation tokens or production data.

## Current boundaries

- `supabase/config.toml` configures optional local development only.
- `supabase/migrations` contains the proposed beta schema, indexes, grants and RLS policies.
- `supabase/tests` verifies access boundaries.
- `supabase/seed.sql` intentionally contains no vacancies, accounts or personal data.
- Courses and course-capability mappings remain empty until approved LearnWorlds identifiers and learning outcomes are supplied.

Hosted project changes remain explicit, reviewed actions even though the repository also supports local development.
