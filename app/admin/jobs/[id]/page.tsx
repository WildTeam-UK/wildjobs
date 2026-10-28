import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  reviewJob,
  reviewRecordBySlug,
  reviewRecords,
  type PreviewJobState,
} from "@/lib/job-review-fixtures";
import { formatDate } from "@/lib/jobs";

type ReviewPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return reviewRecords.map((record) => ({ id: record.jobSlug }));
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const record = reviewRecordBySlug((await params).id);
  const job = record ? reviewJob(record) : undefined;
  return { title: job ? `Review ${job.title}` : "Review job" };
}

const previewStates: readonly Exclude<PreviewJobState, "active">[] = ["changed", "expired", "withdrawn"];

export default async function ReviewJobPage({ params }: ReviewPageProps) {
  const record = reviewRecordBySlug((await params).id);
  const job = record ? reviewJob(record) : undefined;
  if (!record || !job) notFound();

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/jobs">
          <span aria-hidden="true">←</span> Review queue
        </Link>
      </div>

      <header className="review-hero shell">
        <div>
          <span className={`status-badge status-badge--${record.status.toLowerCase().replaceAll(" ", "-")}`}>
            {record.status}
          </span>
          <p>{job.organisation}</p>
          <h1>{job.title}</h1>
        </div>
        <dl>
          <div>
            <dt>Source</dt>
            <dd>{record.source}</dd>
          </div>
          <div>
            <dt>Reference</dt>
            <dd>{record.sourceReference}</dd>
          </div>
          <div>
            <dt>Completeness</dt>
            <dd>{record.completeness}%</dd>
          </div>
        </dl>
      </header>

      <div className="shell review-layout">
        <article className="review-content">
          <section>
            <p className="eyebrow">Source record</p>
            <h2>Structured vacancy details</h2>
            <dl className="review-fields">
              <div>
                <dt>Title</dt>
                <dd>{job.title}</dd>
              </div>
              <div>
                <dt>Organisation</dt>
                <dd>{job.organisation}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {job.location} · {job.locationType}
                </dd>
              </div>
              <div>
                <dt>Employment</dt>
                <dd>{job.employmentType}</dd>
              </div>
              <div>
                <dt>Salary</dt>
                <dd>{job.salary}</dd>
              </div>
              <div>
                <dt>Closing date</dt>
                <dd>{formatDate(job.closesAt)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="eyebrow">Checks requiring attention</p>
            <h2>
              {record.issues.length ? `${record.issues.length} review points` : "No open review points"}
            </h2>
            {record.issues.length ? (
              <ul className="review-issues">
                {record.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="review-clear">All required prototype checks are complete.</p>
            )}
          </section>

          <section>
            <p className="eyebrow">Audit history</p>
            <h2>What happened to this record</h2>
            <ol className="audit-list">
              {record.audit.map((entry, index) => (
                <li key={entry}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{entry}</p>
                </li>
              ))}
            </ol>
          </section>
        </article>

        <aside className="review-actions" aria-label="Review actions">
          <p className="eyebrow">Decision</p>
          <h2>Choose the next state</h2>
          <button className="action" type="button">
            Approve for publication
          </button>
          <button className="action action--outline" type="button">
            Schedule publication
          </button>
          <button className="staff-danger-action" type="button">
            Reject record
          </button>
          <p>Design preview only. These controls do not change or publish anything.</p>

          <div className="preview-links">
            <strong>Public state previews</strong>
            <Link href={`/jobs/${job.slug}`}>Active listing</Link>
            {previewStates.map((state) => (
              <Link href={{ pathname: `/jobs/${job.slug}`, query: { state } }} key={state}>
                {state[0].toUpperCase() + state.slice(1)} listing
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
