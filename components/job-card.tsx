import Link from "next/link";
import type { CSSProperties } from "react";
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
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M6 8.5H5.5v.5M18 8.5h.5v.5M6 15.5H5.5V15M18 15.5h.5V15" />
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
  const trainingExplanation =
    "These recommendations connect capabilities used in this job with skills taught in WildTeam courses. A course is not necessarily required and does not guarantee eligibility.";
  const employerLogo = (
    <EmployerLogo
      imageClassName="job-card__logo"
      logoUrl={job.employerLogoUrl}
      monogramClassName="job-card__monogram"
      name={job.organisation}
    />
  );
  const aiSummaryLabel =
    job.summarySource === "ai" ? (
      <span className="job-card__ai-summary-label">
        <span>AI summary</span>
      </span>
    ) : null;
  const aiSummaryDisclaimer =
    job.summarySource === "ai" ? (
      <p className="job-card__ai-note">
        <span className="job-card__ai-disclosure">This summary was provided by AI</span>{" "}
        <span className="job-card__ai-tooltip-anchor">
          <button
            aria-describedby={`ai-summary-tooltip-${job.slug}`}
            aria-label="How WildJobs uses AI summaries"
            className="job-card__ai-tooltip-trigger"
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8" />
              <path d="M10 8.5v5M10 6.25h.01" />
            </svg>
          </button>
          <span className="job-card__ai-tooltip" id={`ai-summary-tooltip-${job.slug}`} role="tooltip">
            {aiSummaryExplanation}
          </span>
        </span>
      </p>
    ) : null;

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
              <div className="job-card__status-pills job-card__status-pills--header" aria-label="Job notices">
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
          {aiSummaryLabel}
          <p className="job-card__summary">{job.summary}</p>
          {aiSummaryDisclaimer}
        </div>
      ) : null}
      {compact ? (
        <>
          <div className="job-card__summary-block">
            {aiSummaryLabel}
            <p className="job-card__summary">{job.summary}</p>
            {aiSummaryDisclaimer}
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
            <p className="job-card__posted job-card__posted--desktop">{postedLabel}</p>
          </div>
          <div className="job-card__mobile-footer">
            {statusPills.length ? (
              <div className="job-card__notice-carousel" aria-label="Job notices">
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
            <p className="job-card__posted job-card__posted--mobile">{postedLabel}</p>
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
      {job.relatedCourses?.length ? (
        <div className="job-card__training">
          <ul aria-label="Relevant WildTeam training courses" className="job-card__training-courses">
            {job.relatedCourses.map((course) => (
              <li key={course.slug}>
                <span
                  className="job-card__training-pill"
                  style={{ "--course-colour": course.themeColour } as CSSProperties}
                >
                  {course.shortTitle}
                </span>
              </li>
            ))}
          </ul>
          <span className="job-card__ai-tooltip-anchor job-card__training-why">
            <button
              aria-describedby={`training-tooltip-${job.slug}`}
              className="job-card__ai-tooltip-trigger job-card__training-explainer"
              type="button"
            >
              Why are we recommending these courses?
            </button>
            <span className="job-card__ai-tooltip" id={`training-tooltip-${job.slug}`} role="tooltip">
              {trainingExplanation}
            </span>
          </span>
        </div>
      ) : null}
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
