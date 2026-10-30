import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployerLogo } from "@/components/employer-logo";
import { JobCard } from "@/components/job-card";
import { SaveJobControl } from "@/components/save-job-control";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import { formatDate, listingAgeLabel } from "@/lib/jobs";
import { getPublicJobBySlug, getPublicJobs } from "@/lib/public-jobs";

type JobPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ save?: string }>;
};

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const job = await getPublicJobBySlug((await params).slug);
  if (!job) return {};

  return {
    title: job.title,
    description: job.summary,
  };
}

function structuredEmploymentType(job: { contractType?: string; hoursType?: string }) {
  const types = [
    job.hoursType === "Full time" ? "FULL_TIME" : undefined,
    job.hoursType === "Part time" ? "PART_TIME" : undefined,
    job.contractType === "Temporary" || job.contractType === "Fixed term" ? "TEMPORARY" : undefined,
    job.contractType === "Internship" ? "INTERN" : undefined,
  ].filter(Boolean);

  return types.length ? types : undefined;
}

const factIcons = {
  category: "◎",
  location: "⌖",
  salary: "£",
  type: "◷",
} as const;

export default async function JobPage({ params, searchParams }: JobPageProps) {
  const { slug } = await params;
  const [job, jobs, candidateSaveState, query] = await Promise.all([
    getPublicJobBySlug(slug),
    getPublicJobs(),
    getCandidateSaveState(),
    searchParams,
  ]);
  if (!job) notFound();
  const isSaved = Boolean(job.id && candidateSaveState.savedJobIds.includes(job.id));

  const jobType = [job.hoursType, job.contractType]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(" · ");
  const sameAreaJobs = jobs.filter(
    (candidate) =>
      candidate.slug !== job.slug && candidate.careerAreas?.some((area) => job.careerAreas?.includes(area)),
  );
  const fallbackJobs = jobs.filter(
    (candidate) =>
      candidate.slug !== job.slug && !sameAreaJobs.some((match) => match.slug === candidate.slug),
  );
  const relatedJobs = [...sameAreaJobs, ...fallbackJobs].slice(0, 3);
  const savedJobIds = new Set(candidateSaveState.savedJobIds);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [job.summary, ...job.description, ...job.responsibilities, ...job.requirements].join(" "),
    identifier: { "@type": "PropertyValue", name: "WildJobs", value: job.slug },
    datePosted: job.postedAt,
    validThrough: job.closesAt ? `${job.closesAt}T23:59:59Z` : undefined,
    employmentType: structuredEmploymentType(job),
    hiringOrganization: { "@type": "Organization", name: job.organisation },
    jobLocationType: job.locationType === "Remote" ? "TELECOMMUTE" : undefined,
    jobLocation:
      job.locationType === "Remote"
        ? undefined
        : {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressCountry: job.countryCode,
              addressLocality: job.locationLocality,
              addressRegion: job.locationRegion,
              postalCode: job.postalCode,
            },
          },
  };

  return (
    <main className="job-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />
      <div className="shell">
        <Link className="back-link" href="/">
          <span aria-hidden="true">←</span> Back to all jobs
        </Link>
      </div>
      {query.save === "saved" || query.save === "removed" || query.save === "error" ? (
        <div className="shell">
          <p
            className={`staff-form-message${query.save === "error" ? " staff-form-message--error" : ""}`}
            role={query.save === "error" ? "alert" : "status"}
          >
            {query.save === "saved"
              ? "Job saved to your private shortlist."
              : query.save === "removed"
                ? "Job removed from your shortlist."
                : "Your saved jobs could not be updated. Please try again."}
          </p>
        </div>
      ) : null}
      <header className="job-detail-hero shell">
        <div className="job-detail-hero__identity">
          <EmployerLogo
            imageClassName="job-detail-hero__logo"
            logoUrl={job.employerLogoUrl}
            monogramClassName="job-detail-hero__monogram"
            name={job.organisation}
          />
          <div className="job-detail-hero__heading">
            <p className="eyebrow">
              {job.employerSlug ? (
                <Link href={`/employers/${job.employerSlug}`}>{job.organisation}</Link>
              ) : (
                job.organisation
              )}
            </p>
            <h1>{job.title}</h1>
          </div>
        </div>
        <dl className="job-detail-key-facts">
          <div>
            <dt>
              <span aria-hidden="true">{factIcons.location}</span> Location
            </dt>
            <dd>{job.location}</dd>
          </div>
          <div>
            <dt>
              <span aria-hidden="true">{factIcons.salary}</span> Salary
            </dt>
            <dd>{job.salary}</dd>
          </div>
          <div>
            <dt>
              <span aria-hidden="true">{factIcons.type}</span> Job type
            </dt>
            <dd>{jobType || job.employmentType}</dd>
          </div>
          <div>
            <dt>
              <span aria-hidden="true">{factIcons.category}</span> Career area
            </dt>
            <dd>{job.category}</dd>
          </div>
        </dl>
      </header>

      <div className="shell job-detail-layout">
        <article className="job-detail-content">
          <section className="job-detail-summary">
            <p className="eyebrow">
              {job.summarySource === "ai" ? "AI-generated role summary" : "Role summary"}
            </p>
            <h2>About the role</h2>
            <p className="job-detail-summary__lead">{job.summary}</p>
            {job.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {job.sourceUrl ? (
              <p className="job-detail-summary__source">
                This concise summary helps you assess the role quickly. Read the original advert for the
                complete responsibilities, requirements and application instructions.
              </p>
            ) : null}
          </section>
          {job.responsibilities.length ? (
            <section>
              <h2>What you’ll do</h2>
              <ul>
                {job.responsibilities.map((responsibility) => (
                  <li key={responsibility}>{responsibility}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {job.requirements.length ? (
            <section>
              <h2>What they’re looking for</h2>
              <ul>
                {job.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="job-employer-card">
            <div className="job-employer-card__header">
              <EmployerLogo
                imageClassName="job-employer-card__logo"
                logoUrl={job.employerLogoUrl}
                monogramClassName="job-employer-card__monogram"
                name={job.organisation}
              />
              <div>
                <p className="eyebrow">Organisation</p>
                <h2>{job.organisation}</h2>
              </div>
            </div>
            {job.employerOverview.length ? (
              job.employerOverview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            ) : (
              <p>Explore this organisation’s profile and current conservation opportunities.</p>
            )}
            {job.employerOverviewIsAi ? (
              <p className="job-employer-card__ai-note">
                AI-generated organisation overview based on available public information.
              </p>
            ) : null}
            <div className="job-employer-card__links">
              {job.employerSlug ? (
                <Link className="action action--outline" href={`/employers/${job.employerSlug}`}>
                  View organisation profile <span aria-hidden="true">→</span>
                </Link>
              ) : null}
              {job.employerWebsiteUrl ? (
                <a className="text-link" href={job.employerWebsiteUrl} rel="noreferrer" target="_blank">
                  Official website <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </section>
        </article>

        <aside className="job-detail-sidebar" aria-label="Job facts">
          <div className="job-facts-card">
            <p className="eyebrow">Applications</p>
            <h2>{job.closesAt ? `Apply by ${formatDate(job.closesAt)}` : "Applications currently open"}</h2>
            <p className="job-facts-card__intro">Applications are handled on the original vacancy site.</p>
            <div className="job-detail-sidebar__actions">
              {job.applicationUrl ? (
                <a className="primary-action" href={job.applicationUrl} rel="noreferrer" target="_blank">
                  Apply now <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              <SaveJobControl
                className="save-action save-action--card"
                jobId={job.id}
                jobSlug={job.slug}
                state={candidateSaveState.isSignedIn ? (isSaved ? "saved" : "available") : "signed-out"}
              />
            </div>
            <dl>
              <div>
                <dt>Working arrangement</dt>
                <dd>{job.locationType}</dd>
              </div>
              <div>
                <dt>Opportunity</dt>
                <dd>{job.engagementType ?? "Not specified"}</dd>
              </div>
              <div>
                <dt>Posted</dt>
                <dd>{formatDate(job.postedAt)}</dd>
              </div>
              <div>
                <dt>Closes</dt>
                <dd>{job.closesAt ? formatDate(job.closesAt) : listingAgeLabel(job.postedAt)}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  {job.sourceUrl ? (
                    <a className="fact-link" href={job.sourceUrl} rel="noreferrer" target="_blank">
                      {job.sourceName} <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    job.sourceName
                  )}
                </dd>
              </div>
            </dl>
            <p className="job-facts-card__notice">
              WildJobs collected this vacancy from an approved source and checked its essential details
              against the original listing.
            </p>
            <Link className="text-link job-facts-card__other-roles" href="/">
              Explore other roles <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </div>

      <div className="job-detail-mobile-actions">
        {job.applicationUrl ? (
          <a className="primary-action" href={job.applicationUrl} rel="noreferrer" target="_blank">
            Apply now <span aria-hidden="true">↗</span>
          </a>
        ) : null}
        <SaveJobControl
          className="save-action"
          jobId={job.id}
          jobSlug={job.slug}
          state={candidateSaveState.isSignedIn ? (isSaved ? "saved" : "available") : "signed-out"}
        />
      </div>

      {relatedJobs.length ? (
        <section className="job-detail-related">
          <div className="shell">
            <div className="job-results__heading">
              <h2>Other jobs you may like</h2>
              <Link className="text-link" href="/">
                View all jobs <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="job-list">
              {relatedJobs.map((relatedJob) => (
                <JobCard
                  job={relatedJob}
                  key={relatedJob.slug}
                  saveState={
                    candidateSaveState.isSignedIn && relatedJob.id && savedJobIds.has(relatedJob.id)
                      ? "saved"
                      : candidateSaveState.isSignedIn
                        ? "available"
                        : "signed-out"
                  }
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
