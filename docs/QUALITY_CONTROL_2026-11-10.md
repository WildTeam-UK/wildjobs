# Job quality and browsing fixes — 10 November 2026

Source expansion is paused. Existing enabled imports continue, with missing branding kept separate from publication. This batch extends existing application code and employer records; it adds no schema, service, dependency, AI pass or approval queue.

## Findings and changes

At the initial production check there were 490 current jobs, eight without stored logos and 150 current employers without a published researched profile. Seventeen guides were published; twelve revisions were drafts.

- **Employer logos:** the importer already attempts discovery, but unchanged jobs do not repeat enrichment. Scheduled employer research now retries branding after verifying the official website, including on website discovery. Failed branding never fails the job or profile, and guarded updates preserve existing administrator choices. The logo picker now rejects generic brand-assets photographs and partner-logo markers. This caught a Drax photograph and selected its actual logo instead.
- **Logo repair:** six independently checked official-site logos were added to missing production organisation records: American Prairie Foundation, Cornell University, Downeast Salmon Federation, Drax Group, Nashua River Watershed Association and North Carolina Zoo. This reduced the missing-logo count from eight jobs to one. Bending Branch Restoration LLC remains unresolved; its job continues with initials. Finding an image does not guarantee permanent availability, so client-side image-error fallbacks remain.
- **Employer pages:** importing a named organisation now makes a basic employer page available from that existing record, its current jobs and observed hiring history. Every named employer card links to it immediately. Research adds supported, sourced content independently. Published-profile URLs retain priority; old basic URLs redirect to the researched URL when available. Basic pages are excluded from indexing and the sitemap until researched; they do not invent organisational claims.
- **Links and navigation:** employer links in full, preview and compact cards use brand pink. The WildJobs navigation wordmark links to its homepage. Both WildJobs and WildNews place Training before Jobs, News and About, using their existing menus.
- **Filter position:** filter/search/sort changes reset to the first result page and return the document to the top after rendering, preserving the focused control. Browser verification applied the New Zealand filter from a scroll position of 3,342 pixels and observed 28 matching jobs with scroll position zero.
- **Hydration:** public jobs carry one server render timestamp for relative posting ages and new/closing notices. Server and browser use that same value, preventing a minute-boundary text disagreement during hydration. The initial browser check exposed a React hydration warning before this fix.
- **Titles:** presentation removes clear recruitment boilerplate, `Role:`/`Job title:` labels and terminal sentence punctuation. The Wetlands example becomes “Nature-based solutions officer”. Source titles, URLs and original advert evidence are retained. This is deterministic cleanup, not an AI rewrite or a new occupation classifier.
- **Homepage punctuation:** removed the terminal full stop from the hero description and the course title/compact course description used in the homepage promotion. Body summaries retain normal sentence punctuation.
- **Recommended order:** previously this preserved feed order, effectively newest first. It now ranks an exact title match highest, then a title phrase, then individual title words, employer words and summary words, with recency and a stable slug tie-break. With no search phrase it uses newest first. This is search relevance, not personal recommendations.
- **Quality view:** `/admin/quality` shows missing logos, automatic title cleanup, queued summaries and basic employer pages. It uses current records and existing staff authentication. It is visibility into automated work, not a publishing gate.

## Skills, role families and guides

Structured job skills are **not currently extracted or stored**. The existing single AI pass produces summaries, sectors and relevant course matches; keyword search can find skills mentioned in summaries. A future skills extension should extract only skills supported by the advert, map them to a controlled vocabulary, retain provenance and share the existing enrichment call. It needs an agreed vocabulary and storage contract rather than silently treating course recommendations as extracted skills.

Jobs are automatically mapped to six supported occupation families: Ecologist, Project Manager, Project Officer, Environmental Educator, Biologist and Chief Executive. Those mappings drive guide membership and role filters. Ambiguous and unsupported occupations remain unmatched rather than being forced into a family. The title cleanup does not change this mapping policy or reclassify roles such as nature-based solutions officer without evidence.

Published guides compute vacancy counts, employer counts and qualifying salary observations from the current rolling job data. Written guide content is a published, versioned snapshot and does not silently rewrite itself. The importer can queue evidence-backed drafts from the existing editorial catalogue; career drafts require ten detailed matching adverts from at least two employers. Changed content/mappings or a 90-day review date can trigger a new draft. These are not arbitrary new guide topics or unattended editorial research. This batch does not change guide-publication policy.

## Pagination recommendation

Retain 25 jobs per page for this batch. There is no established SEO advantage to a different item count or endless scrolling. A deliberate “Load more” control is a possible later improvement, provided page URLs, back-navigation position, keyboard access and access to the footer remain intact.

The current controls are buttons that update the URL. For crawlable pagination, implement actual links to each results page and the appropriate canonical/indexing policy; do not rely on crawlers clicking buttons. Google describes the same requirement for pagination, load-more and infinite-scroll interfaces: [pagination and incremental page loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading). This batch does not change pagination or claim that the current button controls are sufficient for indexing every results page.

## Verification and release status

- WildJobs: formatting, strict TypeScript, lint, 396 tests and production build passed. Two opt-in audit tests remain skipped. Regression tests cover title cleanup, stable employer routes, relevance ordering, incorrect logo candidates, failed branding, protected overrides and identical card markup across a hydration minute boundary.
- Browser: verified the navigation order, homepage link, pink employer links (`rgb(230, 0, 136)`), reported Wetlands title, retained application URL, filter scroll reset and a basic DOC employer page with all 28 current vacancies.
- The final build was reloaded in the browser after the shared-time fix; no new browser console errors were observed.
- WildNews: the single menu-order edit passed formatting, lint, TypeScript and production build. Browser inspection confirmed Training / Jobs / News / About. Local news content could not load because the isolated checkout has no WildNews public data configuration; this does not establish full news-page verification.
- The browser viewport override did not change the reported width, so no phone-size visual verification is claimed. Existing responsive styles and menu structure are retained.
- No signed-in local quality-page check is claimed; local source authentication redirects to sign-in. The page requires existing staff authentication before reading private data.
- Six logo repairs are live data changes. Application/UI changes are tested in isolated worktrees and await release; they are not yet deployed.

GitHub Desktop summary: **Improve job quality and employer links**

Description: Add automatic title cleanup, immediate employer pages, background branding repair and staff quality visibility; fix filter scrolling, employer-link colour, homepage punctuation and navigation; make Recommended use search relevance.

WildNews summary: **Put Training first in navigation**

Description: Reorder the existing menu to Training, Jobs, News, About, retaining its links and responsive behaviour.
