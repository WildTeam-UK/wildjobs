import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Employer review" };

const statusLabels: Record<string, string> = {
  archived: "Archived",
  draft: "Needs context",
  in_review: "In review",
  published: "Approved",
};

export default async function EmployerReviewPage() {
  await requireStaff();
  const supabase = await createClient();
  const { data: employers, error } = await supabase
    .from("employers")
    .select("id, name, status, website_url, mission, overview, updated_at, jobs(id, status)")
    .order("name");

  const records = employers ?? [];
  const complete = records.filter(
    (employer) => employer.website_url && employer.mission && employer.overview,
  ).length;

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Employer profiles</h1>
        </div>
        <p>
          Verify an organisation once, then reuse its approved context across every matched vacancy without
          re-entering it.
        </p>
      </header>

      <section className="staff-section shell">
        <div className="staff-stats" aria-label="Employer profile summary">
          <div>
            <span>{String(records.length).padStart(2, "0")}</span>
            <strong>Employer records</strong>
          </div>
          <div>
            <span>{String(complete).padStart(2, "0")}</span>
            <strong>Profiles with full context</strong>
          </div>
          <div>
            <span>{String(records.length - complete).padStart(2, "0")}</span>
            <strong>Profiles needing context</strong>
          </div>
        </div>

        {error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Employer profiles are temporarily unavailable. Please try again.
          </p>
        ) : records.length ? (
          <div className="employer-review-list">
            {records.map((employer) => {
              const profileComplete = Boolean(employer.website_url && employer.mission && employer.overview);
              const liveJobs = employer.jobs.filter((job) => job.status === "published").length;
              return (
                <article key={employer.id}>
                  <div>
                    <span className="status-badge">
                      {profileComplete
                        ? "Context complete"
                        : (statusLabels[employer.status] ?? employer.status)}
                    </span>
                    <h2>{employer.name}</h2>
                    <p>
                      {profileComplete
                        ? "Website, mission and overview are ready to reuse."
                        : "Add the organisation’s verified website, mission and overview once."}
                    </p>
                  </div>
                  <dl>
                    <dt>Vacancies</dt>
                    <dd>{employer.jobs.length}</dd>
                    <dt>Live now</dt>
                    <dd>{liveJobs}</dd>
                  </dl>
                  <div className="employer-review-actions">
                    <Link className="action action--outline" href={`/admin/employers/${employer.id}`}>
                      {profileComplete ? "Review employer" : "Add employer context"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="staff-empty-state">
            <p className="eyebrow">No employers yet</p>
            <h2>Employer profiles appear with the first review draft.</h2>
            <p>Imported vacancies remain the source of employer identities.</p>
          </div>
        )}
      </section>
    </main>
  );
}
