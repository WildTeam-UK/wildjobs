# WildJobs

WildJobs is WildTeam's independent conservation careers platform, intended for `jobs.wildteam.org.uk`.

The application uses its own Supabase database and Vercel deployment. The automated pipeline creates original WildTeam role briefs from permitted source evidence, with deterministic checks, a compact AI pass, independent quality sampling, recoverable tasks and atomic publication. EnvironmentJob is the only source in the current rollout. Employer profiles, course recommendations and search indexing are independent decisions.

Read `docs/LISTING_PIPELINE.md` for the current operating contract and rollout procedure. Earlier product documents remain background where they conflict.

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

Production workers require the server-only `SUPABASE_SECRET_KEY`, `AUTOMATION_SECRET` and `OPENAI_API_KEY`. The automation secret is also stored in Supabase Vault. Never expose these values through public environment variables.

The protected heartbeat schedules due imports and runs one leased stage per request. Imports are incremental and normally due every two hours; active vacancy pages are rechecked every twelve hours. Each normal vacancy receives one compact AI generation. Escalation and independent review run as separate stages, each within its own request deadline. Unknown facts stay unknown. AI usage is reserved atomically before a call, including course taxonomy generation; uncertain provider failures retain their reservation.

`AI_ENRICHMENT_ENABLED` and `AUTO_PUBLISH_ENABLED` are independent server switches. Live publication additionally requires the database control and explicit source permissions. `PIPELINE_REVIEW_ALL=true` checks every generated brief independently during the initial production rollout. One-in-twenty sampling is available after a labelled quality evaluation. Existing imported adverts remain in staff/history storage, while discovery uses verified briefs. Source content is not copied into public descriptions.

Run `pnpm db:test` against a disposable local Supabase stack for the security and rollback-only feed-to-publication tests. The same SQL suites can be run transactionally through the authenticated database tooling. A passing unit suite alone does not establish a working production pipeline.

Search indexing requires `SITE_INDEXING_ENABLED=true` on production plus an approved primary domain. Individual legacy or unverified job pages remain noindex. `JobPosting` markup is independently gated; editorial briefs are not automatically represented as complete employer postings.

The LearnWorlds integration reads public course metadata only. It does not link accounts or access learner records. Course taxonomy generation shares the AI budget and never blocks a vacancy stage.

Run the complete local checks with:

```sh
pnpm check
```

## Current boundaries

- EnvironmentJob is the only automated source in this rollout. Its collection, AI-processing and publication permissions are recorded independently in the staff pipeline workspace. Full advert reproduction and logo reuse are off.
- Other sources retain their existing configuration but do not enter the replacement automation without explicit permission and connector verification.
- Publishing a job does not publish or mark its employer profile as human-reviewed.
- Staff edits are preserved, recorded and excluded from automatic rewriting. Staff can resolve exceptions through the existing review workspace.
- WildJobs remains independent of WildNews. LearnWorlds and Brevo retain their existing ownership boundaries.
- Private shared UI packages are pinned; no sibling filesystem dependency is required in CI or deployment.
