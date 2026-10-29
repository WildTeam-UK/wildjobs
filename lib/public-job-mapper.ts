import type { Job } from "./jobs";

type PublicEmployerRecord = Readonly<{
  name: string;
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
  application_url: string | null;
  closes_at: string | null;
  contract_type: string | null;
  country_code: string | null;
  created_at: string;
  description: string | null;
  employers: PublicEmployerRecord | null;
  hours_type: string | null;
  job_career_areas: readonly PublicCareerAreaRecord[];
  location_text: string | null;
  posted_at: string | null;
  published_at: string | null;
  region: string | null;
  requirements: string | null;
  responsibilities: string | null;
  salary_text: string | null;
  slug: string;
  summary: string | null;
  title: string;
  workplace_type: string | null;
}>;

const workplaceLabels = {
  hybrid: "Hybrid",
  on_site: "On-site",
  remote: "Remote",
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

export function mapPublicJob(record: PublicJobRecord): Job {
  const description = paragraphs(record.description);
  const careerAreas = record.job_career_areas
    .filter((relation) => relation.career_areas)
    .toSorted((left, right) => Number(right.is_primary) - Number(left.is_primary));
  const category = careerAreas[0]?.career_areas?.title ?? "Conservation";
  const contractType = jobTypeLabel(record.contract_type);
  const hoursType = jobTypeLabel(record.hours_type);
  const employer = record.employers;
  const summary = record.summary?.trim() || description[0] || "View the full vacancy details.";

  return {
    applicationUrl: record.application_url ?? undefined,
    category,
    closesAt: dateOnly(record.closes_at) ?? "",
    contractType,
    countryCode: record.country_code ?? undefined,
    description: description.length ? description : [summary],
    employerSlug: employer?.slug,
    employmentType: hoursType ?? contractType ?? "Not stated",
    hoursType,
    location: record.location_text?.trim() || record.region?.trim() || "Location not stated",
    locationType: workplaceLabels[record.workplace_type as keyof typeof workplaceLabels] ?? "Not specified",
    organisation: employer?.short_name?.trim() || employer?.name?.trim() || "Employer not stated",
    postedAt:
      dateOnly(record.posted_at) ?? dateOnly(record.published_at) ?? dateOnly(record.created_at) ?? "",
    publishedAt: dateOnly(record.published_at),
    relatedCourseSlugs: [],
    requirements: listItems(record.requirements),
    responsibilities: listItems(record.responsibilities),
    salary: record.salary_text?.trim() || "Salary not stated",
    slug: record.slug,
    sourceName: employer?.short_name?.trim() || employer?.name?.trim() || "Original vacancy",
    sourceUrl: record.application_url ?? undefined,
    summary,
    title: record.title,
  };
}
