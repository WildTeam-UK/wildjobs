# WildJobs original-brief pipeline

Status: replacement implementation approved by the user on 2026-11-01 following the feed-to-live audit. EnvironmentJob is the only source approved for this rollout. This contract supersedes the 2026-10-31 full-description-reproduction requirement.

## Product contract

WildJobs publishes an original, useful conservation role brief supported by the advertised evidence. It preserves titles, employer identity, pay distinctions, requirements, location restrictions and application facts. It does not rewrite an advert sentence by sentence or republish its full description. Unknown optional facts remain unknown. Editorial usefulness, permission to publish, search indexing and Google JobPosting eligibility are separate decisions.

Public sections comprise an introduction, an additional role overview, conservation context, responsibilities, essential and desirable criteria, practical considerations, application checklist, missing information, source attribution and verification date. Canonical career areas and capabilities support comparison and relevant training suggestions. Training remains optional and is never presented as employer eligibility.

## Source approval

Each source records independent collection, AI processing and publication permissions, review date and supporting notes. The display policy is `summary_only` for this rollout, and logos are not reused. The source must also be active and have an implemented exact-endpoint connector. Source activation is an operational step, separate from applying schema migrations. Other sources are not deactivated or granted permissions by the rebuild migrations.

The user confirmed EnvironmentJob permission for original job briefs in this chat on 2026-11-01. Record that approval and its scope when activating the source. No equivalent agreement is inferred for CJS, WWT or the other configured sources.

## Durable stages

1. Discover: conditional RSS fetch, maximum 1.5 MB / 500 items; no five-item pilot restriction. Normalize tracking URLs. A normalized batch commits atomically, preserving the first-seen time. Publication timestamp churn does not invalidate enrichment.
2. Verify: fetch only an approved vacancy URL, preserve a versioned snapshot and hash, check the advertised application route, resolve employer identity and create one private canonical draft. Ambiguous identities and duplicate candidates require staff review. Recheck active pages every twelve hours, including when their feed entry is unchanged.
3. Generate: select a bounded taxonomy catalogue and generate one structured, original brief. Claims require exact supporting evidence; code rejects unknown IDs, missing evidence, changed numerical claims, excessive source copying and insufficient role detail. A primary result is saved before later stages. A failed quality gate queues a bounded stronger-model escalation.
4. Independently review: inspect every brief during controlled rollout and one in twenty in normal operation. Review accuracy, material completeness and usefulness. This is a separate task and request, not another call chained inside generation.
5. Apply: a database transaction checks evidence revision, hash and permissions before saving the brief and taxonomy. A response racing a material source change is rejected. Staff edits are never replaced automatically.
6. Publish: the database checks the current master control and target record, current source permissions, lifetime, evidence freshness, original brief readiness, employer identity, source/application URLs, engagement, geography, career area and duplicate risk. No aggregate score bypasses a required check. The same transaction publishes the job and writes the decision and moderation event. Employer-profile publication remains independent.
7. Maintain: recheck active adverts. A confirmed 404/410, explicit closure or past deadline removes a published job from discovery. Missing items in a rolling feed do not by themselves mean closure. Unknown deadlines expire thirty days after first discovery. Retain the job and permitted evidence for history.

## Authority and history

Source snapshots retain prior versions separately from the current normalized record. Evidence updates archive what they supersede. Manual evidence cannot be replaced by machine evidence. Staff content edits set protected field markers, clear derived brief sections and require staff review before publication. Staff-reviewed jobs are excluded from automatic rewriting.

Canonical employers are reused by reviewed names, aliases and website identities. A public identity projection exposes only the identity of employers attached to visible jobs; unpublished employer profiles remain private. Employer missions, overviews and public profile approval do not block job publication.

## Recovery and spend

Tasks use unique idempotency keys, optimistic source revisions, database leases and skip-locked claims. Leases expire after two minutes. Transient failures back off up to three attempts; exhausted and quality exceptions appear in the staff queue. An explicit staff retry starts a new evidence revision. Budget deferral does not consume a transient retry and resumes on the next UTC day.

Every AI call reserves request, input and output capacity atomically. The ledger covers vacancy generation, escalation, independent reviews and course taxonomy. Timeouts keep conservative reserved usage because the provider may still bill them. A completed request replaces the reservation with reported usage. Repeating an uncertain request requires review rather than silently spending again. The initial deployed budget must be confirmed separately from the old temporary backfill limits.

