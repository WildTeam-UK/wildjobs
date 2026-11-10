import Link from "next/link";
import { ShareJobControl } from "@/components/share-job-control";
import { DismissJobControl } from "@/components/dismiss-job-control";
import type { CSSProperties } from "react";
import { EmployerLogo } from "@/components/employer-logo";
import { JobActionTooltip } from "@/components/job-action-tooltip";
import { SaveJobControl, type JobSaveState } from "@/components/save-job-control";
import { formatSalaryLabel } from "@/lib/job-salary";
import {
  compactJobLocation,
  formatDate,
  isClosingSoon,
  isNewJob,
  listingAgeLabel,
  postedAgoLabel,
  type Job,
} from "@/lib/jobs";

export function JobFactIcon({ type }: { type: "location" | "salary" | "type" }) {
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
  detailPanel = false,
  headingLevel,
  onDismiss,
  job,
  sample = false,
  saveReturnTo,
  saveState = "signed-out",
  showSaveAction = !sample,
}: {
  compact?: boolean;
  detailPanel?: boolean;
  headingLevel?: 2 | 3;
  onDismiss?: () => void;
  job: Job;
  sample?: boolean;
  saveReturnTo?: string;
  saveState?: JobSaveState;
  showSaveAction?: boolean;
}) {
  const jobType = [job.hoursType, job.contractType]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(" · ");
  const observedAt = job.observedAt ? new Date(job.observedAt) : new Date();
  const employerSuffix = ` with ${job.organisation}`;
  const displayTitle =
    compact && job.title.toLocaleLowerCase("en-GB").endsWith(employerSuffix.toLocaleLowerCase("en-GB"))
      ? job.title.slice(0, -employerSuffix.length)
      : job.title;
  const canView = !sample && (!job.availability || job.availability === "current");
  const JobTitle = (headingLevel ?? (sample ? 3 : 2)) === 3 ? "h3" : "h2";
  const compactFacts = [
    { icon: "location", label: "Location", value: compactJobLocation(job) },
    { icon: "salary", label: "Salary", value: formatSalaryLabel(job.salary) },
    { icon: "type", label: "Workplace", value: job.locationType },
  ] as const;
  const statusPills = (
    sample
      ? []
      : [
          isNewJob(job.publishedAt ?? job.postedAt, observedAt)
            ? { className: "new", label: "New job" }
            : null,
          job.closesAt && isClosingSoon(job.closesAt, observedAt)
            ? { className: "closing", label: "Closing soon" }
            : null,
        ]
  ).filter((pill): pill is { className: string; label: string } => Boolean(pill));
  const postedLabel = sample ? null : postedAgoLabel(job.publishedAt ?? job.postedAt, observedAt);
  const hasRelatedCourses = Boolean(job.relatedCourses?.length);
  const sourceLinkAttributes = job.sourceUrl ? { target: "_blank", rel: "noopener noreferrer" } : {};
  const title = (
    <JobTitle className="job-card__title">
      {canView ? (
        <Link href={job.sourceUrl ?? "/"} {...sourceLinkAttributes}>
          {displayTitle}
        </Link>
      ) : (
        displayTitle
      )}
    </JobTitle>
  );
  const employerLogo = (
    <EmployerLogo
      imageClassName="job-card__logo"
      logoUrl={job.employerLogoUrl}
      monogramClassName="job-card__monogram"
      name={job.organisation}
    />
  );
  const hasSummaryLabel = sample || job.summarySource === "ai";
  const SummaryLabel = JobTitle === "h3" ? "p" : "h3";
  const summaryLabel = hasSummaryLabel ? (
    <SummaryLabel className="job-card__ai-summary-label">
      <span>Role summary</span>
    </SummaryLabel>
  ) : null;
  const summaryBlock = (
    <div className={`job-card__summary-block${hasSummaryLabel ? " job-card__summary-block--ai" : ""}`}>
      {summaryLabel}
      <p className="job-card__summary">{job.summary}</p>
      {(detailPanel || compact) && job.skills?.length ? (
        <p className="job-card__attributes">
          <strong>Skills:</strong> {job.skills.map(({ title }) => title).join(" · ")}
        </p>
      ) : null}
      {(detailPanel || compact) && job.benefits?.length ? (
        <p className="job-card__attributes">
          <strong>Advertised benefits:</strong> {job.benefits.map(({ title }) => title).join(" · ")}
        </p>
      ) : null}
    </div>
  );

  return (
    <article className={`job-card${compact ? " job-card--compact" : ""}${sample ? " job-card--sample" : ""}`}>
      <header className="job-card__header">
        {detailPanel ? (
          <div className="job-card__employer-profile">{employerLogo}</div>
        ) : compact ? (
          !canView ? (
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
          {compact ? title : null}
          <p className="job-card__organisation">
            {job.employerProfileSlug ? (
              <Link href={`/employers/${job.employerProfileSlug}`}>{job.organisation}</Link>
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
        {compact && (statusPills.length || showSaveAction || onDismiss || job.sourceUrl) ? (
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
            {job.sourceUrl ? (
              <ShareJobControl title={`${displayTitle} at ${job.organisation}`} url={job.sourceUrl} />
            ) : null}
            {onDismiss ? <DismissJobControl onClick={onDismiss} title={displayTitle} /> : null}
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
          {title}
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
                  <span className="icon-label">{fact.value}</span>
                </li>
              ))}
            </ul>
            {postedLabel && !hasRelatedCourses && !detailPanel ? (
              <p className="job-card__posted">{postedLabel}</p>
            ) : null}
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
            <dd>{formatSalaryLabel(job.salary)}</dd>
          </div>
          <div>
            <dt>Closes</dt>
            <dd>{job.closesAt ? formatDate(job.closesAt) : listingAgeLabel(job.postedAt, observedAt)}</dd>
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
                    <span className="icon-label">{course.shortTitle}</span>
                  </a>
                </li>
              ))}
            </ul>
            <JobActionTooltip label="These courses relate to skills and responsibilities in this advert. Read how WildJobs recommends training.">
              <Link
                className="job-card__training-why job-card__training-explainer job-filter-pill--fancy"
                href="/course-recommendations/"
              >
                <span className="job-filter-pill__value icon-label">Recommended courses</span>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16v.5" />
                </svg>
              </Link>
            </JobActionTooltip>
          </div>
          {postedLabel && compact && !detailPanel ? <p className="job-card__posted">{postedLabel}</p> : null}
        </div>
      ) : null}
      {!compact ? (
        <div className="job-card__actions">
          {job.availability && job.availability !== "current" ? (
            <span className="job-card__unavailable">
              {job.availability === "expired" ? "Applications closed" : "No longer available"}
            </span>
          ) : canView ? (
            <Link className="action" href={job.sourceUrl ?? "/"} {...sourceLinkAttributes}>
              View job
            </Link>
          ) : null}
          {showSaveAction && !compact ? (
            <SaveJobControl jobId={job.id} jobSlug={job.slug} returnTo={saveReturnTo} state={saveState} />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
