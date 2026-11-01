import type { EmploymentType, EngagementType, Job, LocationType } from "./jobs";
import type { Course } from "./courses";
export type SparseJobField = "workplace" | "hours" | "contract" | "salary";
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
  includeUnspecified?: readonly SparseJobField[];
}>;
function normalise(value: string) {
  return value.trim().toLocaleLowerCase("en-GB");
}
export function isJobFieldUnspecified(job: Job, field: SparseJobField) {
  if (field === "workplace") return job.locationType === "Not specified";
  if (field === "hours")
    return !job.hoursType && (!job.employmentType || job.employmentType === "Not stated");
  if (field === "contract") return !job.contractType;
  return job.salaryMinimum === undefined;
}
export function unspecifiedMatchCount(job: Job, filters: JobFilters) {
  return (filters.includeUnspecified ?? []).filter(
    (field) =>
      isJobFieldUnspecified(job, field) &&
      Boolean(
        field === "workplace"
          ? filters.locationType
          : field === "hours"
            ? filters.employmentType
            : field === "contract"
              ? filters.contractType
              : filters.minimumSalary,
      ),
  ).length;
}
export function filterJobs(items: readonly Job[], filters: JobFilters) {
  const query = normalise(filters.query),
    locationQuery = normalise(filters.locationQuery);
  const includeUnknown = (job: Job, field: SparseJobField) =>
    filters.includeUnspecified?.includes(field) && isJobFieldUnspecified(job, field);
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
      (!filters.locationType ||
        job.locationType === filters.locationType ||
        includeUnknown(job, "workplace")) &&
      (!filters.engagementType || job.engagementType === filters.engagementType) &&
      (!filters.contractType ||
        job.contractType === filters.contractType ||
        includeUnknown(job, "contract")) &&
      (!filters.minimumSalary ||
        (job.salaryMinimum ?? 0) >= filters.minimumSalary ||
        includeUnknown(job, "salary")) &&
      (!filters.employmentType ||
        [job.employmentType, job.contractType, job.hoursType, ...(job.hoursTypes ?? [])].includes(
          filters.employmentType,
        ) ||
        includeUnknown(job, "hours")) &&
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
