"use client";

import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { toggleBrowserSavedJob, useBrowserSavedJobs } from "@/lib/browser-saved-jobs";
import type { Job } from "@/lib/jobs";

export function BrowserSavedJobs({ jobs }: { jobs: readonly Job[] }) {
  const { ids, persistent } = useBrowserSavedJobs();
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  return (
    <section className="content-section">
      <div className="shell">
        <div className="job-results__heading">
          <h2>Your shortlist</h2>
          <p aria-live="polite">
            {ids.length} saved {ids.length === 1 ? "role" : "roles"}
          </p>
        </div>
        <p className="recommendation-note">
          {persistent
            ? "Saved on this browser only. No account needed. Clearing your browser data removes this list; it does not sync across devices."
            : "Browser storage is unavailable. Your shortlist will last for this visit only."}
        </p>
        {ids.length ? (
          <div className="job-list">
            {ids.map((id) => {
              const job = jobsById.get(id);
              return job ? (
                <JobCard compact job={job} key={id} />
              ) : (
                <article className="staff-empty-state" key={id}>
                  <h3>This saved job is no longer available.</h3>
                  <p>Its advert may have closed or been removed from the directory.</p>
                  <button className="save-action" onClick={() => toggleBrowserSavedJob(id)} type="button">
                    Remove from shortlist
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-saved">
            <span aria-hidden="true">♡</span>
            <h2>Save roles you want to return to.</h2>
            <p>Select the heart on any job to add it to this browser’s shortlist.</p>
          </div>
        )}
        <div className="saved-jobs-footer">
          <Link className="action" href="/">
            Find more jobs <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
