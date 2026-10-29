const EXCLUDED_EMPLOYER_HOSTS = [
  "bsky.app",
  "c-js.co.uk",
  "charityjob.co.uk",
  "countryside-jobs.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "threads.net",
  "wikipedia.org",
  "x.com",
  "youtube.com",
] as const;

function normaliseHost(hostname: string) {
  return hostname.replace(/^www\./, "").toLocaleLowerCase("en-GB");
}

export function normaliseResearchUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) return null;
    url.hash = "";
    if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
    const trackingKeys: string[] = [];
    for (const key of url.searchParams.keys()) {
      if (key.startsWith("utm_") || ["fbclid", "gclid"].includes(key)) trackingKeys.push(key);
    }
    for (const key of trackingKeys) url.searchParams.delete(key);
    return url.toString();
  } catch {
    return null;
  }
}

export function isAllowedEmployerWebsite(value: string | null) {
  const normalised = normaliseResearchUrl(value);
  if (!normalised) return false;
  const hostname = normaliseHost(new URL(normalised).hostname);
  return !EXCLUDED_EMPLOYER_HOSTS.some(
    (excluded) => hostname === excluded || hostname.endsWith(`.${excluded}`),
  );
}

export function sameWebsiteHost(left: string | null, right: string | null) {
  const normalisedLeft = normaliseResearchUrl(left);
  const normalisedRight = normaliseResearchUrl(right);
  if (!normalisedLeft || !normalisedRight) return false;
  return normaliseHost(new URL(normalisedLeft).hostname) === normaliseHost(new URL(normalisedRight).hostname);
}

const EMPLOYER_PROFILE_PATH_SEGMENTS = new Set([
  "about",
  "about-the-council",
  "about-us",
  "corporate-plan",
  "organisation",
  "organisations",
  "organization",
  "organizations",
  "our-council",
  "our-story",
  "our-work",
  "strategy",
  "vision",
  "what-we-do",
  "who-we-are",
]);

export function isEmployerProfileSourceUrl(value: string | null) {
  const normalised = normaliseResearchUrl(value);
  if (!normalised) return false;
  const pathSegments = new URL(normalised).pathname.toLocaleLowerCase("en-GB").split("/").filter(Boolean);
  return (
    pathSegments.length === 0 || pathSegments.some((segment) => EMPLOYER_PROFILE_PATH_SEGMENTS.has(segment))
  );
}

export function isReturnedSearchSource(value: string | null, sourceUrls: readonly string[]) {
  const normalised = normaliseResearchUrl(value);
  if (!normalised) return false;
  return sourceUrls.some((sourceUrl) => normaliseResearchUrl(sourceUrl) === normalised);
}

export function evidenceAppearsInText(evidence: string, sourceText: string) {
  const clean = (value: string) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-GB");
  const normalisedEvidence = clean(evidence);
  return normalisedEvidence.length >= 2 && clean(sourceText).includes(normalisedEvidence);
}

export function isEmployerResearchPending(employer: {
  ai_summary: string | null;
  mission: string | null;
  name: string;
  overview: string | null;
  reviewed_at: string | null;
  status: string;
  website_url: string | null;
}) {
  if (employer.name.trim().toLocaleLowerCase("en-GB") === "private employer" || employer.reviewed_at) {
    return false;
  }
  return !employer.ai_summary?.trim() && !employer.mission?.trim() && !employer.overview?.trim();
}
