export type LocationType = "Hybrid" | "Not specified" | "On-site" | "Remote";
export type EmploymentType =
  | "Apprenticeship"
  | "Fixed term"
  | "Flexible"
  | "Full time"
  | "Internship"
  | "Not stated"
  | "Part time"
  | "Permanent"
  | "Temporary";
export type EngagementType = "Paid" | "Volunteer";

export type RelatedCourse = Readonly<{
  slug: string;
  shortTitle: string;
  trainingUrl: string;
  themeColour: string;
}>;

export type JobTaxonomyTerm = Readonly<{
  description?: string;
  slug: string;
  title: string;
}>;

export type Job = Readonly<{
  updatedAt?: string;
  id?: number;
  availability?: "current" | "expired" | "unavailable" | "withdrawn";
  slug: string;
  title: string;
  organisation: string;
  location: string;
  locationLocality?: string;
  locationRegion?: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  engagementType?: EngagementType;
  contractType?: string;
  experienceLevel?: string;
  hoursType?: string;
  hoursTypes?: readonly string[];
  category: string;
  careerAreas?: readonly string[];
  careerAreaTerms?: readonly JobTaxonomyTerm[];
  salary: string;
  salaryMinimum?: number;
  summary: string;
  summarySource?: "ai" | "excerpt" | "source";
  postedAt: string;
  closesAt?: string;
  sourceName: string;
  sourceUrl?: string;
  employerLogoUrl?: string;
  countryCode?: string;
  postalCode?: string;
  publishedAt?: string;
  relatedCourses?: readonly RelatedCourse[];
  relatedCourseSlugs: readonly string[];
}>;

export function compactJobLocation(
  job: Pick<Job, "countryCode" | "location" | "locationLocality" | "locationRegion" | "locationType">,
) {
  const rawAddressParts = job.location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const inferredCountryCode = rawAddressParts.findLast((part) => /^[A-Z]{2}$/.test(part));
  const countryCode =
    job.countryCode ??
    inferredCountryCode ??
    (rawAddressParts.some((part) => /^(?:United Kingdom|UK)$/i.test(part)) ? "GB" : undefined);
  const addressParts = rawAddressParts.filter(
    (part) =>
      part &&
      !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(part) &&
      ![countryCode, "United Kingdom", "UK", "GB"].filter(Boolean).includes(part),
  );
  const addressLocality = addressParts.length > 1 ? addressParts.at(-2) : addressParts[0] || undefined;
  const lead =
    job.locationType === "Remote"
      ? "Remote"
      : (job.locationLocality ?? job.locationRegion ?? addressLocality);
  return lead ? [lead, countryCode].filter(Boolean).join(", ") : job.location;
}

function daysFromToday(value: string, today: Date) {
  const target = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  const current = new Date(today);
  current.setUTCHours(0, 0, 0, 0);
  return Math.floor((target.valueOf() - current.valueOf()) / 86_400_000);
}

export function isNewJob(value: string, today = new Date()) {
  const daysOld = -daysFromToday(value, today);
  return daysOld >= 0 && daysOld < 7;
}

export function isClosingSoon(value: string, today = new Date()) {
  const daysRemaining = daysFromToday(value, today);
  return daysRemaining >= 0 && daysRemaining < 7;
}

export function postedAgoLabel(value: string, now = new Date()) {
  const posted = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  const elapsedMilliseconds = Math.max(0, now.valueOf() - posted.valueOf());

  if (!Number.isFinite(posted.valueOf())) return "Posted recently";
  if (elapsedMilliseconds < 60_000) return "Posted just now";

  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60_000);
  if (elapsedMinutes < 60) {
    return `Posted ${elapsedMinutes} ${elapsedMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `Posted ${elapsedHours} ${elapsedHours === 1 ? "hour" : "hours"} ago`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Posted ${elapsedDays} ${elapsedDays === 1 ? "day" : "days"} ago`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export function listingAgeLabel(value: string, today = new Date()) {
  const listed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  const current = new Date(today);
  current.setUTCHours(0, 0, 0, 0);
  const days = Math.max(0, Math.floor((current.valueOf() - listed.valueOf()) / 86_400_000));
  return `Unknown · listing is ${days} ${days === 1 ? "day" : "days"} old`;
}
