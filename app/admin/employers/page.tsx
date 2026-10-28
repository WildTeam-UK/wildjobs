import type { Metadata } from "next";
import { employerReviewFixtures } from "@/lib/employer-submission-fixtures";

export const metadata: Metadata = { title: "Employer review" };

export default function EmployerReviewPage() {
  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Employer review</h1>
        </div>
        <p>
          Match new submissions carefully so duplicate profiles do not split an organisation’s history or
          roles.
        </p>
      </header>
      <section className="staff-section shell">
        <div className="employer-review-list">
          {employerReviewFixtures.map((employer) => (
            <article key={employer.name}>
              <div>
                <span className="status-badge">{employer.status}</span>
                <h2>{employer.name}</h2>
                <p>{employer.evidence}</p>
              </div>
              <dl>
                <dt>Potential profiles</dt>
                <dd>{employer.profiles}</dd>
              </dl>
              <div className="employer-review-actions">
                <button className="action action--outline" type="button">
                  Inspect match
                </button>
                {employer.profiles > 1 ? (
                  <button className="staff-danger-action" type="button">
                    Preview merge
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <p className="staff-body-copy employer-review-note">
          Merge controls must preserve source identifiers, published jobs and audit history. This preview
          deliberately performs no merge.
        </p>
      </section>
    </main>
  );
}
