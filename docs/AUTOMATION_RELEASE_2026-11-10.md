# Skills, benefits and guide automation — 10 November 2026

The user approved this batch and production release. Source expansion remains paused. Pagination remains at 25 jobs per page.

## Released UI batch

WildJobs [PR 68](https://github.com/WildTeam-UK/wildjobs/pull/68) released job-title cleanup, immediate basic employer pages, pink employer links without underlines, filter scroll reset, stable relative-time hydration, a staff quality view and the requested homepage/navigation changes. Production commit: `b0551bc90f80c3c260cc35a50a1d755a10fbe0df`.

WildNews [PR 65](https://github.com/WildTeam-UK/wildnews/pull/65) placed Training before Jobs, News and About. Production commit: `ef7e7a17e8f65c30b19c91109d29d8b4515b4e18`. Both Vercel deployments reached READY. Six missing employer logos were repaired in the previous quality batch; one current job still lacked a verified logo at that check.

## Canonical job attributes

The existing enrichment request now selects up to six skills and five benefits from a fixed catalogue: **26 skill labels and 15 benefit labels**. Similar wording maps to one stable slug, for example QGIS/ArcGIS to GIS, or flexitime/flexible hours to Flexible working. It cannot create new labels or sentences.

Each choice needs a short supporting excerpt from the supplied advert. Validation rejects unknown slugs, fabricated or mismatched excerpts, duplicates and negative statements, including cropped quotes that hide a nearby exclusion. Evidence remains in the private per-source payload. Only bounded canonical slug arrays and an extraction version are added to public jobs. Existing RLS and service-role write boundaries remain.

Attributes follow the canonical source and feed hash. Unchanged reimports preserve them; changed adverts and source switches clear stale values. The same leased worker automatically backfills current jobs, twenty per batch, without creating a new scheduler, service or separate attribute AI call. Jobs remain live during backfill. The existing finish RPC keeps the heartbeat due until the attribute backlog is cleared.

Labels appear in the selected job detail, are searchable, and participate in query relevance ranking. Employer pages aggregate benefits from current job adverts with an explicit role-specific qualification. They do not turn one role's benefits into unconditional promises about the employer. Stable slugs support future dedicated filters without introducing those controls in this batch.

## Automatic guide publication

The existing heartbeat now publishes eligible guides from the supported catalogue automatically. The minimum is **ten distinct detailed matching canonical adverts from at least two employers**, with current source evidence and a valid researched guide definition. It applies to career and sector guides. The same atomic publication RPC preserves prior versions and rejects repeated publication.

Generated pending drafts get current evidence automatically. Separately edited content is preserved, and overdue research sources defer publication rather than receiving a fabricated new check date. Published prose is not rewritten for every vacancy; live market figures already update independently. Newly changed definitions and qualifying generated drafts can publish without a staff approval action.

This release covers the existing catalogue and six supported occupation families. It does not create arbitrary new occupation definitions or automatically research new guide topics. Deferrals are reported by the worker and visible through the guide evidence dates; extending unattended research beyond the current source-validity period is still separate work.

## Recommendations

Sectors, skills, benefits and occupation families are consistent recommendation signals. Saved jobs retain their existing IDs, so their current attributes can be used later without duplicating job data. The current Recommended sort remains query relevance with recency tie-breaks; this batch does not claim to have implemented personalised recommendations or change browser-only saving into account profiling.

## Validation and rollout

Local coverage includes source-hash changes, unchanged imports, invalid labels, private evidence access, attribute backfill, automatic threshold publication, preserved edited content, stale research, duplicate publication and grounded attribute extraction. Full formatting, TypeScript, lint, test and production-build checks are required before the production schema/application rollout. Production observation results follow below after release.

GitHub Desktop summary: **Automate job skills, benefits and guide publication**

Description: Extract grounded canonical labels in the existing enrichment pass, automatically backfill current jobs, display role-specific benefits and publish qualifying guides without a staff approval step.
