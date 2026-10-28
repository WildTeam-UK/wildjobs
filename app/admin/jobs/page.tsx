import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/staff";
import { formatDate } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Job review queue" };

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    expired: "Expired",
    in_review: "Needs review",
    published: "Published",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  };
  return labels[status] ?? status;
}

export default async function AdminJobsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, status, closes_at, employers(name), job_source_records(job_sources(name))")
    .order("updated_at", { ascending: false });

  const records = jobs ?? [];
  const needsDecision = records.filter((job) => job.status === "draft" || job.status === "in_review").length;
  const published = records.filter((job) => job.status === "published").length;
  const unavailable = records.filter((job) =>
    ["expired", "withdrawn", "rejected"].includes(job.status),
  ).length;

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Job review queue</h1>
        </div>
        <p>Every vacancy stays private until its source, core facts and publication decision are checked.</p>
      </header>

      <section className="staff-summary shell" aria-label="Review queue summary">
        <div>
          <span>{String(needsDecision).padStart(2, "0")}</span>
          <strong>Need a decision</strong>
        </div>
        <div>
          <span>{String(published).padStart(2, "0")}</span>
          <strong>Published records</strong>
        </div>
        <div>
          <span>{String(unavailable).padStart(2, "0")}</span>
          <strong>Closed or rejected</strong>
        </div>
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Live Supabase records</p>
            <h2>Vacancies to review</h2>
          </div>
          {staff.role === "admin" ? (
            <Link className="action" href="/admin/jobs/new">
              Add vacancy
            </Link>
          ) : null}
        </div>

        {error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            The review queue could not be loaded. Please try again.
          </p>
        ) : records.length ? (
          <div className="review-list">
            {records.map((job) => {
              const label = statusLabel(job.status);
              const source = job.job_source_records[0]?.job_sources?.name ?? "Source pending";
              return (
                <article className="review-row" key={job.id}>
                  <div>
                    <span
                      className={`status-badge status-badge--${label.toLowerCase().replaceAll(" ", "-")}`}
                    >
                      {label}
                    </span>
                    <p>{source}</p>
                  </div>
                  <div className="review-row__job">
                    <h2>{job.title}</h2>
                    <p>{job.employers.name}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Closes</dt>
                      <dd>{job.closes_at ? formatDate(job.closes_at) : "Not supplied"}</dd>
                    </div>
                    <div>
                      <dt>Record</dt>
                      <dd>#{job.id}</dd>
                    </div>
                  </dl>
                  <Link className="action action--outline" href={`/admin/jobs/${job.id}`}>
                    Review record
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="staff-empty-state">
            <p className="eyebrow">Queue clear</p>
            <h2>No real vacancies have been added yet.</h2>
            <p>
              The prototype examples are no longer shown here. Add one current role from an approved source.
            </p>
            {staff.role === "admin" ? (
              <Link className="action" href="/admin/jobs/new">
                Add the first vacancy
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
