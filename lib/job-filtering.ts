import type { EmploymentType, EngagementType, Job, LocationType } from "./jobs";
import type { Course } from "./courses";
export type JobFilters = Readonly<{
  query: string;
  locationQuery: string;
  locationType: LocationType | "";
  engagementType: EngagementType | "";
  employmentType: EmploymentType | "";
  contractType: string;
  minimumSalary: number;
  category: string;
  courseSlugs: readonly string[];
}>;
function normalise(value: string) {
  return value.trim().toLocaleLowerCase("en-GB");
}
export function filterJobs(items: readonly Job[], filters: JobFilters) {
  const query = normalise(filters.query),
    locationQuery = normalise(filters.locationQuery);
  return items.filter((job) => {
    const searchable = normalise(
      [
        job.title,
        job.organisation,
        job.location,
        job.locationType,
        job.employmentType,
        job.contractType ?? "",
        job.hoursType ?? "",
        job.category,
        ...(job.careerAreas ?? []),
        job.summary,
      ].join(" "),
    );
    const location = normalise(
      [job.location, job.locationLocality ?? "", job.locationRegion ?? "", job.countryCode ?? ""].join(" "),
    );
    const matchesCountry =
      ["gb", "great britain", "uk", "united kingdom"].includes(locationQuery) && job.countryCode === "GB";
    return (
      (!query || searchable.includes(query)) &&
      (!locationQuery || location.includes(locationQuery) || matchesCountry) &&
      (!filters.locationType || job.locationType === filters.locationType) &&
      (!filters.engagementType || job.engagementType === filters.engagementType) &&
      (!filters.contractType || job.contractType === filters.contractType) &&
      (!filters.minimumSalary || (job.salaryMinimum ?? 0) >= filters.minimumSalary) &&
      (!filters.employmentType ||
        [job.employmentType, job.contractType, job.hoursType, ...(job.hoursTypes ?? [])].includes(
          filters.employmentType,
        )) &&
      (!filters.category ||
        job.category === filters.category ||
        job.careerAreas?.includes(filters.category)) &&
      (!filters.courseSlugs.length ||
        filters.courseSlugs.some((slug) => job.relatedCourseSlugs.includes(slug)))
    );
  });
}
export function jobCategories(items: readonly Job[]) {
  return [
    ...new Set(items.flatMap((j) => (j.careerAreas?.length ? j.careerAreas : [j.category])).filter(Boolean)),
  ].toSorted((a, b) => a.localeCompare(b));
}
export function rankCourseFilters(courses: readonly Course[], jobs: readonly Job[]) {
  return courses
    .map((course) => ({
      ...course,
      count: jobs.filter((job) => job.relatedCourseSlugs.includes(course.slug)).length,
    }))
    .toSorted((a, b) => b.count - a.count || a.shortTitle.localeCompare(b.shortTitle));
}
