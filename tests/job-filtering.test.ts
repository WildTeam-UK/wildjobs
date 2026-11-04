import { describe, expect, it } from "vitest";
import {
  filterJobs,
  jobCategories,
  jobCountries,
  rankCourseFilters,
  type JobFilters,
} from "../lib/job-filtering";
import { jobs } from "./job-fixtures";

function filters(overrides: Partial<JobFilters> = {}): JobFilters {
  return {
    category: "",
    contractType: "",
    courseSlugs: [],
    employmentType: "",
    engagementType: "",
    locationQuery: "",
    locationType: "",
    minimumSalary: 0,
    query: "",
    ...overrides,
  };
}

describe("job filtering", () => {
  it("searches across role, organisation, location and summary text", () => {
    expect(filterJobs(jobs, filters({ query: "ecological datasets" })).map((job) => job.slug)).toEqual([
      "biodiversity-data-analyst",
    ]);
  });

  it("combines structured filters", () => {
    expect(
      filterJobs(jobs, filters({ locationType: "Hybrid", employmentType: "Full time" })).map(
        (job) => job.slug,
      ),
    ).toEqual(["community-conservation-coordinator", "forest-programme-manager"]);
  });

  it("finds roles related to any selected WildTeam course", () => {
    expect(
      filterJobs(jobs, filters({ courseSlugs: ["monitoring-and-evaluation", "project-management"] })).map(
        (job) => job.slug,
      ),
    ).toEqual([
      "community-conservation-coordinator",
      "marine-restoration-officer",
      "biodiversity-data-analyst",
      "forest-programme-manager",
    ]);
  });

  it("matches both working hours and contract types", () => {
    const liveJob = {
      ...jobs[0],
      contractType: "Fixed term",
      hoursType: "Full time",
    };

    expect(filterJobs([liveJob], filters({ employmentType: "Fixed term" }))).toEqual([liveJob]);
  });

  it("filters by opportunity, advertised location, contract and salary", () => {
    const paidJob = {
      ...jobs[0],
      contractType: "Permanent",
      engagementType: "Paid" as const,
      salary: "£31,000 – £35,000 per year",
      salaryMinimum: 31_000,
    };

    expect(
      filterJobs(
        [paidJob, jobs[1]],
        filters({
          contractType: "Permanent",
          engagementType: "Paid",
          locationQuery: "Bristol",
          minimumSalary: 30_000,
        }),
      ),
    ).toEqual([paidJob]);
  });

  it("searches structured localities, regions and the United Kingdom country label", () => {
    const bathJob = {
      ...jobs[0],
      countryCode: "GB",
      location: "BA1 1AA",
      locationLocality: "Bath",
      locationRegion: "Somerset",
    };

    expect(filterJobs([bathJob], filters({ locationQuery: "Bath" }))).toEqual([bathJob]);
    expect(filterJobs([bathJob], filters({ locationQuery: "Somerset" }))).toEqual([bathJob]);
    expect(filterJobs([bathJob], filters({ locationQuery: "United Kingdom" }))).toEqual([bathJob]);
  });

  it("returns stable alphabetical categories", () => {
    expect(jobCategories(jobs)).toEqual(
      [...jobCategories(jobs)].sort((left, right) => left.localeCompare(right)),
    );
  });

  it("filters by advertised country rather than country names in job text", () => {
    const uk = { ...jobs[0], countryCode: "GB" };
    const canada = { ...jobs[1], countryCode: "CA", summary: "Work with United Kingdom partners" };
    const unknown = { ...jobs[2], countryCode: undefined };
    const items = [uk, canada, unknown];
    expect(filterJobs(items, filters({ countryCode: " gb " }))).toEqual([uk]);
    expect(filterJobs(items, filters({ countryCode: "CA" }))).toEqual([canada]);
    expect(filterJobs(items, filters({ countryCode: "" }))).toEqual(items);
  });

  it("combines country with workplace filters without treating remote jobs as worldwide", () => {
    const ukRemote = { ...jobs[0], countryCode: "GB", locationType: "Remote" as const };
    const usRemote = { ...jobs[1], countryCode: "US", locationType: "Remote" as const };
    const ukOnSite = { ...jobs[2], countryCode: "GB", locationType: "On-site" as const };
    expect(
      filterJobs([ukRemote, usRemote, ukOnSite], filters({ countryCode: "GB", locationType: "Remote" })),
    ).toEqual([ukRemote]);
  });

  it("offers each advertised country once, with readable names", () => {
    expect(
      jobCountries([
        { ...jobs[0], countryCode: " gb " },
        { ...jobs[1], countryCode: "GB" },
        { ...jobs[2], countryCode: "KE" },
        { ...jobs[0], countryCode: undefined },
      ]),
    ).toEqual([
      { label: "Kenya", value: "KE" },
      { label: "United Kingdom", value: "GB" },
    ]);
  });
});

it("does not include an unknown salary in a minimum salary selection", () => {
  expect(filterJobs([{ ...jobs[0], salaryMinimum: undefined }], filters({ minimumSalary: 30000 }))).toEqual(
    [],
  );
});
it("keeps international jobs visible but excludes foreign, hourly and upper-bound pay from GBP thresholds", () => {
  const items = [
    { ...jobs[0], salary: "£35,000 per year", salaryMinimum: 35000 },
    { ...jobs[0], salary: "USD 90,000 per year", salaryMinimum: 90000 },
    { ...jobs[0], salary: "€80,000 per year", salaryMinimum: 80000 },
    { ...jobs[0], salary: "$80,000 per year", salaryMinimum: 80000 },
    { ...jobs[0], salary: "£35 per hour", salaryMinimum: 35000 },
    { ...jobs[0], salary: "Up to £50,000 per year", salaryMinimum: 50000 },
  ];
  expect(filterJobs(items, filters())).toEqual(items);
  expect(filterJobs(items, filters({ minimumSalary: 30000 }))).toEqual([items[0]]);
});
it("finds both full-time and part-time options from the source metadata", () => {
  const flexible = { ...jobs[0], hoursType: "Full time · Part time", hoursTypes: ["Full time", "Part time"] };
  expect(filterJobs([flexible], filters({ employmentType: "Part time" }))).toEqual([flexible]);
  expect(filterJobs([flexible], filters({ employmentType: "Full time" }))).toEqual([flexible]);
});
it("orders course options by matching job count, then alphabetically", () => {
  const course = (slug: string, title: string) => ({
    slug,
    title,
    shortTitle: title,
    summary: "",
    trainingUrl: "https://example.test",
    themeColour: "#000000",
  });
  expect(
    rankCourseFilters(
      [course("b", "Beta"), course("a", "Alpha"), course("c", "Gamma")],
      [
        { ...jobs[0], relatedCourseSlugs: ["a", "b"] },
        { ...jobs[1], relatedCourseSlugs: ["b"] },
      ],
    ).map((c) => [c.slug, c.count]),
  ).toEqual([
    ["b", 2],
    ["a", 1],
    ["c", 0],
  ]);
});
