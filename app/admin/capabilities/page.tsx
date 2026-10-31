import type { Metadata } from "next";
import Link from "next/link";

import { AI_ENRICHMENT_POLICY_VERSION } from "@/lib/admin/ai-vacancy-enrichment";
import { capabilityCoverage, uniqueIds } from "@/lib/admin/capability-admin";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Capability catalogue" };

export default async function CapabilitiesPage() {
  await requireStaff();
  const supabase = await createClient();
  const [
    capabilitiesResult,
    publishedJobsResult,
    classifiedSourcesResult,
    jobMatchesResult,
    candidatesResult,
  ] = await Promise.all([
    supabase
      .from("capabilities")
      .select(
        "id, slug, title, description, confidence, provenance, is_active, capability_aliases(alias), course_capabilities(confidence, coverage_score, is_primary, courses(id, short_title, is_filter_visible)), job_capabilities(job_id)",
      )
      .order("title"),
    supabase.from("jobs").select("id").eq("status", "published").limit(2_000),
    supabase
      .from("job_source_records")
      .select("job_id")
      .not("job_id", "is", null)
      .eq("enrichment_policy_version", AI_ENRICHMENT_POLICY_VERSION)
      .limit(2_000),
    supabase.from("job_capabilities").select("job_id").limit(5_000),
    supabase
      .from("capability_candidates")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const hasError = Boolean(
    capabilitiesResult.error ||
    publishedJobsResult.error ||
    classifiedSourcesResult.error ||
    jobMatchesResult.error ||
    candidatesResult.error,
  );
  const capabilities = capabilitiesResult.data ?? [];
  const activeCapabilities = capabilities.filter((capability) => capability.is_active);
  const courseMappedCapabilities = activeCapabilities.filter((capability) =>
    capability.course_capabilities.some((mapping) => mapping.courses?.is_filter_visible),
  );
  const coverage = capabilityCoverage({
    classifiedJobIds: uniqueIds((classifiedSourcesResult.data ?? []).map((record) => record.job_id)),
    matchedJobIds: uniqueIds((jobMatchesResult.data ?? []).map((record) => record.job_id)),
    publishedJobIds: (publishedJobsResult.data ?? []).map((job) => job.id),
  });

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Reusable job signals</p>
          <h1>Capability catalogue and coverage.</h1>
        </div>
        <p>
          Every active capability is taught by at least one course. Jobs receive only evidence-backed matches,
          and course recommendations follow those shared connections.
        </p>
      </header>

      <section className="staff-summary staff-summary--four shell" aria-label="Capability coverage summary">
        <div>
          <span>{String(activeCapabilities.length).padStart(2, "0")}</span>
          <strong>Active capabilities</strong>
        </div>
        <div>
          <span>{String(courseMappedCapabilities.length).padStart(2, "0")}</span>
          <strong>Visible course signals</strong>
        </div>
        <div>
          <span>{String(coverage.matchedJobs).padStart(2, "0")}</span>
          <strong>Published jobs matched</strong>
        </div>
        <div>
          <span>{String(coverage.awaitingClassification).padStart(2, "0")}</span>
          <strong>Awaiting classification</strong>
        </div>
      </section>

      <section className="staff-section shell">
        <div className="capability-coverage-note">
          <p>
            <strong>{coverage.publishedJobs}</strong> published jobs · <strong>{coverage.matchedJobs}</strong>{" "}
            with a course-backed match · <strong>{coverage.classifiedWithoutMatch}</strong> classified with no
            relevant course · <strong>{coverage.awaitingClassification}</strong> still processing
          </p>
          <Link href="/admin/automation">{candidatesResult.count ?? 0} unmatched capability candidates</Link>
        </div>

        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Canonical taxonomy</p>
            <h2>All capabilities</h2>
          </div>
          <p>Job counts include every status; public filters use only active, visible course mappings.</p>
        </div>

        {hasError ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Some capability reporting could not be loaded. No records were changed.
          </p>
        ) : capabilities.length ? (
          <div className="capability-catalogue">
            {capabilities.map((capability) => {
              const courses = capability.course_capabilities
                .filter((mapping) => mapping.courses)
                .sort((left, right) =>
                  (left.courses?.short_title ?? "").localeCompare(right.courses?.short_title ?? ""),
                );
              const jobCount = uniqueIds(capability.job_capabilities.map((match) => match.job_id)).length;

              return (
                <article key={capability.id}>
                  <header>
                    <div>
                      <p className="eyebrow">
                        CAP-{capability.id} · {capability.provenance.replaceAll("_", " ")}
                      </p>
                      <h2>{capability.title}</h2>
                    </div>
                    <span
                      className={`status-badge status-badge--${capability.is_active ? "ready" : "pending"}`}
                    >
                      {capability.is_active ? "Active" : "Inactive"}
                    </span>
                  </header>
                  <p>{capability.description}</p>
                  {capability.capability_aliases.length ? (
                    <p className="capability-aliases">
                      <strong>Aliases:</strong>{" "}
                      {capability.capability_aliases.map((item) => item.alias).join(", ")}
                    </p>
                  ) : null}
                  <dl>
                    <div>
                      <dt>Taxonomy confidence</dt>
                      <dd>{capability.confidence}%</dd>
                    </div>
                    <div>
                      <dt>Jobs assigned</dt>
                      <dd>{jobCount}</dd>
                    </div>
                    <div>
                      <dt>Courses connected</dt>
                      <dd>{courses.length}</dd>
                    </div>
                  </dl>
                  <div
                    className="capability-course-links"
                    aria-label={`Courses teaching ${capability.title}`}
                  >
                    {courses.length ? (
                      courses.map((mapping) => (
                        <Link href={`/admin/courses/${mapping.courses?.id}`} key={mapping.courses?.id}>
                          {mapping.courses?.short_title}
                          <small>
                            {mapping.is_primary ? "Primary" : "Supporting"} · {mapping.coverage_score}%
                            coverage
                          </small>
                        </Link>
                      ))
                    ) : (
                      <span>No course connection</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="staff-empty-state">
            <h2>No capabilities have been generated yet.</h2>
            <Link className="action" href="/admin/courses">
              Review courses
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
