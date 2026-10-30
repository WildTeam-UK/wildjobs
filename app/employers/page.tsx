import type { Metadata } from "next";
import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import { getPublicEmployers } from "@/lib/public-employers";

export const metadata: Metadata = { title: "Conservation employers" };

function EmployerFactIcon({ type }: { type: "location" | "roles" }) {
  if (type === "location") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect height="13" rx="2" width="18" x="3" y="7" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}

function employerLocation(locations: readonly string[]) {
  if (!locations.length) return "Location not stated";
  if (locations.length === 1) return locations[0];
  return `${locations[0]} + ${locations.length - 1} more`;
}

export default async function EmployersPage() {
  const employers = await getPublicEmployers();
  const recruitingEmployers = employers.filter((employer) => employer.openRoles.length > 0).length;
  const openRoleCount = employers.reduce((total, employer) => total + employer.openRoles.length, 0);

  return (
    <main>
      <section className="interior-hero">
        <div className="shell interior-hero__layout">
          <div>
            <p className="eyebrow">Employers</p>
            <h1>Meet organisations working for nature.</h1>
          </div>
          <p>Learn what they do, how they work and which opportunities are currently open.</p>
        </div>
      </section>
      <section className="content-section">
        <div className="shell">
          <div className="section-heading section-heading--with-link">
            <div>
              <p className="eyebrow">Employer directory</p>
              <h2>Explore conservation organisations.</h2>
              <p className="employer-directory-summary">
                {employers.length} organisations · {recruitingEmployers} currently hiring · {openRoleCount}{" "}
                live {openRoleCount === 1 ? "role" : "roles"}
              </p>
            </div>
            <Link className="text-link" href="/jobs">
              See all jobs →
            </Link>
          </div>
          {employers.length ? (
            <div className="employer-grid">
              {employers.map((employer) => {
                const openRoles = employer.openRoles.length;
                const topics = [
                  employer.focus,
                  ...employer.openRoles.flatMap((job) => [job.category, ...(job.careerAreas ?? [])]),
                ].filter((topic, index, values) => topic && values.indexOf(topic) === index);
                const description = employer.overview[0] ?? employer.mission;
                return (
                  <Link
                    aria-label={`View ${employer.name}`}
                    className="employer-directory-card"
                    href={`/employers/${employer.slug}`}
                    key={employer.slug}
                  >
                    <article>
                      <header className="employer-directory-card__header">
                        <EmployerLogo
                          imageClassName="employer-logo"
                          logoUrl={employer.logoUrl}
                          monogramClassName="employer-monogram"
                          name={employer.name}
                        />
                        {openRoles ? (
                          <span className="employer-directory-card__status">
                            <span>Hiring now!</span>
                          </span>
                        ) : null}
                      </header>
                      <div className="employer-directory-card__body">
                        <h2>{employer.name}</h2>
                        <p className="employer-directory-card__summary">{description}</p>
                      </div>
                      <ul className="employer-directory-card__facts">
                        <li>
                          <EmployerFactIcon type="location" />
                          <span>{employerLocation(employer.locations)}</span>
                        </li>
                        <li>
                          <EmployerFactIcon type="roles" />
                          <span>
                            {openRoles} live {openRoles === 1 ? "role" : "roles"}
                          </span>
                        </li>
                      </ul>
                      <div className="employer-directory-card__topics" aria-label="Organisation topics">
                        {topics.map((topic) => (
                          <span key={topic}>{topic}</span>
                        ))}
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="staff-empty-state">
              <p className="eyebrow">Profiles are being prepared</p>
              <h2>Reviewed conservation employers will appear here.</h2>
              <p>You can still explore every current vacancy while we build the directory.</p>
              <Link className="action action--outline" href="/jobs">
                Browse current jobs
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
