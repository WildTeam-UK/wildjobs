import type { Metadata } from "next";
import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import { getPublicEmployers } from "@/lib/public-employers";

export const metadata: Metadata = { title: "Conservation employers" };

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
                return (
                  <article className="employer-directory-card" key={employer.slug}>
                    <header className="employer-directory-card__header">
                      <EmployerLogo
                        imageClassName="employer-logo"
                        logoUrl={employer.logoUrl}
                        monogramClassName="employer-monogram"
                        name={employer.name}
                      />
                      <span
                        className={
                          openRoles
                            ? "employer-directory-card__status employer-directory-card__status--live"
                            : "employer-directory-card__status"
                        }
                      >
                        {openRoles
                          ? `${openRoles} live ${openRoles === 1 ? "role" : "roles"}`
                          : "No live roles"}
                      </span>
                    </header>
                    <div className="employer-directory-card__body">
                      <p className="eyebrow">{employer.focus}</p>
                      <h2>
                        <Link href={`/employers/${employer.slug}`}>{employer.name}</Link>
                      </h2>
                      <p className="employer-directory-card__summary">{employer.mission}</p>
                    </div>
                    <Link className="text-link" href={`/employers/${employer.slug}`}>
                      View organisation <span aria-hidden="true">→</span>
                    </Link>
                  </article>
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
