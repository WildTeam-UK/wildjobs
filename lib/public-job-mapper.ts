import { DEFAULT_COURSE_THEME_COLOUR } from "./courses";
import type { Job, JobLocation, JobTaxonomyTerm, RelatedCourse } from "./jobs";

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

type PublicJobCapabilityRecord = Readonly<{
  importance: string;
  relevance_score: number;
  capabilities: Readonly<{
    description: string;
    slug: string;
    title: string;
    course_capabilities: readonly Readonly<{
      courses: Readonly<{
        availability_status: string;
        is_active: boolean;
        is_filter_visible: boolean;
        public_url: string;
        short_title: string;
        slug: string;
        theme_colour: string | null;
      }> | null;
    }>[];
  }> | null;
}>;

type PublicJobOccupationRecord = Readonly<{
  is_primary: boolean;
  occupations: Readonly<{
    description: string | null;
    slug: string;
    title: string;
  }> | null;
}>;

type PublicJobBenefitRecord = Readonly<{
  benefits: Readonly<{
    description: string | null;
    slug: string;
    title: string;
  }> | null;
}>;

type PublicJobLocationRecord = Readonly<{
  address_line_1: string | null;
  address_line_2: string | null;
  country_code: string | null;
  is_primary: boolean;
  locality: string | null;
  postal_code: string | null;
  raw_text: string;
  region: string | null;
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
  job_benefits?: readonly PublicJobBenefitRecord[];
  job_capabilities?: readonly PublicJobCapabilityRecord[];
  job_locations?: readonly PublicJobLocationRecord[];
  job_occupations?: readonly PublicJobOccupationRecord[];
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

function comparableText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-GB");
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

function relatedCourses(record: PublicJobRecord): readonly RelatedCourse[] {
  const coursesBySlug = new Map<string, RelatedCourse>();

  for (const jobCapability of record.job_capabilities ?? []) {
    for (const courseCapability of jobCapability.capabilities?.course_capabilities ?? []) {
      const course = courseCapability.courses;
      if (
        !course ||
        !course.is_active ||
        !course.is_filter_visible ||
        course.availability_status !== "available" ||
        coursesBySlug.has(course.slug)
      ) {
        continue;
      }

      coursesBySlug.set(course.slug, {
        shortTitle: course.short_title,
        slug: course.slug,
        themeColour: course.theme_colour ?? DEFAULT_COURSE_THEME_COLOUR,
        trainingUrl: course.public_url,
      });
    }
  }

  return [...coursesBySlug.values()];
}

function taxonomyTerm(record: { description: string | null; slug: string; title: string }): JobTaxonomyTerm {
  return {
    description: record.description?.trim() || undefined,
    slug: record.slug,
    title: record.title,
  };
}

function jobTitle(record: PublicJobRecord, employer: PublicEmployerRecord | null) {
  let title = record.title.trim();
  const employerNames = [employer?.name, employer?.short_name]
    .map((name) => name?.trim())
    .filter((name): name is string => Boolean(name))
    .toSorted((left, right) => right.length - left.length);

  for (const employerName of employerNames) {
    const escapedName = employerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    title = title
      .replace(new RegExp(`(?:\\s+with\\s+|\\s+at\\s+|\\s*[-|–—]\\s*)${escapedName}$`, "i"), "")
      .trim();
  }

  return title || record.title;
}

function jobLocations(record: PublicJobRecord): readonly JobLocation[] {
  return (record.job_locations ?? [])
    .toSorted((left, right) => Number(right.is_primary) - Number(left.is_primary))
    .map((location) => ({
      addressLine1: location.address_line_1?.trim() || undefined,
      addressLine2: location.address_line_2?.trim() || undefined,
      countryCode: location.country_code?.trim() || undefined,
      isPrimary: location.is_primary,
      label: location.raw_text.trim(),
      locality: location.locality?.trim() || undefined,
      postalCode: location.postal_code?.trim() || undefined,
      region: location.region?.trim() || undefined,
    }));
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
    (paragraph) => comparableText(paragraph) !== comparableText(summary),
  );
  const courses = relatedCourses(record);
  const occupations = (record.job_occupations ?? [])
    .filter((relation) => relation.occupations)
    .toSorted((left, right) => Number(right.is_primary) - Number(left.is_primary))
    .flatMap((relation) => (relation.occupations ? [taxonomyTerm(relation.occupations)] : []));
  const capabilities = (record.job_capabilities ?? [])
    .filter((relation) => relation.capabilities)
    .toSorted((left, right) => right.relevance_score - left.relevance_score)
    .flatMap((relation) => (relation.capabilities ? [taxonomyTerm(relation.capabilities)] : []));
  const benefits = (record.job_benefits ?? []).flatMap((relation) =>
    relation.benefits ? [taxonomyTerm(relation.benefits)] : [],
  );

  return {
    availability: availability(record),
    applicationUrl: record.application_url ?? undefined,
    applicationLabel: applicationLabel(record),
    benefits,
    capabilities,
    category,
    careerAreaTerms: careerAreas.flatMap((relation) =>
      relation.career_areas
        ? [
            {
              slug: relation.career_areas.slug,
              title: relation.career_areas.title,
            },
          ]
        : [],
    ),
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
    locations: jobLocations(record),
    organisation: employer?.short_name?.trim() || employer?.name?.trim() || "Employer not stated",
    occupations,
    postedAt:
      dateOnly(record.posted_at) ?? dateOnly(record.published_at) ?? dateOnly(record.created_at) ?? "",
    publishedAt: dateOnly(record.published_at),
    postalCode: record.postal_code?.trim() || undefined,
    relatedCourses: courses,
    relatedCourseSlugs: courses.map((course) => course.slug),
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
    title: jobTitle(record, employer),
  };
}
