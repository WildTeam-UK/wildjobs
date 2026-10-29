import type { Metadata } from "next";
import Link from "next/link";

import {
  employerSubmissionStatusLabel,
  formatSubmissionTimestamp,
} from "@/lib/admin/employer-submission-display";
import { getEmployerSubmissionQueue } from "@/lib/admin/employer-submissions";

export const metadata: Metadata = { title: "Employer submissions" };

export default async function SubmissionsPage() {
  const submissions = await getEmployerSubmissionQueue();
  const needsAttention = submissions.filter((submission) =>
    ["new", "changes_requested", "ready_for_job_review"].includes(submission.status),
  ).length;

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
            <p className="eyebrow">Live Supabase records</p>
            <h2>{needsAttention} awaiting attention</h2>
          </div>
          <Link className="action" href="/admin/submissions/invitations">
            Manage invitations
          </Link>
        </div>
        {submissions.length ? (
          <div className="submission-review-list">
            {submissions.map((submission) => (
              <article key={submission.id}>
                <div>
                  <span className="status-badge">{employerSubmissionStatusLabel(submission.status)}</span>
                  <p>SUB-{submission.id}</p>
                </div>
                <div>
                  <h2>{submission.role_title}</h2>
                  <p>{submission.organisation_name}</p>
                </div>
                <dl>
                  <div>
                    <dt>Complete</dt>
                    <dd>{submission.completeness_score}%</dd>
                  </div>
                  <div>
                    <dt>Received</dt>
                    <dd>{formatSubmissionTimestamp(submission.received_at)}</dd>
                  </div>
                </dl>
                <Link className="action action--outline" href={`/admin/submissions/${submission.id}`}>
                  Review submission
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="staff-empty-state">
            <p className="eyebrow">Queue clear</p>
            <h2>No employer submissions have been received.</h2>
            <p>
              Approved invitation submissions will appear here without exposing them to candidates or the
              public.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
