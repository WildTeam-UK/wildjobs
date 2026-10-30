import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import { SaveJobControl, type JobSaveState } from "@/components/save-job-control";
import {
  compactJobLocation,
  formatDate,
  isClosingSoon,
  isNewJob,
  listingAgeLabel,
  postedAgoLabel,
  type Job,
} from "@/lib/jobs";

function JobFactIcon({ type }: { type: "location" | "salary" | "type" }) {
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
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M16.5 6.5a4 4 0 0 0-7.5 2v3.25A5.2 5.2 0 0 1 7 16h10M7 11.5h7" />
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
    { icon: "salary", label: "Salary", value: job.salary },
    { icon: "type", label: "Contract type", value: jobType || job.employmentType },
  ] as const;
  const statusPills = [
    isNewJob(job.publishedAt ?? job.postedAt) ? { className: "new", label: "New job" } : null,
    job.closesAt && isClosingSoon(job.closesAt) ? { className: "closing", label: "Closing soon" } : null,
  ].filter((pill): pill is { className: string; label: string } => Boolean(pill));
  const postedLabel = postedAgoLabel(job.publishedAt ?? job.postedAt);
  const aiSummaryExplanation =
    "WildJobs uses AI to turn the original job information into a short summary. Always check the full listing before applying.";
  const employerLogo = (
    <EmployerLogo
      imageClassName="job-card__logo"
      logoUrl={job.employerLogoUrl}
      monogramClassName="job-card__monogram"
      name={job.organisation}
    />
  );

  return (
    <article className={`job-card${compact ? " job-card--compact" : ""}`}>
      <header className="job-card__header">
        {compact ? (
          job.availability && job.availability !== "current" ? (
            <span className="job-card__logo-anchor">{employerLogo}</span>
          ) : (
            <Link
              aria-label={`View ${displayTitle}`}
              className="job-card__logo-anchor"
              href={`/jobs/${job.slug}`}
            >
              {employerLogo}
            </Link>
          )
        ) : (
          employerLogo
        )}
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
            {!compact && job.employerSlug ? (
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
        {compact && (statusPills.length || showSaveAction) ? (
          <div className="job-card__header-actions">
            {statusPills.length ? (
              <div className="job-card__status-pills" aria-label="Job notices">
                {statusPills.map((pill) => (
                  <span
                    className={`job-card__status-pill job-card__status-pill--${pill.className}`}
                    key={pill.label}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            ) : null}
            {showSaveAction ? (
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
        <>
          <div className="job-card__summary-block">
            <p className={`job-card__summary${job.summarySource === "ai" ? " job-card__summary--ai" : ""}`}>
              {job.summary}
              {job.summarySource === "ai" ? (
                <>
                  {" "}
                  <span
                    aria-label={`This summary was provided by AI. ${aiSummaryExplanation}`}
                    className="job-card__ai-disclosure"
                    tabIndex={0}
                    title={aiSummaryExplanation}
                  >
                    This summary was provided by AI
                  </span>
                </>
              ) : null}
            </p>
          </div>
          <div className="job-card__meta-row">
            <ul className="job-card__compact-facts">
              {compactFacts.map((fact) => (
                <li key={fact.label}>
                  <JobFactIcon type={fact.icon} />
                  <span className="wt-visually-hidden">{fact.label}: </span>
                  <span>{fact.value}</span>
                </li>
              ))}
            </ul>
            <p className="job-card__posted">{postedLabel}</p>
          </div>
        </>
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
      {!compact ? (
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
      ) : null}
    </article>
  );
}
