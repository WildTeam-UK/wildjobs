import type { MetadataRoute } from "next";
import { SITE_URL, siteIndexingEnabled } from "@/lib/site-indexing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: siteIndexingEnabled()
      ? { userAgent: "*", allow: "/", disallow: ["/admin/", "/account/", "/auth/", "/api/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: siteIndexingEnabled() ? `${SITE_URL}/sitemap.xml` : undefined,
  };
}
