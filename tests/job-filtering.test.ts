import { describe, expect, it } from "vitest";
import { filterJobs, jobCategories, type JobFilters } from "../lib/job-filtering";
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
});
