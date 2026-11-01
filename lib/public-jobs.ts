import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import type { Job, LocationType } from "./jobs";
import type { Database } from "./supabase/database.types";
import { createPublicClient } from "./supabase/public";
import { getPublicCourses } from "./public-courses";
import { getPublicCareerAreas } from "./public-career-areas";

type DirectoryJob = Database["public"]["Tables"]["directory_jobs"]["Row"];
export async function mapDirectoryJobs(records: readonly DirectoryJob[]): Promise<readonly Job[]> {
  const [courses, sectors, organisations] = await Promise.all([
    getPublicCourses(),
    getPublicCareerAreas(),
    createPublicClient().from("directory_organisations").select("name,logo_url"),
  ]);
  if (organisations.error) throw new Error("Organisation logos could not be loaded.");
  const logos = new Map(organisations.data.map((o) => [o.name, o.logo_url]));
  return records.map((row) => {
    const terms = sectors.filter((s) => row.sector_slugs.includes(s.slug));
    const relatedCourses = courses.filter((c) => row.course_slugs.includes(c.slug));
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      organisation: row.organisation_name,
      employerLogoUrl: logos.get(row.organisation_name) ?? undefined,
      summary: row.summary,
      summarySource: row.summary_source === "ai" ? "ai" : "source",
      location: row.location_text,
      locationLocality: row.locality ?? undefined,
      locationRegion: row.region ?? undefined,
      countryCode: row.country_code ?? undefined,
      locationType: row.workplace as LocationType,
      employmentType:
        row.hours_type === "Part time"
          ? "Part time"
          : row.hours_type === "Full time"
            ? "Full time"
            : "Not stated",
      hoursType: row.hours_type ?? undefined,
      hoursTypes: row.hours_type?.split(" · "),
      contractType: row.contract_type ?? undefined,
      engagementType: row.engagement_type === "Volunteer" ? "Volunteer" : "Paid",
      salary: row.salary_text,
      salaryMinimum: row.salary_text.includes("per year") ? (row.salary_min ?? undefined) : undefined,
      category: terms[0]?.title ?? "",
      careerAreas: terms.map((s) => s.title),
      careerAreaTerms: terms,
      relatedCourseSlugs: relatedCourses.map((c) => c.slug),
      relatedCourses,
      postedAt: row.posted_at,
      publishedAt: row.posted_at,
      updatedAt: row.updated_at,
      availability: row.is_active ? "current" : "unavailable",
      sourceName: "EnvironmentJob",
      sourceUrl: row.source_url,
    };
  });
}
export const getPublicJobs = cache(async (): Promise<readonly Job[]> => {
  await connection();
  const { data, error } = await createPublicClient()
    .from("directory_jobs")
    .select("*")
    .eq("is_active", true)
    .order("posted_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Jobs could not be loaded.");
  return mapDirectoryJobs(data);
});
