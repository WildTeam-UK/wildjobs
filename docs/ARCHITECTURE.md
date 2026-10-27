# WildJobs architecture

## Current implementation

WildJobs is a Next.js App Router application written in strict TypeScript and intended for independent Vercel deployment. The initial scaffold uses in-repository fixture data only.

```text
browser
  -> Next.js server-rendered public pages
  -> client-side filtering of the small fixture collection
  -> no external APIs, database, authentication or tracking
```

## Planned production architecture

```text
browser
  -> Vercel CDN and Next.js application
       -> server-rendered job discovery pages
       -> Route Handlers for approved writes and integrations
       -> separate WildJobs Supabase project
            -> Postgres
            -> Row Level Security
            -> staff-only Supabase Auth
       -> approved job-source adapter
```

The first production backend should use normal request-driven Vercel Functions. Do not introduce Services, Queues or durable Workflows until workload evidence requires them.

## Application ownership

- WildJobs owns job, employer and future career-profile records.
- LearnWorlds owns learner accounts, purchases, progress, certificates and training access.
- Brevo owns marketing subscription preferences and consent evidence.
- `wildteam-shared` owns shared standards, design tokens and reusable UI packages.
- WildNews remains operationally and technically independent.

## Shared packages

Do not commit a sibling `file:` dependency. During package development, temporary local linking may be used without changing `package.json`. Before the first Vercel preview that consumes shared code, publish approved private versions of `@wildteam/tokens` and `@wildteam/ui`, then pin deliberate versions in this repository.

Until that distribution path exists, `app/globals.css` contains a small, documented temporary copy of the required `--wt-*` token values. It must not become a second design-token source.

## Planned database boundary

The initial production schema is expected to include organisations, sources, jobs, categories, job-category links, import runs and staff access. All database changes must be ordered migrations in `supabase/migrations` once a Supabase project is approved.

Every table in an exposed schema must have RLS. Public access will be limited to active, approved listings. Staff access will require an active staff record, while imports will use server-only credentials.

## Search

Start with Postgres full-text search and appropriate indexes. Do not add a separate search service until query quality, volume or latency demonstrates the need.

## Privacy and measurement

The initial public scaffold stores no personal data and loads no optional analytics. Public accounts, saved jobs, alerts and measurement require separate privacy and consent review.

## Environments

Local, preview and production environments must remain distinct. Environment-variable names and purposes will be documented in `.env.example` when the first external service is approved. Real values are never committed.
