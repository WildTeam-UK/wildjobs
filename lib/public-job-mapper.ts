import type { Job } from "./jobs";

type PublicEmployerRecord = Readonly<{
  ai_summary: string | null;
  logo_url: string | null;
  name: string;
  overview: string | null;
  short_name: string | null;
  slug: string;
  website_url: string | null;
}>;

type PublicCareerAreaRecord = Readonly<{
  is_primary: boolean;
  career_areas: Readonly<{
    slug: string;
    title: string;
  }> | null;
}>;

export type PublicJobRecord = Readonly<{
  id: number;
  application_url: string | null;
  closes_at: string | null;
  contract_type: string | null;
  country_code: string | null;
  created_at: string;
  description: string | null;
  engagement_type: string | null;
  employers: PublicEmployerRecord | null;
  experience_level: string | null;
  expires_at: string | null;
  hours_type: string | null;
  job_career_areas: readonly PublicCareerAreaRecord[];
  location_text: string | null;
  locality: string | null;
  postal_code: string | null;
  posted_at: string | null;
  published_at: string | null;
  region: string | null;
  requirements: string | null;
  responsibilities: string | null;
  salary_text: string | null;
  salary_min: number | null;
  source_name: string | null;
  source_url: string | null;
  slug: string;
  status: string;
  summary: string | null;
  summary_source: string;
  title: string;
  withdrawn_at: string | null;
  workplace_type: string | null;
}>;

const workplaceLabels = {
  hybrid: "Hybrid",
  on_site: "On-site",
  remote: "Remote",
} as const;

const engagementLabels = {
  paid: "Paid",
  volunteer: "Volunteer",
} as const;

const jobTypeLabels = {
  apprenticeship: "Apprenticeship",
  fixed_term: "Fixed term",
  flexible: "Flexible",
  full_time: "Full time",
  internship: "Internship",
  part_time: "Part time",
  permanent: "Permanent",
  temporary: "Temporary",
} as const;

function labelValue(value: string | null) {
  if (!value) return undefined;

  return value
    .split("_")
    .filter(Boolean)
    .map((word) => word[0]?.toLocaleUpperCase("en-GB") + word.slice(1))
    .join(" ");
}

function jobTypeLabel(value: string | null) {
  if (!value) return undefined;
  return jobTypeLabels[value as keyof typeof jobTypeLabels] ?? labelValue(value);
}

function paragraphs(value: string | null) {
  return (value ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function listItems(value: string | null) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function dateOnly(value: string | null) {
  return value?.slice(0, 10);
}

function availability(record: PublicJobRecord) {
  if (record.withdrawn_at || record.status === "withdrawn") return "withdrawn" as const;
  const effectiveExpiry = record.closes_at ?? record.expires_at;
  if (effectiveExpiry && effectiveExpiry < new Date().toISOString().slice(0, 10)) {
    return "expired" as const;
  }
  if (record.status !== "published") return "unavailable" as const;
  return "current" as const;
}

function applicationLabel(record: PublicJobRecord) {
  if (!record.application_url) return undefined;
  try {
    if (
      record.source_url &&
      new URL(record.source_url).hostname === new URL(record.application_url).hostname
    ) {
      return `Apply on ${record.source_name?.trim() || "original vacancy site"}`;
    }
  } catch {
    // Valid HTTPS values are enforced by the database; retain a safe generic label if old data differs.
  }
  return "Apply on employer website";
}

function salaryMinimum(record: PublicJobRecord) {
  if (record.salary_min !== null) return record.salary_min;
  const match = record.salary_text?.replaceAll(",", "").match(/£\s*(\d{4,6})/);
  return match ? Number(match[1]) : undefined;
}

function engagementType(record: PublicJobRecord) {
  return (
    engagementLabels[record.engagement_type as keyof typeof engagementLabels] ??
    (record.salary_text && /£\s?\d/.test(record.salary_text) ? "Paid" : undefined)
  );
}

export function mapPublicJob(record: PublicJobRecord): Job {
  const rawDescription = paragraphs(record.description);
  const careerAreas = record.job_career_areas
    .filter((relation) => relation.career_areas)
    .toSorted((left, right) => Number(right.is_primary) - Number(left.is_primary));
  const category = careerAreas[0]?.career_areas?.title ?? "Conservation";
  const contractType = jobTypeLabel(record.contract_type);
  const hoursType = jobTypeLabel(record.hours_type);
  const employer = record.employers;
  const officialEmployerOverview = paragraphs(employer?.overview ?? null);
  const aiEmployerOverview = paragraphs(employer?.ai_summary ?? null);
  const summary = record.summary?.trim() || rawDescription[0] || "View the full vacancy details.";
  const description = rawDescription.filter(
    (paragraph) => paragraph.toLocaleLowerCase("en-GB") !== summary.toLocaleLowerCase("en-GB"),
  );

  return {
    availability: availability(record),
    applicationUrl: record.application_url ?? undefined,
    applicationLabel: applicationLabel(record),
    category,
    careerAreas: careerAreas.flatMap((relation) =>
      relation.career_areas ? [relation.career_areas.title] : [],
    ),
    closesAt: dateOnly(record.closes_at),
    contractType,
    countryCode: record.country_code ?? undefined,
    description,
    employerLogoUrl: employer?.logo_url?.trim() || undefined,
    employerOverview: officialEmployerOverview.length ? officialEmployerOverview : aiEmployerOverview,
    employerOverviewIsAi: !officialEmployerOverview.length && aiEmployerOverview.length > 0,
    employerSlug: employer?.slug,
    employerWebsiteUrl: employer?.website_url?.trim() || undefined,
    employmentType: hoursType ?? contractType ?? "Not stated",
    engagementType: engagementType(record),
    experienceLevel: record.experience_level ?? undefined,
    hoursType,
    id: record.id,
    location: record.location_text?.trim() || record.region?.trim() || "Location not stated",
    locationLocality: record.locality?.trim() || undefined,
    locationRegion: record.region?.trim() || undefined,
    locationType: workplaceLabels[record.workplace_type as keyof typeof workplaceLabels] ?? "Not specified",
    organisation: employer?.short_name?.trim() || employer?.name?.trim() || "Employer not stated",
    postedAt:
      dateOnly(record.posted_at) ?? dateOnly(record.published_at) ?? dateOnly(record.created_at) ?? "",
    publishedAt: dateOnly(record.published_at),
    postalCode: record.postal_code?.trim() || undefined,
    relatedCourseSlugs: [],
    requirements: listItems(record.requirements),
    responsibilities: listItems(record.responsibilities),
    salary: record.salary_text?.trim() || "Salary not stated",
    salaryMinimum: salaryMinimum(record),
    slug: record.slug,
    sourceName: record.source_name?.trim() || "Original vacancy",
    sourceUrl: record.source_url ?? undefined,
    summary,
    summarySource: ["ai", "excerpt", "source"].includes(record.summary_source)
      ? (record.summary_source as "ai" | "excerpt" | "source")
      : "source",
    title: record.title,
  };
}
