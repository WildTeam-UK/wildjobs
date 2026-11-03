import type { MetadataRoute } from "next";
import { SITE_URL, siteIndexingEnabled } from "@/lib/site-indexing";
import { guidePath } from "@/lib/guide-content";
import { getReviewedGuideIndex } from "@/lib/public-guides";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteIndexingEnabled()) return [];
  const published = await getReviewedGuideIndex();
  return [
    ...["/", "/careers", "/employers", ...(published.length ? ["/conservation-career-guides"] : [])].map(
      (path) => ({ url: `${SITE_URL}${path}` }),
    ),
    ...published.map(({ guide, reviewedAt }) => ({
      url: `${SITE_URL}${guidePath(guide)}`,
      lastModified: reviewedAt ?? undefined,
    })),
  ];
}
