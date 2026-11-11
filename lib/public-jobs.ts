import "server-only";
import { normaliseSalary, parseSalary } from "./job-salary";
import { connection } from "next/server";
import { cache } from "react";
import type { Job, LocationType } from "./jobs";
import { createPublicClient } from "./supabase/public";
import { getPublicCourses } from "./public-courses";
import { getPublicCareerAreas } from "./public-career-areas";
import { getPublicRoleAliases } from "./public-career-roles";
import { matchCareerRole } from "./career-role-matching";
import { cleanJobTitle } from "./job-title";
import { employerPageSlugs } from "./employer-page-slug";
import { attributeTerms } from "./job-attributes";
import { getPublishedEmployerIndex } from "./public-employer-profiles";
import { getPublicOrganisations } from "./public-organisations";
import { cachePublicData, PUBLIC_DATA_PAGE_SIZE } from "./public-data-cache";
import {
  directoryDeadline,
  directoryFacts,
  isDirectoryJobLive,
  liveDirectoryDateFilter,
} from "./directory-lifecycle";

// Keep feed_text: role matching still needs the source evidence, not the AI summary.
const publicJobSelect =
  "id,slug,title,organisation_name,summary,summary_source,location_text,locality,region,country_code,workplace,hours_type,contract_type,engagement_type,salary_text,sector_slugs,course_slugs,posted_at,updated_at,closes_at,is_active,source_name,source_url,feed_text,skill_slugs,benefit_slugs";
type DirectoryJob = Awaited<ReturnType<typeof getPublicJobPage>>[number];
export async function mapDirectoryJobs(records: readonly DirectoryJob[]): Promise<readonly Job[]> {
  const [courses, sectors, organisations, roles, profiles] = await Promise.all([
    getPublicCourses(),
    getPublicCareerAreas(),
    getPublicOrganisations(),
    getPublicRoleAliases(),
    getPublishedEmployerIndex(),
  ]);
  const employers = new Map(organisations.map((o) => [o.name, o]));
  const employerSlugs = employerPageSlugs(organisations, profiles);
  const observedAt = new Date().toISOString();
  return records.map((row) => {
    const terms = sectors.filter((s) => row.sector_slugs.includes(s.slug));
    const relatedCourses = courses.filter((c) => row.course_slugs.includes(c.slug));
    const facts = directoryFacts({
      workplace: row.workplace,
      hours: row.hours_type,
      contract: row.contract_type,
    });
    const salary = parseSalary(row.salary_text);
    return {
      id: row.id,
      observedAt,
      skills: attributeTerms(row.skill_slugs ?? [], "skills"),
      benefits: attributeTerms(row.benefit_slugs ?? [], "benefits"),
      roleSlug: matchCareerRole(row.title, row.feed_text, roles.aliases).roleSlug ?? undefined,
      slug: row.slug,
      title: cleanJobTitle(row.title),
      organisation: row.organisation_name,
      employerProfileSlug: employerSlugs.get(row.organisation_name),
      employerLogoUrl: employers.get(row.organisation_name)?.logo_url ?? undefined,
      employerWebsiteUrl: employers.get(row.organisation_name)?.website_url ?? undefined,
      summary: row.summary,
      summarySource: row.summary_source === "ai" ? "ai" : "source",
      location: row.location_text,
      locationLocality: row.locality ?? undefined,
      locationRegion: row.region ?? undefined,
      countryCode: row.country_code ?? undefined,
      locationType: facts.workplace as LocationType,
      employmentType: facts.hours_type === "Part time" ? "Part time" : "Full time",
      hoursType: facts.hours_type,
      hoursTypes: facts.hours_type.split(" · "),
      contractType: facts.contract_type,
      engagementType: row.engagement_type === "Volunteer" ? "Volunteer" : "Paid",
      salary: normaliseSalary(row.salary_text, { defaultAnnual: false }),
      salaryMinimum: salary.period === "per year" ? (salary.minimum ?? undefined) : undefined,
      category: terms[0]?.title ?? "",
      careerAreas: terms.map((s) => s.title),
      careerAreaTerms: terms,
      relatedCourseSlugs: relatedCourses.map((c) => c.slug),
      relatedCourses,
      postedAt: row.posted_at,
      publishedAt: row.posted_at,
      updatedAt: row.updated_at,
      closesAt: directoryDeadline(row.posted_at, row.closes_at),
      availability: !row.is_active ? "unavailable" : isDirectoryJobLive(row) ? "current" : "expired",
      sourceName: row.source_name,
      sourceUrl: row.source_url,
    };
  });
}
const getPublicJobPage = cachePublicData("live-jobs", async (from: number, organisation?: string) => {
  const db = createPublicClient();
  let query = db
    .from("directory_jobs")
    .select(publicJobSelect)
    .eq("is_active", true)
    .is("merged_into", null)
    .or(liveDirectoryDateFilter())
    .order("posted_at", { ascending: false })
    .order("id")
    .range(from, from + PUBLIC_DATA_PAGE_SIZE - 1);
  if (organisation) query = query.eq("organisation_name", organisation);
  const { data, error } = await query;
  if (error) throw new Error("Jobs could not be loaded.");
  return data;
});

export const getPublicJobs = cache(async (organisation?: string): Promise<readonly Job[]> => {
  await connection();
  const records: DirectoryJob[] = [];
  for (let from = 0; ; from += PUBLIC_DATA_PAGE_SIZE) {
    const data = await getPublicJobPage(from, organisation);
    records.push(...data);
    if (data.length < PUBLIC_DATA_PAGE_SIZE) break;
  }
  // Expiry is evaluated on every request, even while the raw rows are cached.
  return mapDirectoryJobs(records.filter((row) => isDirectoryJobLive(row)));
});

const getPublicJobIdPage = cachePublicData("jobs-by-id", async (ids: number[]) => {
  const { data, error } = await createPublicClient()
    .from("directory_jobs")
    .select(publicJobSelect)
    .in("id", ids)
    .eq("is_active", true)
    .is("merged_into", null)
    .or(liveDirectoryDateFilter())
    .order("posted_at", { ascending: false })
    .order("id");
  if (error) throw new Error("Current guide opportunities could not be loaded.");
  return data;
});

export async function getPublicJobsByIds(ids: readonly number[]): Promise<readonly Job[]> {
  if (!ids.length) return [];
  await connection();
  const uniqueIds = [...new Set(ids)].sort((a, b) => a - b);
  const records: DirectoryJob[] = [];
  for (let from = 0; from < uniqueIds.length; from += PUBLIC_DATA_PAGE_SIZE) {
    records.push(...(await getPublicJobIdPage(uniqueIds.slice(from, from + PUBLIC_DATA_PAGE_SIZE))));
  }
  records.sort((a, b) => b.posted_at.localeCompare(a.posted_at) || a.id - b.id);
  return mapDirectoryJobs(records.filter((row) => isDirectoryJobLive(row)));
}
