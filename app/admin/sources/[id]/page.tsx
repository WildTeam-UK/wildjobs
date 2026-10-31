import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  enrichSourceRecord,
  linkSourceRecordToJob,
  prepareSourceRecordDraft,
  runSourceDiscovery,
  setSourceRecordStatus,
} from "@/app/admin/sources/actions";
import { SubmitButton } from "@/components/submit-button";
import {
  automationBlockerLabels,
  type AutomationBlockerCode,
} from "@/lib/admin/automation-publication-readiness";
import { connectorActionLabel, getSourceConnector } from "@/lib/admin/source-connector";
import { findDuplicateJob, findDuplicateSourceRecord } from "@/lib/admin/duplicate-match";
import { buildSourceRecordDraftDefaults, prepareSourceRecordJobInput } from "@/lib/admin/source-record-draft";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vacancy source" };

type SourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string | string[];
    enrichment?: string | string[];
    q?: string | string[];
    record?: string | string[];
    run?: string | string[];
    status?: string | string[];
  }>;
};

const mappingLabels: Record<string, string> = {
  ignored: "Ignored",
  mapped: "In review or published",
  possible_duplicate: "Check duplicate",
  unmapped: "Needs review",
};

const enrichmentLabels: Record<string, string> = {
  complete: "Enriched",
  failed: "Enrichment failed",
  needs_review: "Enriched · check gaps",
  pending: "Ready to enrich",
  running: "Enriching",
  skipped: "Already current",
};

const automationLabels: Record<string, string> = {
  blocked: "Automation check · review needed",
  failed: "Automation check failed safely",
  pending: "Automation check pending",
  published: "Published automatically",
  ready: "Automation check · ready",
};

const filterStatuses = ["review", "duplicate", "mapped", "ignored", "all"] as const;

type FilterStatus = (typeof filterStatuses)[number];

const statusMappings: Partial<Record<FilterStatus, string>> = {
  duplicate: "possible_duplicate",
  ignored: "ignored",
  mapped: "mapped",
  review: "unmapped",
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/London",
  }).format(new Date(`${value}T12:00:00Z`));
}

function jobStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "draft",
    expired: "expired",
    in_review: "in review",
    published: "published",
    rejected: "rejected",
    withdrawn: "withdrawn",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export default async function SourcePage({ params, searchParams }: SourcePageProps) {
  const staff = await requireStaff();
  const sourceId = Number((await params).id);
  if (!Number.isSafeInteger(sourceId) || sourceId < 1) notFound();

  const query = await searchParams;
  const requestedFilter = firstQueryValue(query.status);
  const filterStatus = filterStatuses.includes(requestedFilter as FilterStatus)
    ? (requestedFilter as FilterStatus)
    : "review";
  const searchQuery = (firstQueryValue(query.q) ?? "").trim().slice(0, 100);
  const mappingStatus = statusMappings[filterStatus];

  const supabase = await createClient();
  let recordsQuery = supabase
    .from("job_source_records")
    .select(
      "id, source_id, external_id, canonical_url, mapping_status, job_id, first_seen_at, last_seen_at, source_title, employer_name, location_text, location_locality, location_region, postal_code, country_code, closes_at, source_updated_at, summary, application_url, detail_fetched_at, detail_text, employer_id, employer_website_url, enrichment_attempts, enrichment_completed_at, enrichment_error_code, enrichment_status, automation_status, automation_blockers, automation_score, automation_evaluated_at, automation_policy_version, job_source_field_evidence(field_name, resolution_status, value, confidence, source_kind, extraction_method, evidence_text, extractor_version)",
    )
    .eq("source_id", sourceId)
    .order("last_seen_at", { ascending: false });
  if (mappingStatus) recordsQuery = recordsQuery.eq("mapping_status", mappingStatus);

  const [sourceResult, recordsResult, jobsResult, otherSourceRecordsResult] = await Promise.all([
    supabase
      .from("job_sources")
      .select("id, name, source_type, authoritative_base_url, is_active, default_country_code")
      .eq("id", sourceId)
      .maybeSingle(),
    recordsQuery,
    supabase
      .from("jobs")
      .select("id, title, status, employers(name), job_source_records(canonical_url)")
      .order("updated_at", { ascending: false })
      .limit(1_000),
    supabase
      .from("job_source_records")
      .select("id, source_id, canonical_url, employer_name, source_title, job_sources(name)")
      .neq("source_id", sourceId)
      .is("job_id", null)
      .in("mapping_status", ["unmapped", "possible_duplicate"])
      .limit(1_000),
  ]);
  if (sourceResult.error || !sourceResult.data) notFound();

  const source = sourceResult.data;
  const records = (recordsResult.data ?? []).filter((record) => {
    if (!searchQuery) return true;
    const haystack = [record.source_title, record.employer_name, record.location_text]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("en-GB");
    return haystack.includes(searchQuery.toLocaleLowerCase("en-GB"));
  });
  const checkSource = runSourceDiscovery;
  const connector = getSourceConnector(source.source_type, source.authoritative_base_url);
  const duplicateCandidates = (jobsResult.data ?? []).map((job) => ({
    canonicalUrls: job.job_source_records.flatMap((record) =>
      record.canonical_url ? [record.canonical_url] : [],
    ),
    employerName: job.employers.name,
    id: job.id,
    status: job.status,
    title: job.title,
  }));
  const crossFeedCandidates = (otherSourceRecordsResult.data ?? []).map((record) => ({
    canonicalUrl: record.canonical_url,
    employerName: record.employer_name,
    id: record.id,
    sourceId: record.source_id,
    sourceName: record.job_sources.name,
    sourceTitle: record.source_title,
  }));

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/sources">
          <span aria-hidden="true">←</span> Vacancy sources
        </Link>
      </div>
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Approved source</p>
          <h1>{source.name}</h1>
        </div>
        <p>
          Every discovery is enriched, checked against the publication policy and either published safely or
          held here with an exact reason.
        </p>
      </header>

      <section className="staff-section shell">
        {firstQueryValue(query.status) === "checked" ? (
          <p className="staff-form-message" role="status">
            Vacancy check complete
            {firstQueryValue(query.run) ? ` · run ${firstQueryValue(query.run)}` : ""}. Nothing was published.
          </p>
        ) : null}
        {firstQueryValue(query.status) === "failed" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            This source could not be checked just now. Nothing was published; try again later.
          </p>
        ) : null}
        {firstQueryValue(query.status) === "already-running" ? (
          <p className="staff-form-message" role="status">
            This source is already being checked. Its result will appear in Import runs when it finishes.
          </p>
        ) : null}
        {firstQueryValue(query.status) === "triaged" ? (
          <p className="staff-form-message" role="status">
            Source record updated. Nothing was published.
          </p>
        ) : null}
        {firstQueryValue(query.status) === "linked" ? (
          <p className="staff-form-message" role="status">
            Additional source linked to the existing WildJobs vacancy. No new public listing was created.
          </p>
        ) : null}
        {firstQueryValue(query.enrichment) === "completed" ? (
          <p className="staff-form-message" role="status">
            The private vacancy draft and its extracted evidence are up to date.
          </p>
        ) : null}
        {firstQueryValue(query.enrichment) === "needs_review" ? (
          <p className="staff-form-message" role="status">
            Enrichment finished, but one or more required facts still need a person to check them.
          </p>
        ) : null}
        {firstQueryValue(query.enrichment) === "skipped" ? (
          <p className="staff-form-message" role="status">
            This vacancy is already enriched from the current page content.
          </p>
        ) : null}
        {firstQueryValue(query.enrichment) === "failed" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            The vacancy could not be enriched this time. Its feed record is unchanged and nothing was
            published.
          </p>
        ) : null}
        {firstQueryValue(query.error) === "triage-unavailable" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            That source record could not be updated. Please try again.
          </p>
        ) : null}
        {firstQueryValue(query.error) === "link-unavailable" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            That source could not be linked. It may have changed since the duplicate warning was shown.
          </p>
        ) : null}
        {firstQueryValue(query.error) === "duplicate-review" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Automatic preparation stopped because this vacancy may already exist. Review and link the matching
            record instead.
          </p>
        ) : null}
        {firstQueryValue(query.error) === "prepare-unavailable" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            The private review draft could not be prepared. Nothing was published; try again or review the
            source details manually.
          </p>
        ) : null}
        {firstQueryValue(query.run) && firstQueryValue(query.status) !== "checked" ? (
          <p className="staff-form-message" role="status">
            Showing the current records for import run {firstQueryValue(query.run)}. The run counts remain in
            import history.
          </p>
        ) : null}
        {recordsResult.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Discovered vacancies are temporarily unavailable.
          </p>
        ) : null}
        {jobsResult.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Existing vacancy matching is temporarily unavailable. Review records carefully before creating a
            draft.
          </p>
        ) : null}
        {otherSourceRecordsResult.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Cross-feed matching is temporarily unavailable. Review records carefully before creating a draft.
          </p>
        ) : null}

        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Discovery queue</p>
            <h2>{records.length} matching records</h2>
          </div>
          {staff.role === "admin" && source.is_active && connector ? (
            <form action={checkSource}>
              <input name="sourceId" type="hidden" value={source.id} />
              <button className="action" type="submit">
                {connectorActionLabel(connector)}
              </button>
            </form>
          ) : null}
        </div>

        <form className="source-record-filters" method="get">
          {firstQueryValue(query.run) ? (
            <input name="run" type="hidden" value={firstQueryValue(query.run)} />
          ) : null}
          <div>
            <label htmlFor="source-record-search">Search vacancies</label>
            <input
              defaultValue={searchQuery}
              id="source-record-search"
              maxLength={100}
              name="q"
              placeholder="Title, employer or location"
              type="search"
            />
          </div>
          <div>
            <label htmlFor="source-record-status">Queue status</label>
            <select defaultValue={filterStatus} id="source-record-status" name="status">
              <option value="review">Needs review</option>
              <option value="duplicate">Check duplicate</option>
              <option value="mapped">In review or published</option>
              <option value="ignored">Ignored</option>
              <option value="all">All records</option>
            </select>
          </div>
          <button className="staff-source-toggle" type="submit">
            Apply filters
          </button>
          <Link href={`/admin/sources/${source.id}`}>Clear</Link>
        </form>

        {records.length ? (
          <div className="source-record-list">
            {records.map((record) => {
              const canReview =
                staff.role === "admin" &&
                record.job_id === null &&
                ["unmapped", "possible_duplicate"].includes(record.mapping_status);
              const duplicate = canReview ? findDuplicateJob(record, duplicateCandidates) : null;
              const crossFeedDuplicate =
                canReview && !duplicate ? findDuplicateSourceRecord(record, crossFeedCandidates) : null;
              const resolvedEvidence = record.job_source_field_evidence.filter(
                (item) => item.resolution_status === "extracted" && item.value,
              );
              const canEnrich =
                staff.role === "admin" &&
                ["unmapped", "mapped"].includes(record.mapping_status) &&
                ["pending", "failed", "needs_review"].includes(record.enrichment_status) &&
                record.enrichment_attempts < 3;
              const automaticDraft =
                canReview &&
                ["complete", "needs_review", "skipped"].includes(record.enrichment_status) &&
                record.mapping_status === "unmapped" &&
                record.canonical_url &&
                !duplicate &&
                !crossFeedDuplicate
                  ? prepareSourceRecordJobInput(
                      buildSourceRecordDraftDefaults({
                        ...record,
                        employer_name: record.employer_name ?? source.name,
                      }),
                    ).data
                  : undefined;
              return (
                <article key={record.id}>
                  <div>
                    <span className="status-badge">
                      {mappingLabels[record.mapping_status] ?? record.mapping_status}
                    </span>
                    <span className="status-badge">
                      {enrichmentLabels[record.enrichment_status] ?? record.enrichment_status}
                    </span>
                    <span className="status-badge">
                      {automationLabels[record.automation_status] ?? record.automation_status}
                    </span>
                    <h2>{record.source_title ?? "Untitled source vacancy"}</h2>
                    <dl className="source-record-list__details">
                      <div>
                        <dt>Employer</dt>
                        <dd>{record.employer_name ?? source.name}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{record.location_text ?? "Check original vacancy"}</dd>
                      </div>
                      <div>
                        <dt>Closing date</dt>
                        <dd>{record.closes_at ? formatDate(record.closes_at) : "Check original vacancy"}</dd>
                      </div>
                    </dl>
                    <p className="source-record-list__seen">
                      First seen {formatTimestamp(record.first_seen_at)} · last checked{" "}
                      {formatTimestamp(record.last_seen_at)}
                    </p>
                    {record.detail_fetched_at ? (
                      <p className="source-record-list__seen">
                        Detail page checked {formatTimestamp(record.detail_fetched_at)} ·{" "}
                        {resolvedEvidence.length} fields supported by evidence
                      </p>
                    ) : null}
                    {record.automation_evaluated_at ? (
                      <p className="source-record-list__seen">
                        Automation score {record.automation_score ?? 0}% · checked{" "}
                        {formatTimestamp(record.automation_evaluated_at)}
                        {record.automation_policy_version ? ` · ${record.automation_policy_version}` : ""}
                      </p>
                    ) : null}
                    {record.automation_status === "ready" ? (
                      <aside className="source-record-list__duplicate">
                        <strong>Ready for automatic publication</strong>
                        <p>
                          Every required evidence check passed. Automatic publication is{" "}
                          {process.env.AUTO_PUBLISH_ENABLED === "true" ? "enabled" : "still in shadow mode"}.
                        </p>
                      </aside>
                    ) : null}
                    {record.automation_blockers.length ? (
                      <aside className="source-record-list__duplicate">
                        <strong>Why automation stopped</strong>
                        <ul>
                          {record.automation_blockers.map((blocker) => (
                            <li key={blocker}>
                              {automationBlockerLabels[blocker as AutomationBlockerCode] ??
                                blocker.replaceAll("_", " ")}
                            </li>
                          ))}
                        </ul>
                      </aside>
                    ) : null}
                    {resolvedEvidence.length ? (
                      <aside className="source-record-list__duplicate">
                        <strong>Extracted evidence</strong>
                        <ul>
                          {resolvedEvidence.map((item) => (
                            <li key={item.field_name}>
                              <strong>{item.field_name.replaceAll("_", " ")}:</strong> {item.value}{" "}
                              <small>
                                ({item.confidence}% · {item.source_kind.replaceAll("_", " ")})
                              </small>
                            </li>
                          ))}
                        </ul>
                      </aside>
                    ) : null}
                    {duplicate ? (
                      <aside className="source-record-list__duplicate">
                        <strong>Possible WildJobs match</strong>
                        <p>
                          {duplicate.reason === "same_address"
                            ? "The authoritative vacancy address is already linked"
                            : "The employer and role title match"}{" "}
                          <Link href={`/admin/jobs/${duplicate.job.id}`}>
                            record #{duplicate.job.id} ({jobStatusLabel(duplicate.job.status)})
                          </Link>
                          .
                        </p>
                        {staff.role === "admin" ? (
                          <form action={linkSourceRecordToJob}>
                            <input name="recordId" type="hidden" value={record.id} />
                            <input name="jobId" type="hidden" value={duplicate.job.id} />
                            <button className="staff-source-toggle" type="submit">
                              Link source to record #{duplicate.job.id}
                            </button>
                          </form>
                        ) : null}
                      </aside>
                    ) : null}
                    {crossFeedDuplicate ? (
                      <aside className="source-record-list__duplicate">
                        <strong>Possible cross-feed match</strong>
                        <p>
                          {crossFeedDuplicate.reason === "same_address"
                            ? "The authoritative vacancy address also appears in"
                            : "The employer and role title also match a record from"}{" "}
                          <Link
                            href={{
                              pathname: `/admin/sources/${crossFeedDuplicate.sourceRecord.sourceId}`,
                              query: {
                                q:
                                  crossFeedDuplicate.sourceRecord.sourceTitle ??
                                  crossFeedDuplicate.sourceRecord.employerName ??
                                  "",
                                status: "all",
                              },
                            }}
                          >
                            {crossFeedDuplicate.sourceRecord.sourceName}
                          </Link>
                          . Review both before choosing which record creates the WildJobs job.
                        </p>
                      </aside>
                    ) : null}
                  </div>
                  <div className="source-record-list__actions">
                    {record.canonical_url ? (
                      <a href={record.canonical_url} rel="noreferrer" target="_blank">
                        Open original vacancy <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                    {canEnrich ? (
                      <form action={enrichSourceRecord}>
                        <input name="recordId" type="hidden" value={record.id} />
                        <SubmitButton
                          className="staff-source-toggle"
                          idleLabel={record.enrichment_attempts ? "Try enrichment again" : "Enrich vacancy"}
                          pendingLabel="Enriching vacancy…"
                        />
                      </form>
                    ) : null}
                    {automaticDraft ? (
                      <form action={prepareSourceRecordDraft}>
                        <input name="recordId" type="hidden" value={record.id} />
                        <SubmitButton
                          className="staff-source-toggle"
                          idleLabel="Prepare private draft"
                          pendingLabel="Preparing private draft…"
                        />
                      </form>
                    ) : canReview &&
                      ["complete", "needs_review", "skipped"].includes(record.enrichment_status) ? (
                      <Link className="staff-source-toggle" href={`/admin/jobs/new?recordId=${record.id}`}>
                        Review missing details
                      </Link>
                    ) : record.job_id ? (
                      <Link href={`/admin/jobs/${record.job_id}`}>Open WildJobs record</Link>
                    ) : null}
                    {staff.role === "admin" && record.job_id === null ? (
                      <div className="source-record-list__triage">
                        {record.mapping_status === "possible_duplicate" ||
                        record.mapping_status === "ignored" ? (
                          <form action={setSourceRecordStatus}>
                            <input name="recordId" type="hidden" value={record.id} />
                            <input name="status" type="hidden" value="unmapped" />
                            <button className="staff-source-toggle" type="submit">
                              Return to review
                            </button>
                          </form>
                        ) : null}
                        {record.mapping_status === "unmapped" ? (
                          <form action={setSourceRecordStatus}>
                            <input name="recordId" type="hidden" value={record.id} />
                            <input name="status" type="hidden" value="possible_duplicate" />
                            <button className="staff-source-toggle" type="submit">
                              Mark duplicate
                            </button>
                          </form>
                        ) : null}
                        {record.mapping_status !== "ignored" ? (
                          <form action={setSourceRecordStatus}>
                            <input name="recordId" type="hidden" value={record.id} />
                            <input name="status" type="hidden" value="ignored" />
                            <button className="staff-source-toggle" type="submit">
                              Ignore
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : recordsResult.error ? null : searchQuery || filterStatus !== "all" ? (
          <div className="staff-empty-state">
            <p className="eyebrow">No matches</p>
            <h2>No source records match these filters.</h2>
            <p>Clear the search or choose a different queue status.</p>
          </div>
        ) : (
          <div className="staff-empty-state">
            <p className="eyebrow">Ready to connect</p>
            <h2>No vacancies have been discovered yet.</h2>
            <p>The first check will record source identities for review without publishing anything.</p>
          </div>
        )}
      </section>
    </main>
  );
}
