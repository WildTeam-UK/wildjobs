import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import { SaveJobControl, type JobSaveState } from "@/components/save-job-control";
import { formatDate, listingAgeLabel, type Job } from "@/lib/jobs";

export function JobCard({
  job,
  saveReturnTo,
  saveState = "signed-out",
  showSaveAction = true,
}: {
  job: Job;
  saveReturnTo?: string;
  saveState?: JobSaveState;
  showSaveAction?: boolean;
}) {
  const jobType = [job.hoursType, job.contractType]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(" · ");

  return (
    <article className="job-card">
      <header className="job-card__header">
        <EmployerLogo
          imageClassName="job-card__logo"
          logoUrl={job.employerLogoUrl}
          monogramClassName="job-card__monogram"
          name={job.organisation}
        />
        <div className="job-card__identity">
          <p className="job-card__organisation">
            {job.employerSlug ? (
              <Link href={`/employers/${job.employerSlug}`}>{job.organisation}</Link>
            ) : (
              job.organisation
            )}
          </p>
          <div className="job-card__topline">
            <span>{job.category}</span>
            {job.engagementType ? <span>{job.engagementType}</span> : null}
            <span>{job.locationType}</span>
          </div>
        </div>
      </header>
      <div className="job-card__body">
        <h2>
          {job.availability && job.availability !== "current" ? (
            job.title
          ) : (
            <Link href={`/jobs/${job.slug}`}>{job.title}</Link>
          )}
        </h2>
        {job.summarySource === "ai" ? <p className="ai-summary-label">AI-generated summary</p> : null}
        <p className="job-card__summary">{job.summary}</p>
      </div>
      <dl className="job-card__facts">
        <div>
          <dt>Location</dt>
          <dd>{job.location}</dd>
        </div>
        <div>
          <dt>Job type</dt>
          <dd>{jobType || job.employmentType}</dd>
        </div>
        <div>
          <dt>Salary</dt>
          <dd>{job.salary}</dd>
        </div>
        <div>
          <dt>Closes</dt>
          <dd>{job.closesAt ? formatDate(job.closesAt) : listingAgeLabel(job.postedAt)}</dd>
        </div>
      </dl>
      <div className="job-card__actions">
        {job.availability && job.availability !== "current" ? (
          <span className="job-card__unavailable">
            {job.availability === "expired" ? "Applications closed" : "No longer available"}
          </span>
        ) : (
          <Link className="action" href={`/jobs/${job.slug}`}>
            View job <span aria-hidden="true">→</span>
          </Link>
        )}
        {showSaveAction ? (
          <SaveJobControl jobId={job.id} jobSlug={job.slug} returnTo={saveReturnTo} state={saveState} />
        ) : null}
      </div>
    </article>
  );
}
