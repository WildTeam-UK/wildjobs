import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmployerProfileForm } from "@/components/admin/employer-profile-form";
import { requireStaff } from "@/lib/auth/staff";
import { formatDate } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Review employer" };

type EmployerPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function EmployerPage({ params, searchParams }: EmployerPageProps) {
  const staff = await requireStaff();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const supabase = await createClient();
  const [employerResult, eventsResult] = await Promise.all([
    supabase
      .from("employers")
      .select(
        "id, name, status, website_url, mission, overview, reviewed_at, jobs(id, title, status, closes_at)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("moderation_events")
      .select("id, action, review_note, created_at")
      .eq("employer_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (employerResult.error || !employerResult.data) notFound();

  const employer = employerResult.data;
  const query = await searchParams;
  const canEdit = staff.role === "admin" || ["draft", "in_review"].includes(employer.status);

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/employers">
          <span aria-hidden="true">←</span> Employer profiles
        </Link>
      </div>

      {query.status === "updated" ? (
        <div className="shell">
          <p className="staff-form-message" role="status">
            Employer context saved. Later vacancies matched to this organisation will reuse it.
          </p>
        </div>
      ) : null}

      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Reusable employer record</p>
          <h1>{employer.name}</h1>
        </div>
        <p>Keep organisation context separate from individual vacancy facts and verify it at source.</p>
      </header>

      <section className="staff-section shell">
        {canEdit ? (
          <EmployerProfileForm
            employerId={employer.id}
            values={{
              mission: employer.mission ?? "",
              overview: employer.overview ?? "",
              websiteUrl: employer.website_url ?? "",
            }}
          />
        ) : (
          <p className="staff-form-message">
            This employer is already published. An administrator must change its public context.
          </p>
        )}
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Connected vacancies</p>
            <h2>{employer.jobs.length} WildJobs records</h2>
          </div>
        </div>
        {employer.jobs.length ? (
          <div className="staff-table-wrap">
            <table className="staff-table">
              <thead>
                <tr>
                  <th scope="col">Vacancy</th>
                  <th scope="col">Status</th>
                  <th scope="col">Closes</th>
                  <th scope="col">Review</th>
                </tr>
              </thead>
              <tbody>
                {employer.jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.status.replaceAll("_", " ")}</td>
                    <td>{job.closes_at ? formatDate(job.closes_at) : "Not supplied"}</td>
                    <td>
                      <Link href={`/admin/jobs/${job.id}`}>Open record</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No vacancies are linked to this employer.</p>
        )}

        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Audit history</p>
            <h2>Employer changes</h2>
          </div>
        </div>
        {eventsResult.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Employer audit history is temporarily unavailable.
          </p>
        ) : eventsResult.data?.length ? (
          <ol className="audit-list">
            {eventsResult.data.map((event, index) => (
              <li key={event.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <p>{event.review_note ?? "Employer record updated."}</p>
                  <small>{formatDateTime(event.created_at)}</small>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p>No employer-specific audit events have been recorded yet.</p>
        )}
      </section>
    </main>
  );
}
