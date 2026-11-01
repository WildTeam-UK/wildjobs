# WildJobs

WildTeam's conservation jobs directory. Sources are managed in `/admin/sources`; EnvironmentJob is the initial source. The existing jobs page and card styling are retained, with longer summaries and aligned metadata; each card opens the original advert. There are no individual WildJobs job pages.

## Development

Use Node 22.13+ and pnpm 11.25. Install with `pnpm install --frozen-lockfile`, copy `.env.example` to `.env.local`, then run `pnpm dev`. Private WildTeam packages require the approved GitHub Packages credentials. Never commit real environment values.

Run `pnpm check` for formatting, types, lint, unit tests and a production build. `pnpm db:test` runs the rollback-only database tests against a disposable Supabase stack. Migration files are immutable history; the final migrations replace the earlier schema.

## Feed to card

1. Supabase Cron checks once per minute. It invokes `/api/automation/feed` only when an hourly feed refresh or AI enrichment is due. The existing automation secret stays in Vault and Vercel.
2. Admins add a public RSS or Atom feed URL, optionally naming it. The importer checks up to three due feeds per run; feeds refresh hourly. Each successful snapshot changes only that source’s listings. Fetch/parse failures preserve its previous snapshot and retry after 15 minutes, while other feeds continue.
3. `directory_source_jobs` stores one occurrence per source/GUID beneath stable `directory_jobs` cards. Duplicate URLs (with tracking removed) or normalised employer/title/city/country identities share a card. Different locations and ambiguous missing identities stay separate. Matching excludes distinct same-source listings from identity-only merging; nearby posting dates avoid joining old reposts. Full advert metadata and the existing AI pass can identify and merge an initially unstructured duplicate. Saved jobs follow the canonical ID. Source order gives a deterministic preferred advert; another source takes over if it disappears. Removing a source is recoverable by adding the same URL again.
4. For each new/changed canonical job, the importer reads only its linked advert. JobPosting metadata supplies the full description, employer logo and available employment facts; otherwise page body text and RSS remain usable. One gpt-6-luna structured request handles up to 20 canonical jobs: a 50–100-word summary, sectors, direct course matches, and missing employer/location/pay facts from unstructured sources. Logo selection is restricted to images actually supplied by that advert, with catalogue reuse. Unchanged duplicate snapshots and merged cards with a valid cached result do not spend AI tokens again.
5. `/admin` shows canonical live/pending counts, activity, tokens and estimated USD. Sources supports add, rename, pause/resume, refresh and recoverable removal, restricted to administrators. Pausing stops imports while existing listings remain until expiry; removing a source withdraws its occurrences while alternatives stay live. Other tabs list cards, course matching settings and organisation logos. There is no review queue.

EnvironmentJob RSS supplies short descriptions and no logos; other feeds may contain structured fields. Linked adverts supply full descriptions and employer logos where available without an extra AI call. If an advert cannot be fetched, its RSS text remains usable. Salary uses `per year` for annual pay, retaining pro rata/benefits. Hourly/daily pay and fixed project totals keep their actual basis; annual equivalents are not invented. Workplace defaults to on-site unless remote/hybrid is stated. Contract defaults to permanent unless fixed term is stated; hours default to full time unless part time is stated. Explicit full-time/part-time alternatives are retained.

Candidate accounts and preferences remain private. Saved jobs use the new directory IDs; old saved job links are removed with the old job data. LearnWorlds and Brevo are not modified. Courses remain a local catalogue with editable matching notes, without capability mappings or automated training-system synchronisation.

`OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` and `AUTOMATION_SECRET` are server-only. Public Supabase access uses RLS. `SITE_INDEXING_ENABLED` remains the launch indexing switch. The sitemap contains directory pages, never individual job URLs.

Filter menus render outside the horizontal scroller. Counts reflect other active filters; courses sort by count descending. Missing workplace, hours and contract data uses the agreed defaults. Salary filters remain strict.

Jobs retire at the source closing date (RSS or linked advert), falling back to 30 days after the original posted timestamp. Re-importing the same posting never restarts the 30-day clock. Closing soon sorts by that effective deadline. Sector follows courses in the filter row; Wildlife Conservation replaces Conservation & Wildlife. Filters keep counts and use strict matching, without an unspecified-data option.

Feed and advert HTTP requests allow only public HTTP(S) destinations, pin validated DNS addresses, recheck redirects and bound response sizes/time. Credentials and private network destinations are rejected. A feed must be an RSS/Atom **job** feed with advert links; arbitrary websites, private/authenticated feeds and unrelated news feeds are not source formats. Employer information absent from both feed and advert is not invented. There is no separate AI deduplication/research step.
