import type { Metadata } from "next";
import Link from "next/link";

import { EmployerSubmissionForm } from "@/components/employer-submission-form";
import { getActiveSubmissionInvite } from "@/lib/employer-submissions/data";

export const metadata: Metadata = {
  title: "Submit a conservation job",
  referrer: "no-referrer",
  robots: { follow: false, index: false, noarchive: true },
};

type SubmissionSearchParams = Promise<{
  received?: string | string[];
  token?: string | string[];
}>;

function SubmissionHeader() {
  return (
    <header className="submission-hero shell">
      <div>
        <p className="eyebrow">Controlled employer submission</p>
        <h1>Share a complete conservation opportunity.</h1>
      </div>
      <div>
        <p>Submission starts a review. It never publishes a vacancy automatically.</p>
        <Link className="text-link" href="/for-employers">
          How WildJobs reviews roles →
        </Link>
      </div>
    </header>
  );
}

function SubmissionUnavailable() {
  return (
    <section className="submission-state shell">
      <p className="eyebrow">Invitation required</p>
      <h2>This submission link is unavailable.</h2>
      <p>It may have expired, been used or been withdrawn. Ask your WildTeam contact for a new link.</p>
      <Link className="action action--outline" href="/for-employers">
        About employer submissions
      </Link>
    </section>
  );
}

function SubmissionReceived() {
  return (
    <section className="submission-state shell">
      <p className="eyebrow">Submission received</p>
      <h2>Your vacancy is now with WildTeam.</h2>
      <p>
        It has entered the private review queue. Nothing is published automatically, and WildTeam will contact
        you if any details need clarification.
      </p>
      <Link className="action" href="/for-employers">
        Return to employer information
      </Link>
    </section>
  );
}

export default async function SubmitJobPage({ searchParams }: { searchParams: SubmissionSearchParams }) {
  const query = await searchParams;
  const received = Array.isArray(query.received) ? query.received[0] : query.received;
  const token = Array.isArray(query.token) ? query.token[0] : query.token;

  if (received === "1") {
    return (
      <main className="submission-page">
        <SubmissionHeader />
        <SubmissionReceived />
      </main>
    );
  }

  const invitation = token ? await getActiveSubmissionInvite(token) : null;
  if (!invitation || !token) {
    return (
      <main className="submission-page">
        <SubmissionHeader />
        <SubmissionUnavailable />
      </main>
    );
  }

  return (
    <main className="submission-page">
      <SubmissionHeader />
      <EmployerSubmissionForm
        invitation={invitation}
        minimumClosingDate={new Date().toISOString().slice(0, 10)}
        token={token}
      />
    </main>
  );
}
