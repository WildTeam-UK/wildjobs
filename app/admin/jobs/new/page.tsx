import type { Metadata } from "next";
import Link from "next/link";

import { ManualJobForm } from "@/components/admin/manual-job-form";
import { requireAdministrator } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add vacancy" };

export default async function NewAdminJobPage() {
  await requireAdministrator();
  const supabase = await createClient();
  const { data: sources, error } = await supabase
    .from("job_sources")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

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
          <ManualJobForm sources={sources} today={new Date().toISOString().slice(0, 10)} />
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
