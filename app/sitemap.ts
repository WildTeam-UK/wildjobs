import type { MetadataRoute } from "next";
import { SITE_URL, siteIndexingEnabled } from "@/lib/site-indexing";
export default function sitemap(): MetadataRoute.Sitemap {
  return siteIndexingEnabled()
    ? ["/", "/careers", "/employers"].map((path) => ({ url: `${SITE_URL}${path}` }))
    : [];
}
