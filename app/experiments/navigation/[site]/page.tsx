import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata({ params }: { params: Promise<{ site: string }> }): Promise<Metadata> {
  const { site } = await params;
  if (site !== "jobs" && site !== "news") notFound();
  const name = site === "jobs" ? "WildJobs" : "WildNews";
  return pageMetadata({
    title: `${name} navigation preview`,
    description: `Preview the ${name} navigation menus and primary action at desktop and mobile widths.`,
    path: `/experiments/navigation/${site}`,
    robots: { index: false, follow: false, noarchive: true },
  });
}

export default async function NavigationPreview({ params }: { params: Promise<{ site: string }> }) {
  const { site } = await params;
  if (site !== "jobs" && site !== "news") notFound();

  return (
    <main id="navigation-preview-main" className="content-section shell">
      <p className="eyebrow">Navigation experiment</p>
      <h1>{site === "jobs" ? "Jobs" : "News"} navigation preview</h1>
      <p>Try the menus and primary action at desktop and mobile widths.</p>
      <p>
        <Link
          className="action action--outline"
          href={`/experiments/navigation/${site === "jobs" ? "news" : "jobs"}`}
        >
          Preview the {site === "jobs" ? "News" : "Jobs"} navigation
        </Link>
      </p>
    </main>
  );
}
