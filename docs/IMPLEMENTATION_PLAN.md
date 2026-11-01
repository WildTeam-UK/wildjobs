# Approved feed directory replacement

Approved by the user on 1 November 2026: rebuild around EnvironmentJob, retain the jobs page and card design, recreate admin, remove the old pipeline, individual job pages, automations and job data, and publish automatically.

The implementation is a single RSS importer, one read of each new/changed linked advert, and one AI enrichment call per batch. It uses the existing Next.js application, Supabase project, Vercel project and OpenAI integration. No new service is introduced.

Data: `directory_jobs`, `directory_organisations`, `directory_settings`, `directory_runs`, `directory_saved_jobs`. Retained: candidate accounts/preferences, staff, courses and the small active sector catalogue (`career_areas`). Earlier migrations remain for reproducible schema history. The retirement migration removes the replaced tables, functions and scheduler.

Jobs are public while present in the latest successful feed and before their deadline: the source closing date, or 30 days after the original posting time. Retirement uses the request time, so no extra scheduler is needed. Saved history remains accessible. No employer research, evidence extraction, capability taxonomy, independent AI review, escalation, job brief, publishing decision or moderation queue remains. AI writes 50–100-word summaries, sectors and direct course matches from the supplied advert information, with RSS as a fallback. The linked advert also supplies employer logos and available structured job facts. This extension was approved by the user after the directory rollout.

Verification covers feed formatting, card links and appearance, auth/save flows, database access, unchanged-feed preservation, automatic expiry and recorded usage. Cutover stops the old scheduler, deploys the replacement, starts fresh feed data, retires the old schema and enables the single new scheduler.

Jobs retire at the source closing date (RSS or linked advert), falling back to 30 days after the original posted timestamp. Re-importing the same posting never restarts the 30-day clock. Closing soon sorts by that effective deadline. Sector follows courses in the filter row; Wildlife Conservation replaces Conservation & Wildlife. Filters keep counts and use strict matching, without an unspecified-data option.
