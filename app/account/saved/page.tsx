import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { getCandidateSavedJobs } from "@/lib/candidate-saved-jobs";

export const metadata: Metadata = { title: "Saved jobs" };

export default async function SavedJobsPage({ searchParams }: { searchParams: Promise<{ save?: string }> }) {
  const [savedJobs, query] = await Promise.all([getCandidateSavedJobs(), searchParams]);

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
            <p>
              {savedJobs.length} saved {savedJobs.length === 1 ? "role" : "roles"}
            </p>
          </div>
          {query.save === "removed" || query.save === "error" ? (
            <p
              className={`staff-form-message${query.save === "error" ? " staff-form-message--error" : ""}`}
              role={query.save === "error" ? "alert" : "status"}
            >
              {query.save === "removed"
                ? "Job removed from your shortlist."
                : "Your saved jobs could not be updated. Please try again."}
            </p>
          ) : null}
          {savedJobs.length ? (
            <div className="job-list">
              {savedJobs.map((job) => (
                <JobCard job={job} key={job.slug} saveReturnTo="/account/saved" saveState="saved" />
              ))}
            </div>
          ) : (
            <div className="empty-saved">
              <span aria-hidden="true">♡</span>
              <p className="eyebrow">Your shortlist is empty</p>
              <h2>Save roles you want to return to.</h2>
              <p>Saved jobs are private to your account and easy to remove at any time.</p>
            </div>
          )}
          <div className="saved-jobs-footer">
            <p>Looking for something different? Your preferences can make the next visit more useful.</p>
            <div>
              <Link className="action" href="/">
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
