import type { Metadata } from "next";
import Link from "next/link";
import { jobs } from "@/lib/jobs";

export const metadata: Metadata = { title: "Conservation employers" };
const employers = Array.from(new Map(jobs.map((job) => [job.organisation, job])).values());

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
            {employers.map((job) => (
              <article key={job.organisation}>
                <div className="employer-monogram" aria-hidden="true">
                  {job.organisation
                    .replace("Example ", "")
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <p className="eyebrow">{job.category}</p>
                <h2>{job.organisation}</h2>
                <p>{job.summary}</p>
                <Link className="text-link" href={`/jobs/${job.slug}`}>
                  View open role →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
