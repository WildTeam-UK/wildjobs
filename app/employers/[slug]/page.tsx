import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployerLogo } from "@/components/employer-logo";
import { JobCard } from "@/components/job-card";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import { formatDate } from "@/lib/jobs";
import { getPublicEmployerBySlug } from "@/lib/public-employers";

type EmployerPageProps = {
  params: Promise<{ slug: string }>;
};

function ProfileSpark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M15 3c.7 6.4 3.6 9.3 10 10-6.4.7-9.3 3.6-10 10-.7-6.4-3.6-9.3-10-10 6.4-.7 9.3-3.6 10-10Z" />
      <path d="M25.5 21c.3 2.8 1.7 4.2 4.5 4.5-2.8.3-4.2 1.7-4.5 4.5-.3-2.8-1.7-4.2-4.5-4.5 2.8-.3 4.2-1.7 4.5-4.5Z" />
    </svg>
  );
}

function unique(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))];
}

export async function generateMetadata({ params }: EmployerPageProps): Promise<Metadata> {
  const employer = await getPublicEmployerBySlug((await params).slug);
  if (!employer) return {};

  return {
    title: employer.name,
    description: employer.overview[0] ?? employer.mission,
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
  const profileIsReviewed = employer.profileStatus === "reviewed";
  const profileIsAiAssisted = employer.profileStatus === "ai-assisted";
  const heroSummary = employer.overview[0] ?? employer.mission;
  const workAreas = unique([employer.focus, ...employer.roleCareerAreas, ...employer.roleCategories]).slice(
    0,
    10,
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: employer.name,
    description: heroSummary,
    url: employer.websiteUrl,
  };

  return (
    <main className="employer-profile-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />

      <header className="employer-profile-hero">
        <div className="shell">
          <Link className="back-link employer-profile-hero__back" href="/employers">
            <span aria-hidden="true">←</span> All employers
          </Link>
          <div className="employer-profile-hero__layout">
            <div className="employer-profile-hero__logo-wrap">
              <EmployerLogo
                imageClassName="employer-profile-logo"
                logoUrl={employer.logoUrl}
                minimumPixels={128}
                monogramClassName="employer-profile-monogram"
                name={employer.name}
              />
            </div>
            <div className="employer-profile-hero__identity">
              <div className="employer-profile-hero__labels">
                {openRoles.length ? <span>Hiring now</span> : <span>Employer profile</span>}
                {profileIsReviewed ? <span>WildJobs reviewed</span> : null}
                {profileIsAiAssisted ? <span>AI-assisted profile</span> : null}
              </div>
              <h1>{employer.name}</h1>
              <p className="employer-profile-hero__summary">{heroSummary}</p>
              <div className="employer-profile-hero__actions">
                {openRoles.length ? (
                  <a className="primary-action" href="#current-opportunities">
                    View {openRoles.length} current {openRoles.length === 1 ? "role" : "roles"}
                  </a>
                ) : (
                  <Link className="primary-action" href="/">
                    Browse current jobs
                  </Link>
                )}
                {employer.websiteUrl ? (
                  <a
                    className="action action--outline"
                    href={employer.websiteUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Official website <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          <dl className="employer-profile-stats">
            <div>
              <dt>Live opportunities</dt>
              <dd>{openRoles.length}</dd>
            </div>
            <div>
              <dt>Operating locations</dt>
              <dd>{employer.locations.length || "Gathering"}</dd>
            </div>
            <div>
              <dt>Career areas</dt>
              <dd>{employer.roleCareerAreas.length || employer.roleCategories.length || "Gathering"}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className="employer-profile-provenance" aria-labelledby="profile-provenance-title">
        <div className="shell">
          <div className="employer-profile-provenance__card">
            <span className="employer-profile-provenance__icon">
              <ProfileSpark />
            </span>
            <div>
              <p className="eyebrow">Profile transparency</p>
              <h2 id="profile-provenance-title">
                {profileIsReviewed
                  ? "This organisation profile has been reviewed by WildJobs."
                  : profileIsAiAssisted
                    ? "This is an AI-assisted organisation profile."
                    : "This organisation profile is still being developed."}
              </h2>
              <p>
                {profileIsReviewed
                  ? "We have checked the profile context against available organisation information. Current vacancies remain the employer’s own listing."
                  : profileIsAiAssisted
                    ? "WildJobs used public organisation pages and vacancy information to organise the overview and facts below. They are clearly separated from the employer’s original vacancy wording, which WildJobs does not rewrite."
                    : "Only confirmed listing information is shown. WildJobs will add clearly labelled enrichment when reliable public sources are available."}
              </p>
              {profileIsAiAssisted && employer.aiSummarySourceUrl ? (
                <a href={employer.aiSummarySourceUrl} rel="noreferrer" target="_blank">
                  View a supporting public source <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="shell employer-profile-layout">
        <article className="employer-profile-content">
          <section className="employer-profile-about">
            <p className="eyebrow">About the organisation</p>
            <h2>What {employer.name} does</h2>
            {employer.overview.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {!employer.overview.length ? (
              <p>More information about this organisation is still being gathered.</p>
            ) : null}
            {employer.mission !== heroSummary ? (
              <blockquote className="employer-profile-mission">
                <span>
                  {profileIsReviewed ? "Organisation mission" : "Mission identified in public sources"}
                </span>
                <p>“{employer.mission}”</p>
              </blockquote>
            ) : null}
          </section>

          {workAreas.length || employer.roleCapabilities.length ? (
            <section className="employer-profile-work">
              <p className="eyebrow">Their work</p>
              <h2>Conservation focus and capabilities</h2>
              <p>
                These themes are drawn from the organisation profile and its current WildJobs vacancies. They
                help connect similar roles without changing the original adverts.
              </p>
              {workAreas.length ? (
                <div className="employer-profile-topic-group">
                  <h3>Areas of work</h3>
                  <ul className="employer-profile-tags">
                    {workAreas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {employer.roleCapabilities.length ? (
                <div className="employer-profile-topic-group">
                  <h3>Capabilities appearing in current roles</h3>
                  <ul className="employer-profile-tags employer-profile-tags--purple">
                    {employer.roleCapabilities.slice(0, 12).map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {employer.culture || employer.benefits.length ? (
            <section className="employer-profile-working">
              <p className="eyebrow">Working here</p>
              <h2>Culture and benefits</h2>
              {employer.culture ? <p>{employer.culture}</p> : null}
              {employer.benefits.length ? (
                <ul className="benefit-list">
                  {employer.benefits.map((benefit) => (
                    <li key={benefit}>
                      <span aria-hidden="true">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              ) : null}
              {profileIsAiAssisted ? (
                <p className="employer-profile-working__note">
                  AI-assisted context from available public information. Confirm role-specific benefits in the
                  original vacancy.
                </p>
              ) : null}
            </section>
          ) : null}
        </article>

        <aside className="employer-profile-facts" aria-label="Organisation facts">
          <p className="eyebrow">At a glance</p>
          <h2>Organisation details</h2>
          <dl>
            <div>
              <dt>Profile status</dt>
              <dd>
                {profileIsReviewed
                  ? "WildJobs reviewed"
                  : profileIsAiAssisted
                    ? "AI-assisted, not yet reviewed"
                    : "Basic confirmed information"}
              </dd>
            </div>
            <div>
              <dt>Conservation focus</dt>
              <dd>{employer.focus}</dd>
            </div>
            <div>
              <dt>Operating locations</dt>
              <dd>{employer.locations.length ? employer.locations.join(" · ") : "See current vacancies"}</dd>
            </div>
            <div>
              <dt>Open roles</dt>
              <dd>{openRoles.length}</dd>
            </div>
            {profileIsReviewed && employer.reviewedAt ? (
              <div>
                <dt>Profile reviewed</dt>
                <dd>{formatDate(employer.reviewedAt)}</dd>
              </div>
            ) : null}
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
            Vacancy descriptions, requirements, salaries and application details always remain attributed to
            their original listing.
          </p>
        </aside>
      </div>

      <section className="employer-profile-jobs" id="current-opportunities">
        <div className="shell">
          <div className="job-results__heading">
            <div>
              <p className="eyebrow">Open positions</p>
              <h2>Current opportunities at {employer.name}</h2>
            </div>
            <p>
              {openRoles.length} current {openRoles.length === 1 ? "role" : "roles"}
            </p>
          </div>
          {openRoles.length ? (
            <div className="job-list">
              {openRoles.map((job) => (
                <JobCard
                  compact
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
              <Link className="action action--outline" href="/">
                Explore other roles
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
