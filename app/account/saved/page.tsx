import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Saved jobs" };

export default function SavedJobsPage() {
  return (
    <main>
      <section className="interior-hero">
        <div className="shell interior-hero__layout">
          <div>
            <p className="eyebrow">Saved jobs</p>
            <h1>Keep promising opportunities close.</h1>
          </div>
          <p>
            Your future WildJobs account will bring saved roles, closing dates and preferences together here.
          </p>
        </div>
      </section>
      <section className="content-section">
        <div className="shell empty-saved">
          <span aria-hidden="true">♡</span>
          <p className="eyebrow">Design preview</p>
          <h2>No saved jobs yet.</h2>
          <p>
            Accounts are not connected in this prototype. For now, explore the fictional roles and imagine
            this as your personal shortlist.
          </p>
          <Link className="action" href="/jobs">
            Find jobs <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
