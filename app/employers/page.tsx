import type { Metadata } from "next";
import Link from "next/link";
import { employers, jobsForEmployer } from "@/lib/employers";

export const metadata: Metadata = { title: "Conservation employers" };

export default function EmployersPage() {
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
      <aside className="fixture-notice">
        <div className="shell">
          <strong>Design prototype:</strong> Every organisation shown here is fictional.
        </div>
      </aside>
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
          <div className="employer-grid">
            {employers.map((employer) => {
              const openRoles = jobsForEmployer(employer.name).length;
              return (
                <article key={employer.slug}>
                  <div className="employer-monogram" aria-hidden="true">
                    {employer.shortName}
                  </div>
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
        </div>
      </section>
    </main>
  );
}
