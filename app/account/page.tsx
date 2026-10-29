import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { getCandidatePreferenceData } from "@/lib/candidate-preferences";
import { getCandidateSavedJobs } from "@/lib/candidate-saved-jobs";
import { matchJobsToPreferences } from "@/lib/job-preference-matching";
import { getPublicJobs } from "@/lib/public-jobs";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const [savedJobs, currentJobs, { preferences }] = await Promise.all([
    getCandidateSavedJobs(),
    getPublicJobs(),
    getCandidatePreferenceData(),
  ]);
  const savedJobIds = new Set(savedJobs.map((job) => job.id));
  const availableJobs = currentJobs.filter((job) => !savedJobIds.has(job.id));
  const relevantJobs = preferences.hasPreferences
    ? matchJobsToPreferences(availableJobs, preferences).slice(0, 2)
    : availableJobs.slice(0, 2);

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
          <span>{String(preferences.preferenceCount).padStart(2, "0")}</span>
          <strong>Job preferences</strong>
          <small>
            {preferences.hasPreferences ? "Inspect and change them →" : "Choose what makes a role useful →"}
          </small>
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
              <p className="eyebrow">
                {preferences.hasPreferences ? "Based on your preferences" : "Recently added"}
              </p>
              <h2>
                {preferences.hasPreferences
                  ? "Roles that share your choices."
                  : "More roles worth a closer look."}
              </h2>
            </div>
            <Link className="text-link" href="/jobs">
              Explore all jobs →
            </Link>
          </div>
          {relevantJobs.length ? (
            <div className="job-list">
              {relevantJobs.map((job) => (
                <JobCard job={job} key={job.slug} saveState="available" />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>{preferences.hasPreferences ? "No current matches yet." : "You’re caught up."}</h3>
              <p>
                {preferences.hasPreferences
                  ? "Your choices are saved and new roles will be checked against them."
                  : "Newly published roles will appear here."}
              </p>
            </div>
          )}
          <p className="recommendation-note">
            {preferences.hasPreferences
              ? "These transparent matches use only the preferences you can inspect and change. They are not eligibility decisions."
              : "These are recently added roles, not personalised recommendations. Add preferences when you want more relevant suggestions."}
          </p>
        </div>
      </section>
    </main>
  );
}
