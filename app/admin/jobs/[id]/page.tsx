import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { publishJobReview } from "@/app/admin/jobs/actions";
import { PublishJobForm } from "@/components/admin/publish-job-form";
import { requireStaff } from "@/lib/auth/staff";
import { formatDate } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Review vacancy" };

type ReviewPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
};

const labels: Record<string, string> = {
  apprenticeship: "Apprenticeship",
  created: "Draft created",
  developing: "Developing",
  entry: "Entry",
  experienced: "Experienced",
  fixed_term: "Fixed term",
  flexible: "Flexible",
  full_time: "Full time",
  hybrid: "Hybrid",
  in_review: "Needs review",
  internship: "Internship",
  leadership: "Leadership",
  on_site: "On-site",
  open: "Open",
  part_time: "Part time",
  permanent: "Permanent",
  published: "Published",
  remote: "Remote",
  temporary: "Temporary",
  updated: "Review updated",
};

function label(value: string | null) {
  return value ? (labels[value] ?? value.replaceAll("_", " ")) : "Not supplied";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function ReviewJobPage({ params, searchParams }: ReviewPageProps) {
  const staff = await requireStaff();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const supabase = await createClient();
  const [jobResult, sourceResult, eventResult] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, title, summary, description, responsibilities, requirements, status, location_text, country_code, workplace_type, contract_type, hours_type, experience_level, salary_text, application_url, posted_at, closes_at, employers(id, name, website_url, mission, overview, status)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("job_source_records")
      .select("id, canonical_url, verified_at, mapping_status, job_sources(id, name)")
      .eq("job_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("moderation_events")
      .select("id, action, previous_status, next_status, review_note, created_at")
      .eq("job_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (jobResult.error || !jobResult.data) notFound();
  const job = jobResult.data;
  const sources = sourceResult.data ?? [];
  const events = eventResult.data ?? [];
  const query = await searchParams;
  const created = query.status === "created";
  const updated = query.status === "updated";
  const published = query.status === "published";
  const publicationError = query.error === "publication-check";
  const statusLabel = label(job.status);
  const isPublished = job.status === "published";
  const publish = publishJobReview.bind(null, id);

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/jobs">
          <span aria-hidden="true">←</span> Job review queue
        </Link>
      </div>

      {created ? (
        <div className="shell">
          <p className="staff-form-message" role="status">
            Review draft created. It is private and has not been published.
          </p>
        </div>
      ) : null}

      {updated ? (
        <div className="shell">
          <p className="staff-form-message" role="status">
            Reviewed details saved. The vacancy is still private.
          </p>
        </div>
      ) : null}

      {published ? (
        <div className="shell">
          <p className="staff-form-message" role="status">
            Vacancy approved and published to the live catalogue.
          </p>
        </div>
      ) : null}

      {publicationError ? (
        <div className="shell">
          <p className="staff-form-message staff-form-message--error" role="alert">
            Publication was stopped. Check the required vacancy, employer and source details, then try again.
          </p>
        </div>
      ) : null}

      <header className="review-hero shell">
        <div>
          <span className={`status-badge status-badge--${statusLabel.toLowerCase().replaceAll(" ", "-")}`}>
            {statusLabel}
          </span>
          <p>
            <Link href={`/admin/employers/${job.employers.id}`}>{job.employers.name}</Link>
          </p>
          <h1>{job.title}</h1>
        </div>
        <dl>
          <div>
            <dt>Sources</dt>
            <dd>
              {sources.length === 1
                ? sources[0].job_sources.name
                : sources.length > 1
                  ? `${sources.length} linked sources`
                  : "Not connected"}
            </dd>
          </div>
          <div>
            <dt>Record</dt>
            <dd>#{job.id}</dd>
          </div>
          <div>
            <dt>Closing date</dt>
            <dd>{job.closes_at ? formatDate(job.closes_at) : "Not supplied"}</dd>
          </div>
        </dl>
      </header>

      <div className="shell review-layout">
        <article className="review-content">
          <section>
            <p className="eyebrow">Structured vacancy</p>
            <h2>Core facts</h2>
            <dl className="review-fields">
              <div>
                <dt>Location</dt>
                <dd>{job.location_text}</dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{job.country_code}</dd>
              </div>
              <div>
                <dt>Workplace</dt>
                <dd>{label(job.workplace_type)}</dd>
              </div>
              <div>
                <dt>Contract</dt>
                <dd>{label(job.contract_type)}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>{label(job.hours_type)}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{label(job.experience_level)}</dd>
              </div>
              <div>
                <dt>Salary</dt>
                <dd>{job.salary_text}</dd>
              </div>
              <div>
                <dt>Published by employer</dt>
                <dd>{job.posted_at ? formatDate(job.posted_at) : "Not supplied"}</dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="eyebrow">Vacancy copy</p>
            <h2>Summary and description</h2>
            <div className="review-copy">
              <strong>{job.summary}</strong>
              <p>{job.description}</p>
              {job.responsibilities ? (
                <div>
                  <h3>Responsibilities</h3>
                  <p>{job.responsibilities}</p>
                </div>
              ) : null}
              {job.requirements ? (
                <div>
                  <h3>Requirements</h3>
                  <p>{job.requirements}</p>
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <p className="eyebrow">Provenance</p>
            <h2>Authoritative links</h2>
            {sources.length ? (
              <div className="review-source-records">
                {sources.map((source) => (
                  <article key={source.id}>
                    <div>
                      <strong>{source.job_sources.name}</strong>
                      <small>
                        {source.verified_at
                          ? `Verified ${formatDateTime(source.verified_at)}`
                          : "Awaiting verification"}
                      </small>
                    </div>
                    <div>
                      <Link href={`/admin/sources/${source.job_sources.id}?status=mapped`}>
                        Open source queue
                      </Link>
                      {source.canonical_url ? (
                        <a href={source.canonical_url} rel="noreferrer" target="_blank">
                          Open original vacancy <span aria-hidden="true">↗</span>
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="review-source-missing">No authoritative source is linked to this vacancy.</p>
            )}
            <div className="review-source-links">
              {job.application_url ? (
                <a href={job.application_url} rel="noreferrer" target="_blank">
                  Open application route <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              {job.employers.website_url ? (
                <a href={job.employers.website_url} rel="noreferrer" target="_blank">
                  Open employer website <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </section>

          <section>
            <p className="eyebrow">Audit history</p>
            <h2>What happened to this record</h2>
            {events.length ? (
              <ol className="audit-list">
                {events.map((event, index) => (
                  <li key={event.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{label(event.action)}</strong>
                      <p>
                        {event.review_note ?? `${label(event.previous_status)} → ${label(event.next_status)}`}
                      </p>
                      <small>{formatDateTime(event.created_at)}</small>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p>No audit events were found for this record.</p>
            )}
          </section>
        </article>

        <aside className="review-actions" aria-label="Review actions">
          <p className="eyebrow">{isPublished ? "Live catalogue" : "Private review draft"}</p>
          <h2>{isPublished ? "This record is approved." : "Nothing is public yet."}</h2>
          {isPublished ? (
            <p>
              The vacancy and employer have passed the publication checks. The next build stage connects the
              public job pages to this live catalogue.
            </p>
          ) : (
            <>
              <p>Check the original source against every field before making a publication decision.</p>
              <Link className="action action--outline" href={`/admin/jobs/${id}/edit`}>
                Edit reviewed details
              </Link>
              {staff.role === "admin" ? (
                <div className="review-publication">
                  <strong>Administrator decision</strong>
                  <p>
                    Publishing makes the database record readable by the public. This action is recorded in
                    the audit history.
                  </p>
                  <PublishJobForm action={publish} />
                </div>
              ) : (
                <p className="review-permission-note">An administrator must make the publication decision.</p>
              )}
            </>
          )}
          <Link className="action action--outline" href="/admin/jobs">
            Return to queue
          </Link>
        </aside>
      </div>
    </main>
  );
}
