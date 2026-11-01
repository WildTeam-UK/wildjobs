import type { Job } from "./jobs";

export type PublicEmployerRecord = Readonly<{
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  ai_summary_source_url: string | null;
  benefits: readonly string[];
  culture: string | null;
  focus: string | null;
  locations: readonly string[];
  logo_url: string | null;
  mission: string | null;
  name: string;
  overview: string | null;
  published_at: string | null;
  reviewed_at: string | null;
  short_name: string | null;
  slug: string;
  website_url: string | null;
}>;

export type PublicEmployer = Readonly<{
  aiSummarySourceUrl?: string;
  benefits: readonly string[];
  culture?: string;
  focus: string;
  locations: readonly string[];
  logoUrl?: string;
  mission: string;
  name: string;
  openRoles: readonly Job[];
  overview: readonly string[];
  overviewIsAi: boolean;
  profileStatus: "ai-assisted" | "basic" | "reviewed";
  publishedAt?: string;
  reviewedAt?: string;
  roleCapabilities: readonly string[];
  roleCareerAreas: readonly string[];
  roleCategories: readonly string[];
  shortName: string;
  slug: string;
  websiteUrl?: string;
}>;

function paragraphs(value: string | null) {
  return (value ?? "")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function initials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1 && /^\p{Lu}{2,4}$/u.test(words[0])) return words[0];

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("en-GB");
}

function dateOnly(value: string | null) {
  return value?.slice(0, 10);
}

export function mapPublicEmployer(record: PublicEmployerRecord, jobs: readonly Job[]): PublicEmployer {
  const openRoles = jobs.filter((job) => job.employerSlug === record.slug);
  const roleLocations = openRoles
    .map((job) => job.location)
    .filter((location) => location !== "Location not stated");
  const locations = [
    ...new Set([...record.locations.map((location) => location.trim()), ...roleLocations]),
  ].filter(Boolean);

  const officialOverview = paragraphs(record.overview);
  const aiOverview = paragraphs(record.ai_summary);
  const uniqueTerms = (values: readonly (string | undefined)[]) => [
    ...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))),
  ];
  const roleCareerAreas = uniqueTerms(
    openRoles.flatMap((job) => job.careerAreaTerms?.map((term) => term.title) ?? job.careerAreas ?? []),
  );
  const roleCapabilities = uniqueTerms(
    openRoles.flatMap((job) => job.capabilities?.map((capability) => capability.title) ?? []),
  );
  const roleCategories = uniqueTerms(openRoles.map((job) => job.category));

  return {
    aiSummarySourceUrl: record.ai_summary_source_url?.trim() || undefined,
    benefits: record.benefits.map((benefit) => benefit.trim()).filter(Boolean),
    culture: record.culture?.trim() || undefined,
    focus: record.focus?.trim() || "Conservation employer",
    locations,
    logoUrl: record.logo_url?.trim() || undefined,
    mission: record.mission?.trim() || "Explore this organisation’s current conservation opportunities.",
    name: record.name,
    openRoles,
    overview: officialOverview.length ? officialOverview : aiOverview,
    overviewIsAi: !officialOverview.length && aiOverview.length > 0,
    profileStatus: record.reviewed_at ? "reviewed" : record.ai_summary_generated_at ? "ai-assisted" : "basic",
    publishedAt: dateOnly(record.published_at),
    reviewedAt: dateOnly(record.reviewed_at),
    roleCapabilities,
    roleCareerAreas,
    roleCategories,
    shortName: record.short_name?.trim() || initials(record.name),
    slug: record.slug,
    websiteUrl: record.website_url?.trim() || undefined,
  };
}
