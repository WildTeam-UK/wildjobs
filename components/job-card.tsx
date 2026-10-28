import Link from "next/link";
import { formatDate, type Job } from "@/lib/jobs";

export function JobCard({ job, showSaveAction = true }: { job: Job; showSaveAction?: boolean }) {
  return (
    <article className="job-card">
      <div className="job-card__topline">
        <span>{job.category}</span>
        <span>{job.locationType}</span>
      </div>
      <div className="job-card__body">
        <p className="job-card__organisation">{job.organisation}</p>
        <h2>
          <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
        </h2>
        <p className="job-card__summary">{job.summary}</p>
      </div>
      <dl className="job-card__facts">
        <div>
          <dt>Location</dt>
          <dd>{job.location}</dd>
        </div>
        <div>
          <dt>Job type</dt>
          <dd>{job.employmentType}</dd>
        </div>
        <div>
          <dt>Salary</dt>
          <dd>{job.salary}</dd>
        </div>
        <div>
          <dt>Closes</dt>
          <dd>{formatDate(job.closesAt)}</dd>
        </div>
      </dl>
      <div className="job-card__actions">
        <Link className="text-link" href={`/jobs/${job.slug}`}>
          View listing <span aria-hidden="true">→</span>
        </Link>
        {showSaveAction ? (
          <Link
            className="save-action"
            href={{ pathname: "/sign-in", query: { intent: "save", next: `/jobs/${job.slug}` } }}
          >
            <span aria-hidden="true">♡</span> Save job
          </Link>
        ) : null}
      </div>
    </article>
  );
}
