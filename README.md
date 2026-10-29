# WildJobs

WildJobs is WildTeam's independent conservation careers platform, intended for `jobs.wildteam.org.uk`.

The application is connected to its independent Supabase project. Public job discovery and employer profiles read approved live records; candidate authentication, private saved jobs and explicit job preferences are connected; and authorised staff can curate, review and publish jobs. Source connectors check WWT's public vacancy page and the reviewed Countryside Jobs Service RSS feed, automatically every two hours or on demand, and route discoveries into manual review without automatic publication. The controlled employer journey creates seven-day, single-use invitation links, validates and consumes them through a protected server route, and sends complete submissions into the staff-only review queue without automatic publication. The career area still contains clearly labelled prototype content. Analytics and marketing integrations are not implemented yet.

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

Production source imports require `SUPABASE_SECRET_KEY` and `AUTOMATION_SECRET` as encrypted,
server-only Vercel environment variables. The same automation-secret value is stored in Supabase
Vault as `wildjobs_automation_secret`. Supabase calls the protected heartbeat every minute; an
atomic database claim releases source-import work once every two hours.

Run the complete local checks with:

```sh
pnpm check
```

## Current boundaries

- Published jobs and their source provenance live in Supabase; fixture jobs in `lib/jobs.ts` remain design references only.
- Source discovery is restricted to explicitly reviewed endpoints. WWT HTML and Countryside Jobs Service RSS are checked every two hours by the protected automation heartbeat and can also be checked manually by an administrator; neither route publishes a vacancy automatically.
- Employer invitations, protected employer submission and staff submission review are connected to production data. Career and course experiences are not yet fully connected.
- The site is marked `noindex` until approved data and a production domain are connected.
- Shared design tokens are pinned to the private `@wildteam-uk/tokens` package released through GitHub Packages. Local development requires a personal package login; CI uses its repository-scoped `GITHUB_TOKEN`.
- Read `docs/IMPLEMENTATION_PLAN.md`, `docs/EXPERIENCE_BLUEPRINT.md`, `docs/PRODUCT_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_OWNERSHIP.md` before implementation.