Normal defaults: gpt-6-luna generation; gpt-6.1-sol escalation/review; low reasoning; 35-second provider timeout; 4,000 output-token ceiling for generation and 1,000 for review. These are configurable and should be evaluated on the source-specific labelled set. No web research is part of the vacancy generation request. Course and employer context are reusable enhancements, not repeated vacancy work.

The staff pipeline workspace shows source permissions, controls, latest tasks, exact exceptions and all used/reserved tokens. Token reporting is not a provider invoice. Price estimates remain explicitly unavailable until rates are configured. The example configuration uses standard API rates checked on 2026-11-01: Luna $0.10/$0.50 and Sol $2/$10 per million input/output tokens ([OpenAI pricing](https://developers.openai.com/api/docs/pricing)). These are estimates rather than invoices; update the configured rates when changing models or processing tiers.

## Search and public delivery

Discovery uses verified briefs. Historical imported pages remain individually noindex until reviewed. Canonical job URLs remain stable through updates. A sitemap includes current, indexing-eligible jobs only. The primary production domain and `SITE_INDEXING_ENABLED` switch control launch; previews stay noindex. JobPosting markup remains off unless its independent completeness/authorization requirements are satisfied. Expired jobs do not emit current job markup.

## Verification and rollout

Run `pnpm check` and both rollback-only SQL suites under `supabase/tests`. The pipeline integration suite covers import replay, canonical draft creation, atomic publication controls, private employer separation, stale-response rejection, budget idempotency and evidence precedence. Tests use synthetic records inside a rolled-back transaction.

Then verify a real EnvironmentJob record through fetch, original brief, independent review, publication and rendered desktop/mobile page. Compare source and output for changed facts and important omissions. Keep automatic publication off until that pilot passes. Enable one record, inspect the result, then allow the approved source. Source permission, master switches and indexing launch are separate release steps.

No deployment, source activation or DNS change is implied by applying schema migrations alone.

## Release checklist prepared on 2026-11-01

The replacement is in draft PR #14. Schema-only migrations are installed; source activation and production deployment await explicit release approval following automatic approval review. CJS and WWT operational flags were not changed. EnvironmentJob collection, AI and publication permissions remain off until the replacement worker is deployed. The deployed staff RPC signatures delegate to the replacement review checks during the transition.

Release environment: `AI_ENRICHMENT_ENABLED=true`, `AUTO_PUBLISH_ENABLED=false`, `PIPELINE_REVIEW_ALL=true`, Luna generation and Sol review, 200 requests / 500,000 input / 80,000 output tokens per UTC day. Replace the earlier temporary backfill limits. Set the model-specific price rates from `.env.example`. Keep site indexing off during the pilot.

After deployment, enable only the exact EnvironmentJob RSS source, set `summary_only`, leave logo reuse off, and record the user's 2026-11-01 approval for collection and original evidence-backed briefs in the permission notes. Run a single-record shadow pilot first, inspect its source and generated page, then enable targeted publication before source-wide automatic publication. Never grant another source by copying these settings.

`pipeline_heartbeat_needed()` is a database-side predicate for the existing minute cron. Install the prepared operational SQL in `supabase/operations/enable_pipeline_heartbeat.sql` only during the approved release. It avoids invoking Vercel when imports, rechecks, release work, tasks and course refresh are not due. This does not add a second scheduler.

Verification to date: 202 unit tests, TypeScript, formatting, lint and production build pass. A synthetic original brief renders at desktop and 390px widths without horizontal page overflow; canonical points at the intended production domain, development stays noindex and no JobPosting markup is emitted. CI replays all migrations and runs schema lint plus both SQL suites. The legacy migration overload declarations were made replaceable because they already duplicate signatures installed earlier in the migration history. The security test taxonomy fixtures are namespaced to avoid collisions with reference data.

The live feed yielded 177 distinct HTTPS vacancy URLs. A read-only three-page detail sample extracted employer, country, location, deadline and application destination for every page. The application gate recognises an explicit HTTPS application button outside the structured description; a schema URL fallback alone is insufficient.

A real provider-to-published-page pilot remains a release gate. Synthetic and rollback-only tests do not establish model quality on the live EnvironmentJob feed.
