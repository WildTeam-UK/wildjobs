import type { Metadata } from "next";

export const metadata: Metadata = { title: "Import runs" };

const runs = [
  {
    id: "RUN-104",
    source: "Demonstration feed",
    status: "Needs review",
    received: 18,
    accepted: 15,
    warnings: 3,
  },
  { id: "RUN-103", source: "Curated partner", status: "Complete", received: 7, accepted: 7, warnings: 0 },
  {
    id: "RUN-102",
    source: "Demonstration feed",
    status: "Complete",
    received: 21,
    accepted: 20,
    warnings: 1,
  },
] as const;

export default function ImportRunsPage() {
  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Import runs</h1>
        </div>
        <p>
          Understand what arrived, what was accepted and what needs human review without exposing credentials.
        </p>
      </header>
      <section className="staff-section shell">
        <div className="import-list">
          {runs.map((run) => (
            <article key={run.id}>
              <div>
                <p className="eyebrow">{run.id}</p>
                <h2>{run.source}</h2>
              </div>
              <span className="status-badge">{run.status}</span>
              <dl>
                <div>
                  <dt>Received</dt>
                  <dd>{run.received}</dd>
                </div>
                <div>
                  <dt>Accepted</dt>
                  <dd>{run.accepted}</dd>
                </div>
                <div>
                  <dt>Warnings</dt>
                  <dd>{run.warnings}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="safe-error-note">
          <p className="eyebrow">Safe error summaries</p>
          <h2>Show staff what they can act on.</h2>
          <p>
            Import screens may name the affected field or source reference, but never display provider
            secrets, raw credentials or unnecessary personal data.
          </p>
        </div>
      </section>
    </main>
  );
}
