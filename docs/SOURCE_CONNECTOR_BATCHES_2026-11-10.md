# Paused source recovery — 10 November 2026

This batch implements and tests readers/configuration fixes for 16 previously paused sources. Ten pass the technical and linked-notice review for activation; six remain paused for publisher reuse clarification. The original 16 enabled sources remain unchanged. Team access changes are still deferred. No schema, service or dependency is added.

## Verified readers

| Source                              | Technical result                                                                                                                                                                                             | Release decision                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| National Trust for Scotland         | All six regional pages; ten listings, nine within expiry. Follow the published ten-second crawl delay. Inline role facts and application instructions are retained; linked document content is not invented. | Reuse hold                             |
| The Nature Conservancy              | Its own adverts identify the authoritative Workday board. It returns a complete 76-listing snapshot; the Phenom pages repeated seven entries while reporting more unique jobs than they exposed.             | Reuse hold                             |
| WWF UK                              | Complete iTrent list, one vacancy. Strip anonymous session parameters from application links.                                                                                                                | Reuse hold                             |
| Marine Conservation Society         | Correct Webrecruit destination; one vacancy, with British dates and publisher-quoted metadata corrected.                                                                                                     | Reuse hold                             |
| Plantlife                           | Complete LiveVacancies public website list; two adverts.                                                                                                                                                     | Reuse hold                             |
| Butterfly Conservation              | Complete LiveVacancies public website list; one advert.                                                                                                                                                      | Linked legal page unavailable; hold    |
| Born Free                           | Full current HTML vacancy and application instructions; one role. The actual application deadline is distinguished from the later interview date.                                                            | Activation candidate                   |
| Earthjustice                        | Official Jobvite board; ten listings, five within the existing expiry rules.                                                                                                                                 | Activation candidate                   |
| ClientEarth                         | Pinpoint's documented `postings.json` feed on the employer's original careers host; six postings, including multiple locations. Respect hidden compensation and explicit advertised currencies.              | Activation candidate                   |
| Oceana Europe                       | Scoped careers widget declares zero result pages.                                                                                                                                                            | Activation candidate, empty            |
| Oceana UK                           | Scoped careers widget declares zero result pages.                                                                                                                                                            | Activation candidate, empty            |
| Office for Environmental Protection | One retained October advert, already expired. Its precise 23:55 UK closing time is preserved, including daylight-saving conversion for future adverts.                                                       | Activation candidate, no current roles |
| Australian Wildlife Conservancy     | Correct ELMO list and advert scope; three current roles. Exclude the general expressions-of-interest pool.                                                                                                   | Activation candidate                   |
| Taronga Conservation Society        | Official SuccessFactors available-roles page; eleven vacancies.                                                                                                                                              | Activation candidate                   |
| Landcare Australia                  | Full published inline role and email application instructions; one vacancy.                                                                                                                                  | Activation candidate                   |
| Department of Conservation NZ       | Official Workday destination, with complete pagination; 28 current listings in the final check. Publisher provides [CC BY 4.0 reuse terms](https://www.doc.govt.nz/footer-links/copyright/).                 | Activation candidate                   |

These counts are dated observations, before cross-source deduplication. Exact check timestamps, resolved URLs and bounded samples are in [the technical evidence](source-connector-audit-2026-11-10.json). Earlier failed runs are superseded by later successful checks.

## Reuse holds

- **National Trust for Scotland:** [website terms, section 10.4](https://www.nts.org.uk/terms-conditions/website-terms-of-use) restrict extraction/republication without written permission.
- **The Nature Conservancy:** [terms of use](https://www.nature.org/en-us/about-us/who-we-are/accountability/terms-of-use/) limit reuse to a personal copy and restrict distribution, derivative works and mirroring.
- **WWF UK:** [terms, sections 8.2–8.3](https://www.wwf.org.uk/terms-and-conditions) require written permission for publication and derivative use beyond the stated personal-use allowances.
- **Marine Conservation Society:** [terms](https://www.mcsuk.org/terms-and-conditions/) restrict reproduction and copying. Clarify recruitment-feed permission before activation.
- **Plantlife:** [website terms](https://www.plantlife.org.uk/plantlife-website-terms-and-conditions/) restrict republication, including on other websites, and require written permission for other uses.
- **Butterfly Conservation:** the recruitment site links to [its legal page](https://butterfly-conservation.org/legal), which returned an access error during review. Technical extraction is ready; do not treat an unread legal page as an approval.

These six are technically ready once source-specific reuse is resolved. No requests for permission were sent to employers.

## Further investigation

- Rainforest Alliance and National Wildlife Federation lead to UKG. Its actual search-data paths are excluded by the declared crawl policy. Seek an agreed feed; do not bypass the exclusion.
- Re:wild's Dover public careers-data endpoint is likewise excluded by its crawl policy.
- The Wilderness Society US uses HiBob; the published client script returned HTTP 403. American Bird Conservancy's Paylocity client returned HTTP 406. Bush Heritage's linked ApplyNow advert also returned HTTP 406. These failures remain paused.
- WWF India's old careers hostname does not resolve. The replacement careers page was confirmed on its official website, but it returned HTTP 403 to this reader.
- BTO's legacy PostingPanda endpoint returns an empty array without a verifiable employer-scoped result contract. Its current authoritative board still needs confirmation; no empty snapshot is activated on that assumption.
- Ocean Conservancy now links to ADP. Its recruitment redirect needs an explicitly verified destination before a dedicated reader can be implemented.
- Zoos Victoria uses the hosted PeopleStreme application; WCS uses BrassRing. Both still need complete provider readers. No bundled credentials or private application endpoints were used.
- BirdLife Australia's current-opportunities widget is empty without a verified empty-state contract. NTNC management notices contain grants, procurement and news rather than a current vacancy list. The Cayman and STENAPA homepages do not establish durable complete job lists.
- TNC India's proposed careers URL remains a 404 and its homepage does not establish a replacement. Do not substitute TNC's entire global list for an India-specific source.
- Snow Leopard Trust's IT PDF explicitly closed on 28 August 2026. The second document is an organisational procurement request, not a verified current staff vacancy. Rewilding Europe's PDF and Caribbean Biodiversity Fund's mixed document list still require confirmed current application details; no deadlines were guessed.
- The other pre-existing access/reuse holds remain as recorded in the [first rollout](SOURCE_ROLLOUT_2026-11-10.md).

## Import safety and validation

The readers retain complete-snapshot, revision and cross-source duplicate protections. LiveVacancies accepts only public, active, website-published adverts from the matching employer identifier and copies an explicit allowlist of public job fields. Workflow, recruiter and campaign fields are not retained. Numeric application hash routes are preserved only for the documented LiveVacancies job route; network URL validation still removes fragments.

Long crawl-delayed source reads can defer summaries to the existing next heartbeat rather than overrun the function lease. No additional scheduler or AI pass is introduced. Open “applications are being accepted” wording is distinguished from “no longer being accepted”. Widget pagination, regional failures, hidden pay, British dates, application/interview dates and UK daylight-saving deadlines have regression coverage.

The production release uses the existing source RPCs: save updated configurations paused, record current technical previews, record reuse holds as visible failures, then enable cleared sources in batches of at most three. Observe successful imports and an empty processing queue before reporting the final outcome. No production deployment or activation is implied by the preparatory counts above.

## Durrell crawler-policy decision

Durrell's public Occupop client publishes a read-only GraphQL job-list query. Its API's `/robots.txt` returns HTTP 400 with the JSON error `BAD_REQUEST`, explaining that a non-empty GraphQL query is required. The existing crawler treats that response as unavailable policy and stops.

Automatic approval review rejected a proposed **global** change allowing HTTP 400 robots responses because it could weaken crawl safeguards. That change was not applied. The crawler's existing 400/401/403/429 and explicit-exclusion behaviour remains intact.

A possible follow-up, requiring explicit approval, is a narrowly scoped exception for `gateway.server.occupop.com` only when `/robots.txt` returns that exact missing-query JSON error. Unknown errors, authentication failures, rate limits and actual disallow rules would continue to stop the reader. It would permit testing the public Durrell job-list query, not automatically approve content reuse or activation. No exception is included in this release.
