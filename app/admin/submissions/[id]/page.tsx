import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  employerSubmissionStatusLabel,
  formatSubmissionTimestamp,
  parseEmployerSubmissionId,
  workplaceTypeLabel,
} from "@/lib/admin/employer-submission-display";
import { getEmployerSubmission } from "@/lib/admin/employer-submissions";
import { formatDate } from "@/lib/jobs";

type SubmissionPageProps = { params: Promise<{ id: string }> };
export const metadata: Metadata = { title: "Review employer submission" };

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const id = parseEmployerSubmissionId((await params).id);
  if (!id) notFound();

  const { events, submission } = await getEmployerSubmission(id);
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
          <span className="status-badge">{employerSubmissionStatusLabel(submission.status)}</span>
          <p>{submission.organisation_name}</p>
          <h1>{submission.role_title}</h1>
        </div>
        <dl>
          <div>
            <dt>Submission</dt>
            <dd>SUB-{submission.id}</dd>
          </div>
          <div>
            <dt>Contact evidence</dt>
            <dd>{submission.contact_name}</dd>
          </div>
          <div>
            <dt>Completeness</dt>
            <dd>{submission.completeness_score}%</dd>
          </div>
        </dl>
      </header>
      <div className="shell review-layout">
        <article className="review-content">
          <section>
            <p className="eyebrow">Submitted vacancy</p>
            <h2>What the submitter supplied</h2>
            <dl className="submission-detail-list">
              <div>
                <dt>Salary</dt>
                <dd>{submission.salary_text}</dd>
              </div>
              <div>
                <dt>Closing date</dt>
                <dd>{formatDate(submission.closing_date)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{submission.location_text}</dd>
              </div>
              <div>
                <dt>Working arrangement</dt>
                <dd>{workplaceTypeLabel(submission.workplace_type)}</dd>
              </div>
              <div className="submission-detail-list__wide">
                <dt>Role summary</dt>
                <dd>{submission.role_summary}</dd>
              </div>
              <div className="submission-detail-list__wide">
                <dt>Application destination</dt>
                <dd>
                  <a href={submission.application_url} rel="noreferrer" target="_blank">
                    Open authoritative application page <span aria-hidden="true">↗</span>
                  </a>
                </dd>
              </div>
            </dl>
          </section>
          <section>
            <p className="eyebrow">Contact evidence</p>
            <h2>Who supplied it</h2>
            <dl className="submission-detail-list">
              <div>
                <dt>Contact</dt>
                <dd>{submission.contact_name}</dd>
              </div>
              <div>
                <dt>Work email</dt>
                <dd>
                  <a href={`mailto:${submission.contact_email}`}>{submission.contact_email}</a>
                </dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>{formatSubmissionTimestamp(submission.received_at)}</dd>
              </div>
              <div>
                <dt>Authority confirmed</dt>
                <dd>{formatSubmissionTimestamp(submission.authority_confirmed_at)}</dd>
              </div>
            </dl>
          </section>
          {events.length ? (
            <section>
              <p className="eyebrow">Review history</p>
              <h2>Recorded staff decisions</h2>
              <ol className="moderation-timeline">
                {events.map((event) => (
                  <li key={event.id}>
                    <strong>{event.action.replaceAll("_", " ")}</strong>
                    <span>{formatSubmissionTimestamp(event.created_at)}</span>
                    {event.review_note ? <p>{event.review_note}</p> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </article>
        <aside className="review-actions" aria-label="Submission actions">
          <p className="eyebrow">Record connections</p>
          <h2>Submission remains separate.</h2>
          {submission.matched_employer ? (
            <Link
              className="action action--outline"
              href={`/admin/employers/${submission.matched_employer.id}`}
            >
              Review matched employer
            </Link>
          ) : (
            <p>No employer record has been matched yet.</p>
          )}
          {submission.resulting_job ? (
            <Link className="action action--outline" href={`/admin/jobs/${submission.resulting_job.id}`}>
              Review resulting vacancy
            </Link>
          ) : (
            <p>No job review draft has been created yet.</p>
          )}
          <p>Review actions will be connected in the next controlled-submission batch.</p>
        </aside>
      </div>
    </main>
  );
}
