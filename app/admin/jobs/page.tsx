import type { Metadata } from "next";
import Link from "next/link";
import { reviewJob, reviewRecords } from "@/lib/job-review-fixtures";

export const metadata: Metadata = { title: "Job review queue" };

export default function AdminJobsPage() {
  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Job review queue</h1>
        </div>
        <p>Prioritise incomplete records, duplicate warnings and decisions awaiting a second pair of eyes.</p>
      </header>

      <section className="staff-summary shell" aria-label="Review queue summary">
        <div>
          <span>03</span>
          <strong>Need a decision</strong>
        </div>
        <div>
          <span>01</span>
          <strong>Duplicate warning</strong>
        </div>
        <div>
          <span>01</span>
          <strong>Published record</strong>
        </div>
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Ordered by attention</p>
            <h2>Records to review</h2>
          </div>
          <p>Fixture records only</p>
        </div>
        <div className="review-list">
          {reviewRecords.map((record) => {
            const job = reviewJob(record);
            if (!job) return null;

            return (
              <article className="review-row" key={record.jobSlug}>
                <div>
                  <span
                    className={`status-badge status-badge--${record.status.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    {record.status}
                  </span>
                  <p>{record.source}</p>
                </div>
                <div className="review-row__job">
                  <h2>{job.title}</h2>
                  <p>{job.organisation}</p>
                </div>
                <dl>
                  <div>
                    <dt>Complete</dt>
                    <dd>{record.completeness}%</dd>
                  </div>
                  <div>
                    <dt>Warnings</dt>
                    <dd>{record.issues.length}</dd>
                  </div>
                </dl>
                <Link className="action action--outline" href={`/admin/jobs/${record.jobSlug}`}>
                  Review record
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
