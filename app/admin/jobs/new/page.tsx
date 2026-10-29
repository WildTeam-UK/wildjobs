import type { Metadata } from "next";
import Link from "next/link";

import { ManualJobForm } from "@/components/admin/manual-job-form";
import { buildSourceRecordDraftDefaults } from "@/lib/admin/source-record-draft";
import { requireAdministrator } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add vacancy" };

type NewAdminJobPageProps = {
  searchParams: Promise<{ auto?: string; recordId?: string }>;
};

export default async function NewAdminJobPage({ searchParams }: NewAdminJobPageProps) {
  await requireAdministrator();
  const supabase = await createClient();
  const query = await searchParams;
  const recordId = Number(query.recordId);
  const [sourcesResult, recordResult] = await Promise.all([
    supabase.from("job_sources").select("id, name").eq("is_active", true).order("name"),
    Number.isSafeInteger(recordId) && recordId > 0
      ? supabase
          .from("job_source_records")
          .select(
            "id, source_id, canonical_url, mapping_status, job_id, source_title, employer_name, location_text, closes_at, source_updated_at, summary, application_url, detail_text, employer_website_url, enrichment_status, job_source_field_evidence(field_name, resolution_status, value, confidence, source_kind, extraction_method, evidence_text, extractor_version), job_sources(name, is_active)",
          )
          .eq("id", recordId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const sources = sourcesResult.data;
  const error = sourcesResult.error;
  const sourceRecord = recordResult.data;
  const canonicalUrl = sourceRecord?.canonical_url ?? undefined;
  const defaults =
    sourceRecord &&
    canonicalUrl &&
    sourceRecord.job_id === null &&
    ["complete", "needs_review", "skipped"].includes(sourceRecord.enrichment_status) &&
    sourceRecord.job_sources?.is_active &&
    ["unmapped", "possible_duplicate"].includes(sourceRecord.mapping_status)
      ? buildSourceRecordDraftDefaults({
          ...sourceRecord,
          employer_name: sourceRecord.employer_name ?? sourceRecord.job_sources?.name ?? null,
        })
      : undefined;
  const fromSourceRecord = Number.isSafeInteger(recordId) && recordId > 0;

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href={defaults ? `/admin/sources/${defaults.sourceId}` : "/admin/jobs"}>
          <span aria-hidden="true">←</span> {defaults ? "Source review queue" : "Job review queue"}
        </Link>
      </div>
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">{defaults ? "Imported vacancy" : "Manual curation"}</p>
          <h1>{defaults ? "Review an imported vacancy" : "Add a vacancy for review"}</h1>
        </div>
        <p>
          {defaults
            ? "Use the feed details as a starting point, verify the authoritative listing and keep it private until a staff decision."
            : "Capture one authoritative listing, preserve its source and keep it private until a staff decision."}
        </p>
      </header>

      <section className="staff-section shell">
        {query.auto === "needs-review" && defaults ? (
          <p className="staff-form-message" role="status">
            The feed is missing a core fact needed to prepare this draft automatically. Check the original
            vacancy and complete the remaining details below; no assumptions have been added.
          </p>
        ) : null}
        {error || recordResult.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            The approved source details could not be loaded. Please return to the queue and try again.
          </p>
        ) : fromSourceRecord && !defaults ? (
          <div className="staff-empty-state">
            <p className="eyebrow">Record unavailable</p>
            <h2>That source record cannot create a new draft.</h2>
            <p>It may already be linked to a WildJobs vacancy, ignored or no longer available for review.</p>
            <Link className="action" href="/admin/sources">
              Return to vacancy sources
            </Link>
          </div>
        ) : sources?.length ? (
          <ManualJobForm
            defaults={defaults}
            sources={sources}
            today={new Date().toISOString().slice(0, 10)}
          />
        ) : (
          <div className="staff-empty-state">
            <p className="eyebrow">Source required</p>
            <h2>Add an approved vacancy source first.</h2>
            <p>Every vacancy needs traceable provenance before it can enter review.</p>
            <Link className="action" href="/admin/sources">
              Manage sources
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
