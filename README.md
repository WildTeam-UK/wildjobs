# WildJobs

WildJobs is WildTeam's independent conservation careers platform, intended for `jobs.wildteam.org.uk`.

The application is connected to its independent Supabase project. Public job discovery, employer profiles and career-area discovery read approved live records; candidate authentication, private saved jobs and explicit job preferences are connected; and authorised staff can curate, review, publish, expire and withdraw jobs with an audit trail. Source connectors check WWT's public vacancy page and the reviewed Countryside Jobs Service RSS feed, automatically every two hours or on demand. Between imports, a bounded enrichment pipeline extracts evidence, builds canonical employer context and records an automatic-publication decision. AI enrichment and live automatic publication have independent master switches and both default off; publication checks run in shadow mode until explicitly enabled. The controlled employer journey creates seven-day, single-use invitation links, validates and consumes them through a protected server route, and sends complete submissions into the staff-only review queue. Course matching still contains clearly labelled prototype content. Analytics and marketing integrations are not implemented yet.

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

AI enrichment uses the official OpenAI SDK and Responses API only for unresolved fields, authenticated by
the server-only `OPENAI_API_KEY` in the same pattern as WildNews. Daily request and token limits are enforced
in the application. When a new employer has no known website, the same bounded response may use low-context
OpenAI web search once. A result is accepted only when its official HTTPS page appears in the returned sources,
passes safe-fetch checks and contains the quoted evidence. Known official sites are checked using the homepage and,
when available, one same-site mission or About page. An incomplete newly discovered profile can receive another
bounded pass within the existing three-attempt ceiling. `AUTO_PUBLISH_ENABLED` remains false until shadow
decisions have been reviewed; even in live mode, a service-only atomic database function publishes only records
that pass essential source, duplicate, identity, destination and lifetime checks. Optional classification and
employer-profile enrichment continue without delaying a usable listing. AI-generated job and employer summaries
are stored separately from source and official copy and are labelled in the public experience. When a source has
no closing date, the listing remains eligible for 30 days from first discovery and visibly reports its age.

Run the complete local checks with:

```sh
pnpm check
```

## Current boundaries

- Published jobs and their source provenance live in Supabase; fixture jobs in `lib/jobs.ts` remain design references only.
- Source discovery is restricted to explicitly reviewed endpoints. WWT HTML and Countryside Jobs Service RSS are checked every two hours by the protected automation heartbeat and can also be checked manually by an administrator. Enrichment and publication readiness are automated, while live publication remains feature-flagged and evidence-gated.
- Employer invitations, protected employer submission and staff submission review are connected to production data. Career-area pages use reviewed production taxonomy and live vacancy relationships; course experiences are not yet connected to an approved LearnWorlds catalogue.
- The site is marked `noindex` until approved data and a production domain are connected.
- Shared design tokens are pinned to the private `@wildteam-uk/tokens` package released through GitHub Packages. Local development requires a personal package login; CI uses its repository-scoped `GITHUB_TOKEN`.
- Read `docs/IMPLEMENTATION_PLAN.md`, `docs/EXPERIENCE_BLUEPRINT.md`, `docs/PRODUCT_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_OWNERSHIP.md` before implementation.
