import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/job-card";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import { formatDate } from "@/lib/jobs";
import { getPublicEmployerBySlug } from "@/lib/public-employers";

type EmployerPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EmployerPageProps): Promise<Metadata> {
  const employer = await getPublicEmployerBySlug((await params).slug);
  if (!employer) return {};

  return {
    title: employer.name,
    description: employer.mission,
  };
}

export default async function EmployerPage({ params }: EmployerPageProps) {
  const { slug } = await params;
  const [employer, candidateSaveState] = await Promise.all([
    getPublicEmployerBySlug(slug),
    getCandidateSaveState(),
  ]);
  if (!employer) notFound();
  const openRoles = employer.openRoles;
  const savedJobIds = new Set(candidateSaveState.savedJobIds);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: employer.name,
    description: employer.mission,
    url: employer.websiteUrl,
  };

  return (
    <main className="employer-profile-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />
      <div className="shell">
        <Link className="back-link" href="/employers">
          <span aria-hidden="true">←</span> All employers
        </Link>
      </div>

      <header className="employer-profile-hero shell">
        <div className="employer-profile-hero__identity">
          {employer.logoUrl ? (
            <div className="employer-profile-logo">
              <img alt={`${employer.name} logo`} src={employer.logoUrl} />
            </div>
          ) : (
            <div className="employer-profile-monogram" aria-hidden="true">
              {employer.shortName}
            </div>
          )}
          <div>
            <p className="eyebrow">{employer.focus}</p>
            <h1>{employer.name}</h1>
          </div>
        </div>
        <p className="employer-profile-hero__mission">{employer.mission}</p>
      </header>

      <div className="shell employer-profile-layout">
        <article className="employer-profile-content">
          <section>
            <p className="eyebrow">About the organisation</p>
            <h2>About {employer.name}</h2>
            {employer.overview.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
          {employer.culture || employer.benefits.length ? (
            <section>
              <p className="eyebrow">Working here</p>
              <h2>Culture and benefits</h2>
              {employer.culture ? <p>{employer.culture}</p> : null}
              {employer.benefits.length ? (
                <ul className="benefit-list">
                  {employer.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}
        </article>

        <aside className="employer-profile-facts" aria-label="Organisation facts">
          <p className="eyebrow">Organisation overview</p>
          <dl>
            <div>
              <dt>Conservation focus</dt>
              <dd>{employer.focus}</dd>
            </div>
            <div>
              <dt>Operating locations</dt>
              <dd>{employer.locations.length ? employer.locations.join(", ") : "See current vacancies"}</dd>
            </div>
            <div>
              <dt>Open roles</dt>
              <dd>{openRoles.length}</dd>
            </div>
            <div>
              <dt>Profile reviewed</dt>
              <dd>{employer.reviewedAt ? formatDate(employer.reviewedAt) : "Review in progress"}</dd>
            </div>
            {employer.websiteUrl ? (
              <div>
                <dt>Official website</dt>
                <dd>
                  <a className="fact-link" href={employer.websiteUrl} rel="noreferrer" target="_blank">
                    Visit organisation <span aria-hidden="true">↗</span>
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="employer-profile-facts__source">
            Profile context reviewed by WildJobs against the organisation’s official information. Vacancy
            details remain attributed to their original listing.
          </p>
        </aside>
      </div>

      <section className="employer-profile-jobs">
        <div className="shell">
          <div className="job-results__heading">
            <h2>Current opportunities</h2>
            <p>
              {openRoles.length} current {openRoles.length === 1 ? "role" : "roles"}
            </p>
          </div>
          {openRoles.length ? (
            <div className="job-list">
              {openRoles.map((job) => (
                <JobCard
                  job={job}
                  key={job.slug}
                  saveState={
                    candidateSaveState.isSignedIn && job.id && savedJobIds.has(job.id)
                      ? "saved"
                      : candidateSaveState.isSignedIn
                        ? "available"
                        : "signed-out"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="staff-empty-state">
              <h2>No current vacancies</h2>
              <p>This employer has no live WildJobs listings at the moment.</p>
              <Link className="action action--outline" href="/jobs">
                Explore other roles
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
