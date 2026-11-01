# WildJobs database

This project is independent of other WildTeam applications. Apply repository migrations in timestamp order. Historical migrations describe earlier versions; the final feed-directory migrations create the replacement and remove the old editorial pipeline and job data.

Run `pnpm db:start`, `pnpm db:reset`, `pnpm db:lint` and `pnpm db:test` against a disposable local database. CI repeats the lint and rollback-only RLS tests.

The active schema is documented in the root README. Server-only credentials perform feed ingestion. Public jobs and organisation logos are readable with RLS; saved jobs belong only to their authenticated candidate. Automation settings and usage runs have no client policies. Candidate profiles/preferences and staff membership are preserved.

Production uses the existing Vault secret `wildjobs_automation_secret`. The new cron calls only `/api/automation/feed` when work is due. Enable/pause it through `/admin`; no per-job publication approval is required.
