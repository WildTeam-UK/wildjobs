import type { MetadataRoute } from "next";
import { SITE_URL, siteIndexingEnabled } from "@/lib/site-indexing";
import { pilotGuides, guidePath } from "@/lib/guide-content";
import { getGuideData } from "@/lib/public-guides";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteIndexingEnabled()) return [];
  const guides = await Promise.all(pilotGuides.map((guide) => getGuideData(guide.slug)));
  const published = guides.filter((data) => !data.isDraft);
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
