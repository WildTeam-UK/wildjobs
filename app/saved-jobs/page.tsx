import { pageMetadata } from "@/lib/page-metadata";
import type { Metadata } from "next";
import { BrowserSavedJobs } from "@/components/browser-saved-jobs";
import { getPublicJobs } from "@/lib/public-jobs";

export const metadata: Metadata = pageMetadata({
  title: "Saved jobs",
  description:
    "Review conservation jobs saved in this browser, compare opportunities and keep track of closing dates.",
  path: "/saved-jobs",
  robots: { index: false, follow: false, noarchive: true },
});

export default async function SavedJobsPage() {
  const jobs = await getPublicJobs();
  return (
    <main>
      <section className="account-hero account-hero--compact">
        <div className="shell account-hero__layout">
          <div>
            <p className="eyebrow">Saved jobs</p>
            <h1>Keep promising opportunities close</h1>
          </div>
          <p>Review your shortlist and closing dates without losing where you were in your search.</p>
        </div>
      </section>
      <BrowserSavedJobs jobs={jobs} />
    </main>
  );
}
