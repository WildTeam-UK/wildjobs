# Conservation source rollout — 10 November 2026

The source importer and administrator controls are live at https://jobs.wildteam.org.uk/. [PR #64](https://github.com/WildTeam-UK/wildjobs/pull/64) released commit `61b6f42595269403ed4448f33082581ae96c6cea`, built from the independently tested source tree. The isolated release preserved the application's newer navigation and employer work and left the original working directory's other changes untouched.

The additive migration is recorded in production as `20261110095239_career_page_sources`. The repository filename was reconciled to that generated version after application; do not apply it to production again. All 517 existing job records were retained. Existing source URLs, enabled states and the scheduler were preserved.

All 71 proposed sources were registered paused, with their configurations, dated technical checks and next-step notes. Source management remains administrator-only; team access changes remain deferred.

## Activated batches

Sources were enabled in groups of at most three, following successful complete previews and a review of the declared crawl policy and linked recruitment-page notices. A public page is not an unconditional redistribution licence: review the notes again if the publisher's conditions change. Imports retain links to original applications and employer attribution.

| Batch | Sources                                             |
| ----- | --------------------------------------------------- |
| 1     | BirdLife International; IUCN; Sierra Club           |
| 2     | Fauna & Flora; African Parks; Trust for Public Land |
| 3     | NRDC; Blue Ventures; Wetlands International Europe  |
| 4     | ATREE; WWF US; Blue Marine Foundation               |
| 5     | Wilderness Society Australia; Forest & Bird; ICIMOD |
| 6     | Wetlands International South Asia                   |

At 10:06 UTC, all **16 sources** had completed their first scheduled import: ten populated sources and six verified empty sources. They supplied **93 listing occurrences**, including **74 additional current public cards**, taking the public feed to **431 current jobs**. All **517 original records** remain, with **610 total records** including expired and merged history. The importer reused the existing cross-source duplicate handling. Linked-source counts below can include a card already supplied elsewhere.

All six scheduled rollout runs (916–921) completed without errors. The summary queue was empty, every enabled new source had a successful import timestamp, and no enabled new source had an error. Each new source is scheduled for another check after 12 hours. **55 of the 71 sources remain paused**: the 49 technical/access cases plus the six reuse-review cases below.

| Source                            | Listings imported | Current linked jobs |
| --------------------------------- | ----------------: | ------------------: |
| African Parks                     |                23 |                   9 |
| ATREE                             |                 7 |                   7 |
| BirdLife International            |                 4 |                   4 |
| Blue Marine Foundation            |                 0 |                   0 |
| Blue Ventures                     |                 3 |                   3 |
| Fauna & Flora                     |                 3 |                   3 |
| Forest & Bird                     |                 0 |                   0 |
| ICIMOD                            |                 0 |                   0 |
| IUCN                              |                 8 |                   8 |
| NRDC                              |                30 |                  30 |
| Sierra Club                       |                 6 |                   3 |
| Trust for Public Land             |                 8 |                   8 |
| Wetlands International Europe     |                 1 |                   1 |
| Wetlands International South Asia |                 0 |                   0 |
| Wilderness Society Australia      |                 0 |                   0 |
| WWF US                            |                 0 |                   0 |

## Sources still paused

The original [71-source audit](SOURCE_IMPORT_BATCHES.md) records the 49 sources requiring corrected access, complete pagination, additional connectors or manual document handling. The [10 November recheck](source-audit-2026-11-10.json) refreshed all 22 previously readable sources: 14 populated and eight verified empty, with 166 source listings and 147 within the preview expiry rules before enrichment or deduplication. These are observations, not a public job count.

Six additional technically readable sources remain paused after the reuse review:

| Source                             | Reason and route forward                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| World Resources Institute          | [General terms](https://www.wri.org/about/legal/general-terms-use) prohibit scraping and external republication without a separate licence. Obtain an agreed feed or permission.                        |
| Audubon                            | [Terms of use](https://www.audubon.org/terms-use) limit copying to personal non-commercial use and require prior consent for other redistribution. Obtain permission for the recruitment feed.          |
| Buglife                            | [Linked terms](https://www.buglife.org.uk/about-us/terms-conditions/) contain broad reproduction restrictions within shop terms. Clarify whether recruitment adverts are excluded or obtain permission. |
| Rainforest Trust UK                | [Terms of service](https://www.rainforesttrust.org/terms-of-service/) expressly restrict republication, redistribution and screenscraping. Obtain a permitted feed or permission.                       |
| Australian Conservation Foundation | [Website terms](https://www.acf.org.au/terms-and-conditions) require consent for copying/storing material on another server. Obtain an approved feed or permission.                                     |
| Panthera                           | The linked [Rippling terms page](https://app.rippling.com/legal/user) failed to load. Technical extraction passed; reuse review remains unresolved.                                                     |

No access challenge, crawl exclusion or explicit publisher restriction was bypassed. No permission requests were sent to organisations.

## Verification

- Local format, TypeScript, lint, 373 tests and production build passed. Both opt-in audit tests remain excluded from normal runs.
- GitHub CI passed, including disposable-database schema lint and publication-flow tests.
- The migration reference reconciliation passed all five embedded source-database tests.
- The production deployment was verified READY on the intended WildJobs project and custom domain.
- Public HTTPS browsing returned 200 and rendered original application links from activated populated sources. Anonymous access to `/admin/sources` redirected to sign-in. Administrator mutation authorization is covered by tests.
- Interactive browser inspection was unavailable because local browser use is disabled in Work settings; no signed-in visual admin check is claimed.
- New source activity and checks remain private under service-role access and RLS. The existing unrelated Auth advisor warning was unchanged.

## Operating the catalogue

Use **Admin → Sources** to add or edit a public careers URL, recruitment board, feed or individual advert. Save and check it, inspect the preview, record access/reuse conditions in notes, then enable imports after review. Unsupported sources remain saved with a reason and can be configured or replaced later. Editing configuration pauses the source and invalidates its previous approval/check. Empty results after a populated import require a second spaced observation before withdrawing jobs.

An enabled source with no current openings is working and remains monitored. Paused sources do not publish or import automatically. The existing Green Jobs feed had an HTTP 403 before this release; its enabled state was preserved and its issue is independent of these new sources.
