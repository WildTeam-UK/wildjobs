import type { Metadata } from "next";
import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { jobs } from "@/lib/jobs";

export const metadata: Metadata = { title: "Your account" };

export default function AccountPage() {
  const relevantJobs = jobs.slice(0, 2);

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
          <span>02</span>
          <strong>Saved jobs</strong>
          <small>Review roles and closing dates →</small>
        </Link>
        <Link href="/account/preferences">
          <span>04</span>
          <strong>Active preferences</strong>
          <small>Inspect and change them →</small>
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
              <p className="eyebrow">Based on your preferences</p>
              <h2>Roles worth a closer look.</h2>
            </div>
            <Link className="text-link" href="/jobs">
              Explore all jobs →
            </Link>
          </div>
          <div className="job-list">
            {relevantJobs.map((job) => (
              <JobCard job={job} key={job.slug} showSaveAction={false} />
            ))}
          </div>
          <p className="recommendation-note">
            These examples use only the preferences shown in this prototype. WildJobs will not infer sensitive
            personal characteristics or use opaque AI ranking.
          </p>
        </div>
      </section>
    </main>
  );
}
