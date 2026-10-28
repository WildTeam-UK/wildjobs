import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Staff workspace" };

export default async function AdminPage() {
  await requireStaff();
  const supabase = await createClient();
  const [sources, jobs, submissions] = await Promise.all([
    supabase.from("job_sources").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase
      .from("employer_submissions")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "changes_requested", "ready_for_job_review"]),
  ]);

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Build a trustworthy jobs catalogue.</h1>
        </div>
        <p>
          Start with approved sources, keep every imported record reviewable and publish only complete,
          current opportunities.
        </p>
      </header>

      <section className="staff-summary shell" aria-label="Workspace summary">
        <div>
          <span>{String(sources.count ?? 0).padStart(2, "0")}</span>
          <strong>Active sources</strong>
        </div>
        <div>
          <span>{String(jobs.count ?? 0).padStart(2, "0")}</span>
          <strong>Job records</strong>
        </div>
        <div>
          <span>{String(submissions.count ?? 0).padStart(2, "0")}</span>
          <strong>Submissions awaiting review</strong>
        </div>
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Start here</p>
            <h2>Move from source to publication.</h2>
          </div>
          <p>Every stage remains visible to staff.</p>
        </div>
        <div className="staff-dashboard-grid">
          <Link href="/admin/sources">
            <span>01</span>
            <h3>Manage sources</h3>
            <p>Add authoritative careers pages, feeds and APIs before any vacancy enters review.</p>
          </Link>
          <Link href="/admin/jobs">
            <span>02</span>
            <h3>Review jobs</h3>
            <p>Check completeness, duplicate warnings and publication readiness.</p>
          </Link>
          <Link href="/admin/imports">
            <span>03</span>
            <h3>Inspect imports</h3>
            <p>See what arrived, what changed and what needs human attention.</p>
          </Link>
          <Link href="/admin/submissions">
            <span>04</span>
            <h3>Employer submissions</h3>
            <p>Keep employer evidence and the final publishing decision separate.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
