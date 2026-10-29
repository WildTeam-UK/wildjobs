import type { EmploymentType, EngagementType, Job, LocationType } from "./jobs";

export type JobFilters = Readonly<{
  query: string;
  locationQuery: string;
  locationType: LocationType | "";
  engagementType: EngagementType | "";
  employmentType: EmploymentType | "";
  contractType: string;
  minimumSalary: number;
  category: string;
  courseSlug: string;
}>;

function normalise(value: string) {
  return value.trim().toLocaleLowerCase("en-GB");
}

export function filterJobs(items: readonly Job[], filters: JobFilters) {
  const query = normalise(filters.query);
  const locationQuery = normalise(filters.locationQuery);

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
        job.summary,
      ].join(" "),
    );

    return (
      (!query || searchable.includes(query)) &&
      (!locationQuery || normalise(job.location).includes(locationQuery)) &&
      (!filters.locationType || job.locationType === filters.locationType) &&
      (!filters.engagementType || job.engagementType === filters.engagementType) &&
      (!filters.contractType || job.contractType === filters.contractType) &&
      (!filters.minimumSalary || (job.salaryMinimum ?? 0) >= filters.minimumSalary) &&
      (!filters.employmentType ||
        [job.employmentType, job.contractType, job.hoursType].includes(filters.employmentType)) &&
      (!filters.category || job.category === filters.category) &&
      (!filters.courseSlug || job.relatedCourseSlugs.includes(filters.courseSlug))
    );
  });
}

export function jobCategories(items: readonly Job[]) {
  return [...new Set(items.map((job) => job.category))].toSorted((left, right) => left.localeCompare(right));
}
