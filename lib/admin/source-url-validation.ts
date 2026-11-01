import { ENVIRONMENT_JOB_RSS_URL } from "./feed-source";
import { getSourceConnector } from "./source-connector";

export function isApprovedVacancyDetailUrl(value: string, sourceType: string, sourceUrl: string) {
  const connector = getSourceConnector(sourceType, sourceUrl);
  if (!connector) return false;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.searchParams.has("url")) {
      return false;
    }
    if (connector === "rss") {
      if (sourceUrl === ENVIRONMENT_JOB_RSS_URL) {
        return url.hostname === "environmentjob.co.uk" && /^\/jobs\/\d+-[^/]+$/.test(url.pathname);
      }
      return url.hostname === "www.countryside-jobs.com" && url.pathname.startsWith("/job/");
    }
    return url.hostname === "vacancies.wwt.org.uk" && /^\/vacancies\/\d+\/[^/]+\.html$/.test(url.pathname);
  } catch {
    return false;
  }
}
