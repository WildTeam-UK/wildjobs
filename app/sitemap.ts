import type { MetadataRoute } from "next";
import { getPublicJobs } from "@/lib/public-jobs";
import { SITE_URL, siteIndexingEnabled } from "@/lib/site-indexing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteIndexingEnabled()) return [];
  const jobs = await getPublicJobs();
  return jobs
    .filter((job) => job.indexingEligible)
    .map((job) => ({ url: `${SITE_URL}/jobs/${job.slug}`, lastModified: job.updatedAt ?? job.publishedAt }));
}
