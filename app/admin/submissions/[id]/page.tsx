import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { employerSubmissionById, employerSubmissions } from "@/lib/employer-submission-fixtures";

type SubmissionPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return employerSubmissions.map((submission) => ({ id: submission.id }));
}

export async function generateMetadata({ params }: SubmissionPageProps): Promise<Metadata> {
  const submission = employerSubmissionById((await params).id);
  return { title: submission ? `Review ${submission.roleTitle}` : "Review submission" };
}

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const submission = employerSubmissionById((await params).id);
  if (!submission) notFound();

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/submissions">
          <span aria-hidden="true">←</span> Submission queue
        </Link>
      </div>
      <header className="review-hero shell">
        <div>
          <span className="status-badge">{submission.status}</span>
          <p>{submission.organisation}</p>
          <h1>{submission.roleTitle}</h1>
        </div>
        <dl>
          <div>
            <dt>Submission</dt>
            <dd>{submission.id}</dd>
          </div>
          <div>
            <dt>Contact evidence</dt>
            <dd>{submission.contactLabel}</dd>
          </div>
          <div>
            <dt>Completeness</dt>
            <dd>{submission.completeness}%</dd>
          </div>
        </dl>
      </header>
      <div className="shell review-layout">
        <article className="review-content">
          <section>
            <p className="eyebrow">Validation summary</p>
            <h2>What the submitter supplied</h2>
            <ul className="review-issues review-issues--neutral">
              {submission.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="eyebrow">Separation of records</p>
            <h2>Submission is not publication</h2>
            <p className="staff-body-copy">
              The original submission, submitter evidence, matched employer and eventual public vacancy remain
              distinguishable. Staff corrections belong in the review history rather than silently replacing
              the source record.
            </p>
          </section>
        </article>
        <aside className="review-actions" aria-label="Submission actions">
          <p className="eyebrow">Next decision</p>
          <h2>Move into review</h2>
          <button className="action" type="button">
            Create job review draft
          </button>
          <button className="action action--outline" type="button">
            Request corrections
          </button>
          <button className="staff-danger-action" type="button">
            Reject submission
          </button>
          <p>Design preview only. No message is sent and no record changes state.</p>
        </aside>
      </div>
    </main>
  );
}
