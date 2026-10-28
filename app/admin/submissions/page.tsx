import type { Metadata } from "next";
import Link from "next/link";
import { employerSubmissions } from "@/lib/employer-submission-fixtures";

export const metadata: Metadata = { title: "Employer submissions" };

export default function SubmissionsPage() {
  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Employer submissions</h1>
        </div>
        <p>Keep submitter evidence, employer matching and the publishing decision separate and reviewable.</p>
      </header>
      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Controlled intake</p>
            <h2>Awaiting attention</h2>
          </div>
          <p>{employerSubmissions.length} fixture submissions</p>
        </div>
        <div className="submission-review-list">
          {employerSubmissions.map((submission) => (
            <article key={submission.id}>
              <div>
                <span className="status-badge">{submission.status}</span>
                <p>{submission.id}</p>
              </div>
              <div>
                <h2>{submission.roleTitle}</h2>
                <p>{submission.organisation}</p>
              </div>
              <dl>
                <div>
                  <dt>Complete</dt>
                  <dd>{submission.completeness}%</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>{submission.contactLabel}</dd>
                </div>
              </dl>
              <Link className="action action--outline" href={`/admin/submissions/${submission.id}`}>
                Review submission
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
