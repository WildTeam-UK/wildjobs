import type { Metadata } from "next";
import Link from "next/link";
import { EmployerCard } from "@/components/employer-card";
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
          <p>Find organisations with current opportunities in the EnvironmentJob feed.</p>
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
            <Link className="text-link" href="/">
              See all jobs →
            </Link>
          </div>
          {employers.length ? (
            <div className="employer-grid">
              {employers.map((employer) => (
                <EmployerCard employer={employer} key={employer.slug} />
              ))}
            </div>
          ) : (
            <div className="staff-empty-state">
              <p className="eyebrow">No current organisations</p>
              <h2>Organisations with live vacancies will appear here.</h2>
              <p>The directory updates automatically from EnvironmentJob.</p>
              <Link className="action action--outline" href="/">
                Browse current jobs
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
