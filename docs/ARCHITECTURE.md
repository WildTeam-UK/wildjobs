# WildJobs architecture

## Current implementation

WildJobs is a Next.js App Router application written in strict TypeScript and independently deployed on Vercel. Public job pages, candidate authentication and staff vacancy operations are connected to the independent WildJobs Supabase project. Employer, career, course and submission areas still include prototype content.

```text
browser
  -> Next.js server-rendered public pages
       -> Supabase public job catalogue protected by Row Level Security
       -> Supabase Auth for candidate and staff sessions
       -> authenticated staff review and publication actions
       -> administrator-triggered approved-source discovery
  -> no optional analytics or marketing integration
```

## Beta architecture

```text
browser
  -> Vercel CDN and Next.js application
       -> server-rendered job discovery pages
       -> Server Actions for approved staff writes
       -> separate WildJobs Supabase project
            -> Postgres
            -> Row Level Security
            -> candidate and staff Supabase Auth
       -> exact-host source adapters
            -> WWT public vacancies HTML
            -> Countryside Jobs Service RSS 2.0
            -> public vacancy identities and content hashes only
            -> private discovery queue
            -> manual review before publication
```

The first production backend should use normal request-driven Vercel Functions. Do not introduce Services, Queues or durable Workflows until workload evidence requires them.

## Application ownership

- WildJobs owns job, employer and future career-profile records.
- LearnWorlds owns learner accounts, purchases, progress, certificates and training access.
- Brevo owns marketing subscription preferences and consent evidence.
- `wildteam-shared` owns shared standards, design tokens and reusable UI packages.
- WildNews remains operationally and technically independent.

## Shared packages

Do not commit a sibling `file:` dependency. During package development, temporary local linking may be used without changing `package.json`. WildJobs pins deliberate private package versions from GitHub Packages and upgrades them through its own reviewed changes.

`@wildteam-uk/tokens` is the source of truth for shared `--wt-*` values. GitHub Actions reads the package with its repository-scoped workflow token. Local developers authenticate through their personal npm configuration; credentials are never committed. Before the first Vercel preview, configure a read-only package token in Vercel's secret environment without exposing it to application runtime code.

## Database boundary

The independent `wildjobs` Supabase project and beta schema were created in the WildTeam UK organisation on 2026-10-28. The application reads and writes the hosted database through authenticated, RLS-protected clients; no service-role key is exposed to the browser.

The schema includes employers, jobs, career areas, course-capability mappings, provenance, import runs, controlled employer submissions, candidate profiles, saved jobs, preferences and staff moderation. All changes remain ordered migrations in `supabase/migrations`.

Every table in an exposed schema has RLS. Public access is limited to active, approved listings. Staff access requires an active staff record. Current connectors are manual administrator actions running on the server and permit only reviewed source endpoints; future scheduled connectors will require a separately approved server-only credential path.

## Search

Start with Postgres full-text search and appropriate indexes. Do not add a separate search service until query quality, volume or latency demonstrates the need.

## Privacy and measurement

Supabase Auth and candidate-owned records hold the minimum account data required for enabled account features. The application loads no optional analytics. Alerts, marketing integration and cross-application measurement require separate privacy and consent review.

## Environments

Local, preview and production environments must remain distinct. Environment-variable names and purposes will be documented in `.env.example` when the first external service is approved. Real values are never committed.
