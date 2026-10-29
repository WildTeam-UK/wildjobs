import type { Metadata } from "next";
import Link from "next/link";
import { getPublicEmployers } from "@/lib/public-employers";

export const metadata: Metadata = { title: "Conservation employers" };

export default async function EmployersPage() {
  const employers = await getPublicEmployers();

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
              <p className="eyebrow">Currently recruiting</p>
              <h2>Explore conservation organisations.</h2>
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
                  <article key={employer.slug}>
                    {employer.logoUrl ? (
                      <div className="employer-logo">
                        <img alt={`${employer.name} logo`} src={employer.logoUrl} />
                      </div>
                    ) : (
                      <div className="employer-monogram" aria-hidden="true">
                        {employer.shortName}
                      </div>
                    )}
                    <p className="eyebrow">{employer.focus}</p>
                    <h2>{employer.name}</h2>
                    <p>{employer.mission}</p>
                    <Link className="text-link" href={`/employers/${employer.slug}`}>
                      View profile · {openRoles} {openRoles === 1 ? "role" : "roles"} →
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
