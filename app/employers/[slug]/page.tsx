import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/job-card";
import { employerBySlug, employers, jobsForEmployer } from "@/lib/employers";
import { formatDate } from "@/lib/jobs";

type EmployerPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return employers.map((employer) => ({ slug: employer.slug }));
}

export async function generateMetadata({ params }: EmployerPageProps): Promise<Metadata> {
  const employer = employerBySlug((await params).slug);
  if (!employer) return {};

  return {
    title: employer.name,
    description: employer.mission,
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function EmployerPage({ params }: EmployerPageProps) {
  const employer = employerBySlug((await params).slug);
  if (!employer) notFound();
  const openRoles = jobsForEmployer(employer.name);

  return (
    <main className="employer-profile-page">
      <div className="shell">
        <Link className="back-link" href="/employers">
          <span aria-hidden="true">←</span> All employers
        </Link>
      </div>

      <header className="employer-profile-hero shell">
        <div className="employer-profile-hero__identity">
          <div className="employer-profile-monogram" aria-hidden="true">
            {employer.shortName}
          </div>
          <div>
            <p className="eyebrow">{employer.focus}</p>
            <h1>{employer.name}</h1>
          </div>
        </div>
        <p className="employer-profile-hero__mission">{employer.mission}</p>
      </header>

      <aside className="fixture-notice">
        <div className="shell">
          <strong>Design prototype:</strong> This organisation and its information are fictional.
        </div>
      </aside>

      <div className="shell employer-profile-layout">
        <article className="employer-profile-content">
          <section>
            <p className="eyebrow">About the organisation</p>
            <h2>Working together for lasting conservation outcomes.</h2>
            {employer.overview.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
          <section>
            <p className="eyebrow">Working here</p>
            <h2>Culture and benefits</h2>
            <p>{employer.culture}</p>
            <ul className="benefit-list">
              {employer.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </section>
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
              <dd>{employer.locations.join(", ")}</dd>
            </div>
            <div>
              <dt>Open roles</dt>
              <dd>{openRoles.length}</dd>
            </div>
            <div>
              <dt>Profile reviewed</dt>
              <dd>{formatDate(employer.reviewedAt)}</dd>
            </div>
          </dl>
          <p className="employer-profile-facts__source">
            Prototype information created by WildJobs for design evaluation. No employer has supplied or
            approved this content.
          </p>
        </aside>
      </div>

      <section className="employer-profile-jobs">
        <div className="shell">
          <div className="job-results__heading">
            <h2>Current opportunities</h2>
            <p>
              {openRoles.length} demonstration {openRoles.length === 1 ? "role" : "roles"}
            </p>
          </div>
          <div className="job-list">
            {openRoles.map((job) => (
              <JobCard job={job} key={job.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
