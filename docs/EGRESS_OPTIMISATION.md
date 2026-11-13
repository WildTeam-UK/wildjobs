# Public data egress

## Behaviour

`lib/public-data-cache.ts` uses the existing Next.js Data Cache API with a 300-second refresh interval. Keys include the Supabase public URL and deployment identity so a fixture, another database or a new deployment cannot reuse incompatible records. No additional service or dependency is required.

The cache contains only records read with the anonymous public client: job rows, historical guide samples, published guides and employer profiles, organisations, visible courses, career areas and role aliases. Authentication, saved-job state, preferences and staff reads are not shared between visitors. Guide approval and automation explicitly use `getFreshGuideJobs()` to validate current evidence.

Large collections are cached in 200-row pages instead of one growing item. Public job queries select only mapper fields, retaining source text needed for role matching. Both directory jobs and guide opportunity widgets recheck the closing deadline after loading cached rows. Guide market figures are calculated using the current time.

Imports invalidate after both success and partial failure. Source actions, course/logo edits, guide publication, role decisions and employer publication invalidate the same tag with immediate expiry. Idle automation does not invalidate. A cache-invalidation error is logged without retrying committed imports or AI work; scheduled revalidation remains available. Direct SQL changes outside the application rely on time-based revalidation. Next.js can retain stale data during a failed background refresh; expiry checks still remove jobs whose deadlines have passed.

## Runtime CPU

Anonymous job projections now reuse the same tagged, five-minute Data Cache in pages of 200. Keys contain the source rows and all public mapping catalogues; observation timestamps and closing-deadline checks remain outside the persistent cache. Private saved-job rows still use the uncached mapper. Salary parsing reuses two equivalent `Intl.NumberFormat` instances instead of constructing a formatter for each salary bound. A local 12,000-call comparison on 13 November 2026 produced identical salary objects and used 59 ms of CPU versus 302 ms before the change; this is a salary-parser measurement, not a forecast of whole-site savings.

The public employer-logo route keeps its existing stored-brand verification, safe image conversion, cache lifetime and transient-error behaviour. It bypasses session-refresh Proxy work because it never reads or returns account state. Other routes retain their existing session checks.

A blocked-only source fetch or unchanged worker no longer evicts public data. Invalidation is armed before a source import or pending-job enrichment can write, so even a lost response after a committed withdrawal still expires the cache. Guide publication retains its own invalidation. Source failures remain visible to staff and continue on the existing retry schedule.

## Verification

Run the normal checks:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
git diff --check
```

`tests/public-data.test.ts` covers deadline expiry within a cached snapshot, narrow projections, pagination, read failures, canonical ID lists and fresh approval evidence.

For a production-server check of the real Next.js cache:

```sh
node scripts/verify-public-egress.mjs
pnpm build
```

The script builds and starts the application against a synthetic Supabase HTTP server on ports 3111/3112. It checks 20 warm homepage visits and 10 warm guide visits, including live opportunity cards, with zero additional database reads. It also checks rejected unauthorised automation and cache invalidation after a successful and a failed automation run. It never contacts or writes to production. Rebuild normally afterward because Next.js inlines the synthetic public URL into the test build.

On 11 November 2026 all four production-server assertions passed. The 20 warm homepage visits and 10 warm guide visits each added zero database reads. The normal build was restored after the fixture run. These results prove reuse in the exercised paths; they do not predict the percentage reduction in total organisation egress.

## Measuring production impact

The 11 November 2026 investigation found 2.825 GB of WildJobs egress in the displayed 15 October–15 November cycle. This is a cumulative baseline, not a savings prediction. Compare daily PostgREST egress for this project after deployment, using complete days and allowing an hour for Supabase reporting to refresh. Compare request traffic and import activity alongside egress so a quiet day is not mistaken for a cache improvement.

Check repeated visits to the directory and a career guide, then verify an import or staff change appears promptly. Private responses remain uncached at the HTTP layer; `Cache-Control: private` is expected even while their public data reads use the Data Cache. Confirm production cache hits through Vercel observability and lower Supabase query counts, rather than inferring failure from a page-level CDN miss.

The organisation's combined Free allowance is 5 GB per billing cycle, approximately 167 MB/day over 30 days. Keep headroom for imports, backups and development reads. Existing usage cannot be reduced retroactively. These code changes require deployment before the billing graph can show their effect; no plan upgrade is part of this change.
