# WildJobs

WildJobs is WildTeam's independent conservation careers platform, intended for `jobs.wildteam.org.uk`.

The application is connected to its independent Supabase project. Public job discovery reads approved live vacancies, candidate email/password authentication is connected, and authorised staff can curate, review and publish jobs. The first source connector lets an administrator check WWT's public vacancy page and route discoveries into manual review without automatic publication. Employer, career and submission areas still contain clearly labelled prototype content. Analytics and marketing integrations are not implemented yet.

The approved beta direction is documented in `docs/IMPLEMENTATION_PLAN.md` and `docs/EXPERIENCE_BLUEPRINT.md`.

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

- Published jobs and their source provenance live in Supabase; fixture jobs in `lib/jobs.ts` remain design references only.
- WWT discovery is manual, administrator-only and restricted to the approved WWT vacancies endpoint. It never publishes a vacancy automatically.
- Employer, career, course and submission experiences are not yet fully connected to production data.
- The site is marked `noindex` until approved data and a production domain are connected.
- Shared design tokens are pinned to the private `@wildteam-uk/tokens` package released through GitHub Packages. Local development requires a personal package login; CI uses its repository-scoped `GITHUB_TOKEN`.
- Read `docs/IMPLEMENTATION_PLAN.md`, `docs/EXPERIENCE_BLUEPRINT.md`, `docs/PRODUCT_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_OWNERSHIP.md` before implementation.
