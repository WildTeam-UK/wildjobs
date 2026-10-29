import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { runSourceDiscovery, setSourceRecordStatus } from "@/app/admin/sources/actions";
import { connectorActionLabel, getSourceConnector } from "@/lib/admin/source-connector";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vacancy source" };

type SourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string | string[];
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
      "id, external_id, canonical_url, mapping_status, job_id, first_seen_at, last_seen_at, source_title, employer_name, location_text, closes_at",
    )
    .eq("source_id", sourceId)
    .order("last_seen_at", { ascending: false });
  if (mappingStatus) recordsQuery = recordsQuery.eq("mapping_status", mappingStatus);

  const [sourceResult, recordsResult] = await Promise.all([
    supabase
      .from("job_sources")
      .select("id, name, source_type, authoritative_base_url, is_active")
      .eq("id", sourceId)
      .maybeSingle(),
    recordsQuery,
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
          Every discovery stays private here until a staff member checks the original vacancy and creates a
          review draft.
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
        {firstQueryValue(query.status) === "triaged" ? (
          <p className="staff-form-message" role="status">
            Source record updated. Nothing was published.
          </p>
        ) : null}
        {firstQueryValue(query.error) === "triage-unavailable" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            That source record could not be updated. Please try again.
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
              return (
                <article key={record.id}>
                  <div>
                    <span className="status-badge">
                      {mappingLabels[record.mapping_status] ?? record.mapping_status}
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
                  </div>
                  <div className="source-record-list__actions">
                    {record.canonical_url ? (
                      <a href={record.canonical_url} rel="noreferrer" target="_blank">
                        Open original vacancy <span aria-hidden="true">↗</span>
                      </a>
                    ) : null}
                    {canReview ? (
                      <Link className="staff-source-toggle" href={`/admin/jobs/new?recordId=${record.id}`}>
                        Create review draft
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
