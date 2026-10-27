import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, jobBySlug, jobs } from "@/lib/jobs";

type JobPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return jobs.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const job = jobBySlug((await params).slug);
  if (!job) return {};

  return {
    title: job.title,
    description: job.summary,
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function JobPage({ params }: JobPageProps) {
  const job = jobBySlug((await params).slug);
  if (!job) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [...job.description, ...job.responsibilities, ...job.requirements].join(" "),
    identifier: { "@type": "PropertyValue", name: "WildJobs fixture", value: job.slug },
    datePosted: job.postedAt,
    validThrough: `${job.closesAt}T23:59:59Z`,
    employmentType: job.employmentType.toUpperCase().replaceAll(" ", "_"),
    hiringOrganization: { "@type": "Organization", name: job.organisation },
    jobLocationType: job.locationType === "Remote" ? "TELECOMMUTE" : undefined,
    jobLocation:
      job.locationType === "Remote"
        ? undefined
        : {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "GB" },
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
      <header className="job-detail-hero shell">
        <div className="job-detail-hero__labels">
          <span>{job.category}</span>
          <span>{job.locationType}</span>
        </div>
        <p>{job.organisation}</p>
        <h1>{job.title}</h1>
        <p className="job-detail-hero__summary">{job.summary}</p>
      </header>

      <div className="shell job-detail-layout">
        <article className="job-detail-content">
          <section>
            <h2>About this demonstration role</h2>
            {job.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
          <section>
            <h2>What the role could involve</h2>
            <ul>
              {job.responsibilities.map((responsibility) => (
                <li key={responsibility}>{responsibility}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2>What the example employer could look for</h2>
            <ul>
              {job.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="job-detail-sidebar" aria-label="Job facts">
          <div className="job-facts-card">
            <p className="eyebrow">Job overview</p>
            <dl>
              <div>
                <dt>Organisation</dt>
                <dd>{job.organisation}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{job.location}</dd>
              </div>
              <div>
                <dt>Working pattern</dt>
                <dd>{job.locationType}</dd>
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
                <dt>Posted</dt>
                <dd>{formatDate(job.postedAt)}</dd>
              </div>
              <div>
                <dt>Closes</dt>
                <dd>{formatDate(job.closesAt)}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{job.sourceName}</dd>
              </div>
            </dl>
            <p className="job-facts-card__notice">
              This is fictional prototype content. Applications are not available.
            </p>
            <Link className="primary-action" href="/">
              Explore other roles
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
