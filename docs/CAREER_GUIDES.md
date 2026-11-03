# Maintaining the pilot guides

The pilot consists of Wildlife Conservation (`conservation-wildlife` sector data) and the Ecologist occupation. The sector slug differs from its public URL, `/conservation-sector/wildlife-conservation`; do not rename the directory taxonomy.

## Content and templates

`lib/guide-content.ts` owns the researched editorial baseline, citation IDs, checked dates and content versions. `components/guides/guide-page.tsx` and the two `[slug]` routes own rendering. Change the renderer to change all layouts; change one guide's structured content to edit its advice. Bump its version, verify each source, then refresh and review its draft. The sources' `supports` field records the claims they can substantiate. Prose without citations is clearly framed as WildTeam planning advice or describes the implemented data methodology, not an unsupported factual claim.

The initial source review used the National Careers Service, CIEEM, Green Jobs for Nature and The Wildlife Trusts. Do not use job adverts to invent universal qualification requirements, demand trends or guaranteed career outcomes. Do not replace a source's checked date without reading it again.

Private original-advert snapshots are retained per canonical job and feed hash, so a changed advert does not overwrite its earlier evidence. A guide revision also records the job facts used in its sample, rather than relying on the latest mutable card values to explain an old salary figure.

## Staff workflow

1. Open `/admin/guides`. Check role matches and sample sizes. Confirm or exclude uncertain titles after reading their source adverts. Mapping decisions are reused for the exact normalized title, not guessed for unrelated titles.
2. Collect missing original-advert snapshots in batches of ten. This does not run AI or modify public job cards. Snapshot text remains private. The importer automatically retains the originals it reads for subsequent new or changed jobs.
3. Refresh the pilot's evidence draft. A career draft requires ten distinct detailed feed records and two named employers. The sector draft does not require that occupation threshold. The feed automation also queues eligible pilot drafts, without overwriting pending or recently reviewed prose.
4. Inspect the full draft, source links, pay sample, role assignments and retained originals. Editorial changes are made in the versioned source file; rerun source checks and bump the version, then refresh the draft.
5. Confirm review and publish. A changed evidence fingerprint is rejected; refresh and review the new sample rather than approving stale inputs. Publication archives the previous version and exposes only the new reviewed revision.

This first pilot deliberately uses reviewed editorial baseline text. Automatic draft preparation assembles its evidence snapshot; it does not automatically invent new narrative or research the web. Other career families and automatic writing require extending the catalogue and reviewing their evidence rules first.

## Live data

Both guide types show the overall median advertised starting salary in the top snapshot. Career-level samples and medians remain in the career guide's pay section, with the same five-salary minimum applied separately to each band. The headline combines qualifying levels; it is not an entry-level salary prediction.

The pilot education and professional guidance is UK-focused. Vacancy and employer counts include matching jobs across all countries in the directory; salary medians are explicitly UK-only.

Data refreshes on server requests independently of prose. Canonical job IDs count once across feeds; expired vacancies remain in the twelve-month history and are absent from current listings. The collection began in November 2026, so the lookback must not imply complete twelve-month coverage. Current jobs and the history sample can have different sizes.

`lib/guide-market.ts` is the salary and eligibility source of truth. It reports the median **advertised starting salary**, using the lowest stated annual amount, not an estimated salary-range midpoint. It requires paid, UK, annual GBP salaries with explicit full-time evidence in the original feed or retained advert (including its structured employment type), excludes pro rata and mixed-grade adverts, and suppresses medians below five salaries. Career-level groups are separate. Default full-time card values alone are insufficient. Evidence must match the current feed hash. No exchange rates, hourly annualisation, inferred full-time equivalents or market-growth claims are used.

## Deployment and checks

Apply `20261103124240_career_guide_pilots.sql` before using the review actions, then deploy the application. The migration adds three tables, two source-evidence fields and a history index on jobs, and a service-only atomic publication function. It does not change existing job content or permissions. `lib/guide-database.types.ts` extends the existing generated schema types for these additions.

Run `pnpm check` and the SQL tests in `supabase/tests/career_guides_test.sql`. Inspect both guide routes and the filtered jobs destination at desktop and phone widths, and the staff review flow using a staff account. Verify that anonymous and candidate sessions cannot read draft revisions or original text, and cannot call the publication function. Only approved guides belong in the sitemap; pending previews stay noindex.

Guide routes and the guide hub explicitly set their robots metadata, overriding the template layout's default noindex. A reviewed guide can be indexed only when site indexing is enabled in production. The hub becomes eligible when at least one guide is reviewed. Preview deployments and unpublished guides remain noindex.

