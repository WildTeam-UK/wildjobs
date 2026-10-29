import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "For conservation employers" };

export default function ForEmployersPage() {
  return (
    <main>
      <section className="interior-hero interior-hero--pink">
        <div className="shell interior-hero__layout">
          <div>
            <p className="eyebrow">For employers</p>
            <h1>Give conservation roles the context they deserve.</h1>
          </div>
          <p>
            WildJobs is designed to help candidates understand the work, trust the source and apply with
            confidence.
          </p>
        </div>
      </section>
      <section className="content-section">
        <div className="shell employer-proposition">
          <div className="section-heading">
            <p className="eyebrow">A considered listing experience</p>
            <h2>Clear for candidates. Carefully reviewed by WildTeam.</h2>
            <p>
              The first beta will use a controlled submission and moderation process rather than instant
              self-publishing.
            </p>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Share complete information</h3>
                <p>
                  Salary, location, working pattern, closing date and application process should be visible
                  from the start.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>We review the listing</h3>
                <p>WildTeam checks structure, source and clarity before anything is published.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Candidates apply with you</h3>
                <p>WildJobs sends people to the authoritative employer application route.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section className="employer-callout">
        <div className="shell employer-callout__inner">
          <div>
            <p className="eyebrow">Beta access</p>
            <h2>Controlled submissions are now invitation-only.</h2>
          </div>
          <div>
            <p>
              WildTeam sends each approved employer contact a secure, seven-day link. Every submission is
              reviewed before it can become a public listing.
            </p>
            <Link className="action action--white" href="/for-employers/submit">
              I have an invitation →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
