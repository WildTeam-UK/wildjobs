export const SITE_URL = "https://jobs.wildteam.org.uk";
export function siteIndexingEnabled() {
  return process.env.SITE_INDEXING_ENABLED === "true" && process.env.VERCEL_ENV === "production";
}
