import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveJobControl } from "@/components/save-job-control";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import { formatDate, listingAgeLabel } from "@/lib/jobs";
import { getPublicJobBySlug } from "@/lib/public-jobs";

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

export default async function JobPage({ params, searchParams }: JobPageProps) {
  const { slug } = await params;
  const [job, candidateSaveState, query] = await Promise.all([
    getPublicJobBySlug(slug),
    getCandidateSaveState(),
    searchParams,
  ]);
  if (!job) notFound();
  const isSaved = Boolean(job.id && candidateSaveState.savedJobIds.includes(job.id));

  const jobType = [job.hoursType, job.contractType]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(" · ");
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
              addressLocality: job.location,
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
        <Link className="back-link" href="/jobs">
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
        <div className="job-detail-hero__labels">
          <span>{job.category}</span>
          <span>{job.locationType}</span>
        </div>
        <p>
          {job.employerSlug ? (
            <Link href={`/employers/${job.employerSlug}`}>{job.organisation}</Link>
          ) : (
            job.organisation
          )}
        </p>
        <h1>{job.title}</h1>
        {job.summarySource === "ai" ? <p className="ai-summary-label">AI-generated summary</p> : null}
        <p className="job-detail-hero__summary">{job.summary}</p>
      </header>

      <div className="shell job-detail-layout">
        <article className="job-detail-content">
          {job.description.length ? (
            <section>
              <h2>About this role</h2>
              {job.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ) : null}
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
        </article>

        <aside className="job-detail-sidebar" aria-label="Job facts">
          <div className="job-facts-card">
            <p className="eyebrow">Job overview</p>
            <dl>
              <div>
                <dt>Organisation</dt>
                <dd>
                  {job.employerSlug ? (
                    <Link className="fact-link" href={`/employers/${job.employerSlug}`}>
                      {job.organisation}
                    </Link>
                  ) : (
                    job.organisation
                  )}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{job.location}</dd>
              </div>
              <div>
                <dt>Workplace</dt>
                <dd>{job.locationType}</dd>
              </div>
              <div>
                <dt>Opportunity</dt>
                <dd>{job.engagementType ?? "Not specified"}</dd>
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
                <dt>Added</dt>
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
              WildJobs has reviewed this listing against the original vacancy. Applications are handled on the
              linked application site.
            </p>
            {job.applicationUrl ? (
              <a className="primary-action" href={job.applicationUrl} rel="noreferrer" target="_blank">
                {job.applicationLabel ?? "Open application page"} <span aria-hidden="true">↗</span>
              </a>
            ) : null}
            <SaveJobControl
              className="save-action save-action--card"
              jobId={job.id}
              jobSlug={job.slug}
              state={candidateSaveState.isSignedIn ? (isSaved ? "saved" : "available") : "signed-out"}
            />
            <Link className="text-link job-facts-card__other-roles" href="/jobs">
              Explore other roles <span aria-hidden="true">→</span>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
