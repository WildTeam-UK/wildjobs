import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import { SaveJobControl, type JobSaveState } from "@/components/save-job-control";
import { formatDate, listingAgeLabel, type Job } from "@/lib/jobs";

export function JobCard({
  compact = false,
  job,
  saveReturnTo,
  saveState = "signed-out",
  showSaveAction = true,
}: {
  compact?: boolean;
  job: Job;
  saveReturnTo?: string;
  saveState?: JobSaveState;
  showSaveAction?: boolean;
}) {
  const jobType = [job.hoursType, job.contractType]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(" · ");
  const employerSuffix = ` with ${job.organisation}`;
  const displayTitle =
    compact && job.title.toLocaleLowerCase("en-GB").endsWith(employerSuffix.toLocaleLowerCase("en-GB"))
      ? job.title.slice(0, -employerSuffix.length)
      : job.title;
  const compactFacts = [
    { icon: "⌖", label: "Location", value: job.location },
    { icon: "▣", label: "Job type", value: jobType || job.employmentType },
    { icon: "£", label: "Salary", value: job.salary },
    {
      icon: "◷",
      label: "Closes",
      value: job.closesAt ? formatDate(job.closesAt) : listingAgeLabel(job.postedAt),
    },
  ] as const;

  return (
    <article className={`job-card${compact ? " job-card--compact" : ""}`}>
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
          {!compact ? (
            <div className="job-card__topline">
              <span>{job.category}</span>
              {job.engagementType ? <span>{job.engagementType}</span> : null}
              <span>{job.locationType}</span>
            </div>
          ) : null}
        </div>
        {compact && showSaveAction ? (
          <div className="job-card__save">
            <SaveJobControl
              className="save-action save-action--icon"
              iconOnly
              jobId={job.id}
              jobSlug={job.slug}
              returnTo={saveReturnTo}
              state={saveState}
            />
          </div>
        ) : null}
      </header>
      <div className="job-card__body">
        <h2>
          {job.availability && job.availability !== "current" ? (
            displayTitle
          ) : (
            <Link href={`/jobs/${job.slug}`}>{displayTitle}</Link>
          )}
        </h2>
        {!compact && job.summarySource === "ai" ? (
          <p className="ai-summary-label">AI-generated summary</p>
        ) : null}
        {!compact ? <p className="job-card__summary">{job.summary}</p> : null}
      </div>
      {compact ? (
        <dl className="job-card__facts job-card__facts--icons">
          {compactFacts.map((fact) => (
            <div key={fact.label}>
              <dt>
                <span aria-hidden="true">{fact.icon}</span>
                <span className="wt-visually-hidden">{fact.label}</span>
              </dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
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
      )}
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
        {showSaveAction && !compact ? (
          <SaveJobControl jobId={job.id} jobSlug={job.slug} returnTo={saveReturnTo} state={saveState} />
        ) : null}
      </div>
    </article>
  );
}
