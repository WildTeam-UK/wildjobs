# WildJobs

WildTeam's conservation jobs directory. EnvironmentJob is the only feed. The existing jobs page and card styling are retained, with longer summaries and aligned metadata; each card opens the original advert. There are no individual WildJobs job pages.

## Development

Use Node 22.13+ and pnpm 11.25. Install with `pnpm install --frozen-lockfile`, copy `.env.example` to `.env.local`, then run `pnpm dev`. Private WildTeam packages require the approved GitHub Packages credentials. Never commit real environment values.

Run `pnpm check` for formatting, types, lint, unit tests and a production build. `pnpm db:test` runs the rollback-only database tests against a disposable Supabase stack. Migration files are immutable history; the final migrations replace the earlier schema.

## Feed to card

1. Supabase Cron checks once per minute. It invokes `/api/automation/feed` only when an hourly feed refresh or AI enrichment is due. The existing automation secret stays in Vault and Vercel.
2. The importer reads `https://environmentjob.co.uk/jobs.rss`. It separates organisation, location, salary and excerpt. It publishes every imported card immediately. Items absent from the next successful feed snapshot leave the live directory. A failed fetch preserves existing jobs.
3. For each new/changed job, the importer reads only its linked EnvironmentJob advert. JobPosting metadata provides the full description, employer logo and available employment facts. Logos are reused from the organisation catalogue. One gpt-6-luna structured-output request processes up to 20 new/changed jobs. It writes only a 70–120-word summary, sectors and direct course matches. Unchanged feed content does not spend AI tokens again. While AI is unavailable, the source excerpt remains visible and enrichment retries automatically.
4. `/admin` shows activity, automation controls, tokens and estimated USD. Separate tabs list cards, local course matching settings and organisation logos. There is no review or approval queue.

The RSS supplies short descriptions and no logos. Linked adverts supply the full description and structured employer logos without an extra AI call. If an advert cannot be fetched, its RSS text remains usable. Salary uses `per year` for annual pay, retaining pro rata/benefits. Hourly/daily pay and fixed project totals keep their actual basis; annual equivalents are not invented. Workplace is explicit remote/hybrid/on-site or not specified.

Candidate accounts and preferences remain private. Saved jobs use the new directory IDs; old saved job links are removed with the old job data. LearnWorlds and Brevo are not modified. Courses remain a local catalogue with editable matching notes, without capability mappings or automated training-system synchronisation.

`OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` and `AUTOMATION_SECRET` are server-only. Public Supabase access uses RLS. `SITE_INDEXING_ENABLED` remains the launch indexing switch. The sitemap contains directory pages, never individual job URLs.

Filter menus render outside the horizontal scroller. Counts reflect other active filters; courses sort by count descending. Missing workplace, hours, contract or annual-salary data can be included explicitly, with confirmed matches ranked first. Unknown data is never presented as a confirmed match.
