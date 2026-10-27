import type { EmploymentType, Job, LocationType } from "./jobs";

export type JobFilters = Readonly<{
  query: string;
  locationType: LocationType | "";
  employmentType: EmploymentType | "";
  category: string;
}>;

function normalise(value: string) {
  return value.trim().toLocaleLowerCase("en-GB");
}

export function filterJobs(items: readonly Job[], filters: JobFilters) {
  const query = normalise(filters.query);

  return items.filter((job) => {
    const searchable = normalise(
      [
        job.title,
        job.organisation,
        job.location,
        job.locationType,
        job.employmentType,
        job.category,
        job.summary,
      ].join(" "),
    );

    return (
      (!query || searchable.includes(query)) &&
      (!filters.locationType || job.locationType === filters.locationType) &&
      (!filters.employmentType || job.employmentType === filters.employmentType) &&
      (!filters.category || job.category === filters.category)
    );
  });
}

export function jobCategories(items: readonly Job[]) {
  return [...new Set(items.map((job) => job.category))].toSorted((left, right) => left.localeCompare(right));
}
