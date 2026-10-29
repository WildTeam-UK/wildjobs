import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { runSourceDiscovery } from "@/app/admin/sources/actions";
import { isSupportedWwtSource } from "@/lib/admin/wwt-source";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vacancy source" };

type SourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ run?: string; status?: string }>;
};

const mappingLabels: Record<string, string> = {
  ignored: "Ignored",
  mapped: "In review or published",
  possible_duplicate: "Check duplicate",
  unmapped: "Needs review",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function SourcePage({ params, searchParams }: SourcePageProps) {
  const staff = await requireStaff();
  const sourceId = Number((await params).id);
  if (!Number.isSafeInteger(sourceId) || sourceId < 1) notFound();

  const supabase = await createClient();
  const [sourceResult, recordsResult] = await Promise.all([
    supabase
      .from("job_sources")
      .select("id, name, source_type, authoritative_base_url, is_active")
      .eq("id", sourceId)
      .maybeSingle(),
    supabase
      .from("job_source_records")
      .select("id, external_id, canonical_url, mapping_status, job_id, first_seen_at, last_seen_at")
      .eq("source_id", sourceId)
      .order("last_seen_at", { ascending: false }),
  ]);
  if (sourceResult.error || !sourceResult.data) notFound();

  const source = sourceResult.data;
  const records = recordsResult.data ?? [];
  const query = await searchParams;
  const checkSource = runSourceDiscovery;

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
        {query.status === "checked" ? (
          <p className="staff-form-message" role="status">
            Vacancy check complete{query.run ? ` · run ${query.run}` : ""}. Nothing was published.
          </p>
        ) : null}
        {query.status === "failed" ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            WWT could not be checked just now. Nothing was published; try again later.
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
            <h2>{records.length} source records</h2>
          </div>
          {staff.role === "admin" &&
          source.is_active &&
          isSupportedWwtSource(source.authoritative_base_url) ? (
            <form action={checkSource}>
              <input name="sourceId" type="hidden" value={source.id} />
              <button className="action" type="submit">
                Check WWT now
              </button>
            </form>
          ) : null}
        </div>

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
                    <h2>
                      Source vacancy {record.external_id ? `#${record.external_id}` : `record ${record.id}`}
                    </h2>
                    <p>
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
                  </div>
                </article>
              );
            })}
          </div>
        ) : recordsResult.error ? null : (
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
