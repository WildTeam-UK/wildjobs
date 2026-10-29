import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { getCandidateSavedJobs } from "@/lib/candidate-saved-jobs";
import { getPublicJobs } from "@/lib/public-jobs";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const [savedJobs, currentJobs] = await Promise.all([getCandidateSavedJobs(), getPublicJobs()]);
  const savedJobIds = new Set(savedJobs.map((job) => job.id));
  const recentJobs = currentJobs.filter((job) => !savedJobIds.has(job.id)).slice(0, 2);

  return (
    <main>
      <section className="account-hero">
        <div className="shell account-hero__layout">
          <div>
            <p className="eyebrow">Your WildJobs</p>
            <h1>Welcome back.</h1>
          </div>
          <p>Return to promising roles and keep your job preferences clear and under your control.</p>
        </div>
      </section>

      <section className="account-summary shell" aria-label="Account summary">
        <Link href="/account/saved">
          <span>{String(savedJobs.length).padStart(2, "0")}</span>
          <strong>Saved jobs</strong>
          <small>Review roles and closing dates →</small>
        </Link>
        <Link href="/account/preferences">
          <span>Next</span>
          <strong>Job preferences</strong>
          <small>Choose what makes a role useful →</small>
        </Link>
        <div>
          <span>Off</span>
          <strong>Job alerts</strong>
          <small>Alerts require a separate approval</small>
        </div>
      </section>

      <section className="content-section account-recommendations">
        <div className="shell">
          <div className="section-heading section-heading--with-link">
            <div>
              <p className="eyebrow">Recently added</p>
              <h2>More roles worth a closer look.</h2>
            </div>
            <Link className="text-link" href="/jobs">
              Explore all jobs →
            </Link>
          </div>
          {recentJobs.length ? (
            <div className="job-list">
              {recentJobs.map((job) => (
                <JobCard job={job} key={job.slug} saveState="available" />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>You’re caught up.</h3>
              <p>Newly published roles will appear here.</p>
            </div>
          )}
          <p className="recommendation-note">
            These are recently added roles, not personalised recommendations. Preference-based matching is the
            next account stage and will use only choices you can inspect and change.
          </p>
        </div>
      </section>
    </main>
  );
}
