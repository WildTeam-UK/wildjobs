import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { jobs } from "@/lib/jobs";

export const metadata: Metadata = { title: "Saved jobs" };

export default function SavedJobsPage() {
  const savedJobs = [jobs[0], jobs[5]];

  return (
    <main>
      <section className="account-hero account-hero--compact">
        <div className="shell account-hero__layout">
          <div>
            <p className="eyebrow">Saved jobs</p>
            <h1>Keep promising opportunities close.</h1>
          </div>
          <p>Review your shortlist and closing dates without losing where you were in your search.</p>
        </div>
      </section>
      <section className="content-section">
        <div className="shell">
          <div className="job-results__heading">
            <h2>Your shortlist</h2>
            <p>2 demonstration roles</p>
          </div>
          <div className="job-list">
            {savedJobs.map((job) => (
              <JobCard job={job} key={job.slug} showSaveAction={false} />
            ))}
          </div>
          <div className="saved-jobs-footer">
            <p>Looking for something different? Your preferences can make the next visit more useful.</p>
            <div>
              <Link className="action" href="/jobs">
                Find more jobs <span aria-hidden="true">→</span>
              </Link>
              <Link className="action action--outline" href="/account/preferences">
                Update preferences
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
