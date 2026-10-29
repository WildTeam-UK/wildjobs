import type { Metadata } from "next";
import Link from "next/link";

import { ManualJobForm } from "@/components/admin/manual-job-form";
import { requireAdministrator } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add vacancy" };

type NewAdminJobPageProps = {
  searchParams: Promise<{ recordId?: string }>;
};

export default async function NewAdminJobPage({ searchParams }: NewAdminJobPageProps) {
  await requireAdministrator();
  const supabase = await createClient();
  const recordId = Number((await searchParams).recordId);
  const [sourcesResult, recordResult] = await Promise.all([
    supabase.from("job_sources").select("id, name").eq("is_active", true).order("name"),
    Number.isSafeInteger(recordId) && recordId > 0
      ? supabase
          .from("job_source_records")
          .select(
            "id, source_id, canonical_url, mapping_status, job_id, source_title, employer_name, location_text, closes_at, source_updated_at, job_sources(name, is_active)",
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
    sourceRecord.job_sources?.is_active &&
    ["unmapped", "possible_duplicate"].includes(sourceRecord.mapping_status)
      ? {
          applicationUrl: canonicalUrl,
          canonicalUrl,
          closesAt: sourceRecord.closes_at ?? undefined,
          employerName: (sourceRecord.employer_name ?? sourceRecord.job_sources?.name)?.slice(0, 160),
          locationText: sourceRecord.location_text ?? undefined,
          postedAt: sourceRecord.source_updated_at?.slice(0, 10),
          sourceId: sourceRecord.source_id,
          title: sourceRecord.source_title?.slice(0, 180),
        }
      : undefined;

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/jobs">
          <span aria-hidden="true">←</span> Job review queue
        </Link>
      </div>
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Manual curation</p>
          <h1>Add a vacancy for review</h1>
        </div>
        <p>
          Capture one authoritative listing, preserve its source and keep it private until a staff decision.
        </p>
      </header>

      <section className="staff-section shell">
        {error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            The approved sources could not be loaded. Please return to the queue and try again.
          </p>
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
