import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import { SaveJobControl, type JobSaveState } from "@/components/save-job-control";
import { compactJobLocation, formatDate, listingAgeLabel, type Job } from "@/lib/jobs";

function JobFactIcon({ type }: { type: "location" | "salary" | "time" | "type" }) {
  if (type === "location") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }
  if (type === "type") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect height="13" rx="2" width="18" x="3" y="7" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
      </svg>
    );
  }
  if (type === "salary") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M16.5 6.5a4 4 0 0 0-7.5 2v3.25A5.2 5.2 0 0 1 7 16h10M7 11.5h7" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

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
    { icon: "location", label: "Location", value: compactJobLocation(job) },
    { icon: "type", label: "Job type", value: jobType || job.employmentType },
    { icon: "salary", label: "Salary", value: job.salary },
    {
      icon: "time",
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
          {compact ? (
            <h2>
              {job.availability && job.availability !== "current" ? (
                displayTitle
              ) : (
                <Link href={`/jobs/${job.slug}`}>{displayTitle}</Link>
              )}
            </h2>
          ) : null}
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
      {!compact ? (
        <div className="job-card__body">
          <h2>
            {job.availability && job.availability !== "current" ? (
              displayTitle
            ) : (
              <Link href={`/jobs/${job.slug}`}>{displayTitle}</Link>
            )}
          </h2>
          {job.summarySource === "ai" ? <p className="ai-summary-label">AI-generated summary</p> : null}
          <p className="job-card__summary">{job.summary}</p>
        </div>
      ) : null}
      {compact ? (
        <dl className="job-card__facts job-card__facts--icons">
          {compactFacts.map((fact) => (
            <div key={fact.label}>
              <dt>
                <JobFactIcon type={fact.icon} />
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
