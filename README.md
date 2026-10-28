# WildJobs

WildJobs is WildTeam's independent conservation careers platform, intended for `jobs.wildteam.org.uk`.

This initial application demonstrates the public discovery experience with clearly labelled fixture data. Its Supabase foundation and server-rendered session plumbing are connected, but the visible job content is still fixture-only. Candidate authentication, analytics, marketing integration and job ingestion are not implemented yet.

The proposed production direction is documented in `docs/IMPLEMENTATION_PLAN.md` and `docs/EXPERIENCE_BLUEPRINT.md`. Both remain drafts until product review; the fixture prototype does not define the production data model.

## Development

Requirements:

- Node.js 22.13 or newer
- pnpm 11.25

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Set the two public Supabase values in `.env.local`, then verify the hosted connection with:

```sh
pnpm db:check-connection
```

Never place a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

Run the complete local checks with:

```sh
pnpm check
```

## Current boundaries

- Fixture jobs live in `lib/jobs.ts` and are not real vacancies.
- Supabase owns the approved WildJobs schema and reference data; the public pages do not read production jobs from it yet.
- The site is marked `noindex` until approved data and a production domain are connected.
- Shared design tokens are pinned to the private `@wildteam-uk/tokens` package released through GitHub Packages. Local development requires a personal package login; CI uses its repository-scoped `GITHUB_TOKEN`.
- Read `docs/IMPLEMENTATION_PLAN.md`, `docs/EXPERIENCE_BLUEPRINT.md`, `docs/PRODUCT_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_OWNERSHIP.md` before implementation.