### SEO audit · 3 November 2026

The shared template now supplies search-focused titles and descriptions, self-referencing canonical URLs, Open Graph article and Twitter large-image metadata, and branded 1200 × 630 sharing images. Images are generated once at build time with local assets and the brand font. There are no added client dependencies. Hero images have explicit dimensions, responsive sizes and high fetch priority. Discovery endpoints use a small publication-index query rather than loading historical advert bodies; guide evidence queries select only the fields they use.

Article and BreadcrumbList JSON-LD match the visible headline, sources, breadcrumbs and WildTeam organizational byline. The guide hub has CollectionPage/BreadcrumbList markup and lists only reviewed guides in its ItemList. JSON-LD escapes script delimiters. Publication dates and named expert credentials are not fabricated: a genuine editorial review supplies dateModified only after approval. Changing live statistics does not falsely change the editorial review date. Guides never emit JobPosting markup.

Google Rich Results Test accepted the rendered code for both pilot guides, detecting one valid Article and one valid BreadcrumbList per page. This was a code test, not a crawl of the unpublished branch. Application checks cover metadata, schema/content consistency, safe serialization, review dates, sitemap eligibility and production/preview indexing gates. Browser checks cover one H1, working section anchors, source links, the hub/guide/jobs discovery paths, sharing images, and desktop/phone layout.

Mobile PageSpeed lab baselines on the deployed previews were [95 for Ecologist](https://pagespeed.web.dev/analysis/https-jobs-wildteam-org-uk-conservation-career-guides-ecologist/0pyab9bnms?form_factor=mobile) and [97 for Wildlife Conservation](https://pagespeed.web.dev/analysis/https-jobs-wildteam-org-uk-conservation-sector-wildlife-conservation/am7cctrf92?form_factor=mobile). Both measured LCP around 2.6 seconds and CLS 0; no real-user Core Web Vitals data was available. Both SEO scores were 69, with the intentional noindex as the only failing SEO audit. These are pre-change production measurements, not scores for this local branch. Accessibility baselines were 97/96, including existing shared button contrast and certification-image dimension findings; those scores are not evidence of a complete accessibility audit.

The main navigation links to the hub; breadcrumbs, related-guide links and current-job links connect both pilots. The hub links only to implemented guide routes, with remaining careers marked coming soon. Each guide identifies cited UK careers sources, advert-sample limitations, corrections contact and editorial status. `llms.txt` distinguishes reviewed guidance from pending previews and illustrative employer pages. It is advisory and does not control indexing.

After the change is deployed, review each pilot in `/admin/guides` and publish the approved revision. Confirm index/follow on approved production URLs, noindex on pending/preview URLs, and inclusion of only reviewed guides in `/sitemap.xml`. Then run Search Console URL Inspection and request indexing for the two guides and hub; repeat the URL-based rich-results and PageSpeed checks against the deployed revision. Monitor actual indexation and Core Web Vitals as sufficient traffic accumulates. Sharing metadata and valid structured data do not guarantee rankings, rich results or indexation.

No production schema, content publication or additional career-family automation should be activated by a local test run.

### Pilot verification · 3 November 2026

`pnpm check` passed with 202 tests, formatting, TypeScript, lint and a production build. Additional isolated PostgreSQL checks exercised the migration, anonymous/candidate read and write restrictions, private source text, stale approval hashes, atomic publication and preservation of the previous version. Docker was not installed locally, so the complete historical Supabase reset and pgTAP suite still need the existing CI database job. The new rollback-only pgTAP file is included for that job.

Browser checks covered both public previews at desktop and phone widths, citations, the original-advert list, no horizontal overflow, noindex metadata, both filtered-jobs destinations and clearing the career-role filter. Guide counts matched the linked listings at the time of the checks. Anonymous access to `/admin/guides` redirected to sign-in. A signed-in browser publication and live snapshot backfill remain activation checks after the migration is applied.

A read-only sample audit found 13 Ecologist-family adverts, 12 detailed feed records, 12 employers and 3 uncertain ecology-related titles. This meets the pilot draft threshold. No salaries qualified before collecting the missing original hours evidence; the preview correctly withheld them. Counts will change as feeds update.

The existing production advisors were checked before preparing the migration. Their unrelated baseline findings were service-only tables with no client policies (intentional), [disabled leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection), an [unindexed saved-job foreign key](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys) and an [unused candidate-preference index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). This pilot does not alter those systems. Run advisors again after applying the new migration; its private evidence table intentionally has no client policy and its job foreign key is covered by its primary key.
