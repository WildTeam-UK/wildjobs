import type { Metadata } from "next";

import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Import runs" };

const statusLabels: Record<string, string> = {
  cancelled: "Cancelled",
  completed: "Complete",
  failed: "Failed",
  started: "Running",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function ImportRunsPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: runs, error } = await supabase
    .from("import_runs")
    .select(
      "id, status, started_at, finished_at, records_seen, records_created, records_updated, records_flagged, error_summary, job_sources(name, source_type)",
    )
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Import runs</h1>
        </div>
        <p>See what each approved connection received, created, changed or flagged before staff review.</p>
      </header>
      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Run history</p>
            <h2>{runs?.length ?? 0} recorded imports</h2>
          </div>
          <p>The latest 50 runs are shown.</p>
        </div>

        {error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Import history is temporarily unavailable.
          </p>
        ) : null}

        {runs?.length ? (
          <div className="import-list">
            {runs.map((run) => (
              <article key={run.id}>
                <div>
                  <p className="eyebrow">
                    RUN-{run.id} · {formatTimestamp(run.started_at)}
                  </p>
                  <h2>{run.job_sources?.name ?? "Unknown source"}</h2>
                  {run.error_summary ? <p className="import-list__error">{run.error_summary}</p> : null}
                </div>
                <span className={`status-badge status-badge--${run.status}`}>
                  {statusLabels[run.status] ?? run.status}
                </span>
                <dl>
                  <div>
                    <dt>Seen</dt>
                    <dd>{run.records_seen}</dd>
                  </div>
                  <div>
                    <dt>New</dt>
                    <dd>{run.records_created}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{run.records_updated}</dd>
                  </div>
                  <div>
                    <dt>Flagged</dt>
                    <dd>{run.records_flagged}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : error ? null : (
          <div className="staff-empty-state">
            <p className="eyebrow">No imports yet</p>
            <h2>The source library is ready for its first connection.</h2>
            <p>
              When an approved feed or API is connected, each run will appear here with its real counts and
              safe error summary.
            </p>
          </div>
        )}

        <div className="safe-error-note">
          <div>
            <p className="eyebrow">Safe error summaries</p>
            <h2>Show staff what they can act on.</h2>
          </div>
          <p>
            Import records may identify an affected field or source reference, but never expose provider
            secrets, credentials or unnecessary personal data.
          </p>
        </div>
      </section>
    </main>
  );
}
