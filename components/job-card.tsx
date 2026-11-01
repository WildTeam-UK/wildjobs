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
    { icon: "type", label: "Workplace", value: job.locationType },
  ] as const;
  const statusPills = [
    isNewJob(job.publishedAt ?? job.postedAt) ? { className: "new", label: "New job" } : null,
    job.closesAt && isClosingSoon(job.closesAt) ? { className: "closing", label: "Closing soon" } : null,
  ].filter((pill): pill is { className: string; label: string } => Boolean(pill));
  const postedLabel = postedAgoLabel(job.publishedAt ?? job.postedAt);
  const hasRelatedCourses = Boolean(job.relatedCourses?.length);
  const sourceLinkAttributes = job.sourceUrl ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const trainingExplanation =
    "These recommendations match the work described in the feed with skills taught in WildTeam courses. A course is not necessarily required and does not guarantee eligibility.";
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
      <h3 className="job-card__ai-summary-label">
        <span>AI summary</span>
      </h3>
    ) : null;
  const summaryBlock = (
    <div
      className={`job-card__summary-block${job.summarySource === "ai" ? " job-card__summary-block--ai" : ""}`}
    >
      {aiSummaryLabel}
      <p className="job-card__summary">{job.summary}</p>
    </div>
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
              href={job.sourceUrl ?? "/"}
              {...sourceLinkAttributes}
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
                <Link href={job.sourceUrl ?? "/"} {...sourceLinkAttributes}>
                  {displayTitle}
                </Link>
              )}
            </h2>
          ) : null}
          <p className="job-card__organisation">{job.organisation}</p>
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
              <Link href={job.sourceUrl ?? "/"} {...sourceLinkAttributes}>
                {displayTitle}
              </Link>
            )}
          </h2>
          {summaryBlock}
        </div>
      ) : null}
      {compact ? (
        <>
          {summaryBlock}
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
            {!hasRelatedCourses ? <p className="job-card__posted">{postedLabel}</p> : null}
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
      {hasRelatedCourses ? (
        <div className="job-card__training-row">
          <div className="job-card__training">
            <ul aria-label="Relevant WildTeam training courses" className="job-card__training-courses">
              {job.relatedCourses?.map((course) => (
                <li key={course.slug}>
                  <a
                    className="job-card__training-pill"
                    href={course.trainingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ "--course-colour": course.themeColour } as CSSProperties}
                  >
                    {course.shortTitle}
                  </a>
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
          {compact ? <p className="job-card__posted">{postedLabel}</p> : null}
        </div>
      ) : null}
      {!compact ? (
        <div className="job-card__actions">
          {job.availability && job.availability !== "current" ? (
            <span className="job-card__unavailable">
              {job.availability === "expired" ? "Applications closed" : "No longer available"}
            </span>
          ) : (
            <Link className="action" href={job.sourceUrl ?? "/"} {...sourceLinkAttributes}>
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
