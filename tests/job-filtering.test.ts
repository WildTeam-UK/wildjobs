import { describe, expect, it } from "vitest";
import {
  filterJobs,
  jobCategories,
  rankCourseFilters,
  unspecifiedMatchCount,
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

describe("missing filter information", () => {
  const remote = { ...jobs[0], locationType: "Remote" as const };
  const unknown = {
    ...jobs[1],
    locationType: "Not specified" as const,
    hoursType: undefined,
    employmentType: "Not stated" as const,
    contractType: undefined,
    salaryMinimum: undefined,
  };
  it("keeps confirmed matches strict unless missing information is explicitly included", () => {
    expect(filterJobs([remote, unknown], filters({ locationType: "Remote" }))).toEqual([remote]);
    expect(
      filterJobs([remote, unknown], filters({ locationType: "Remote", includeUnspecified: ["workplace"] })),
    ).toEqual([remote, unknown]);
  });
  it("never treats a known conflicting workplace as unspecified", () =>
    expect(
      filterJobs(
        [{ ...remote, locationType: "Hybrid" as const }],
        filters({ locationType: "Remote", includeUnspecified: ["workplace"] }),
      ),
    ).toEqual([]));
  it("includes unknown hours, contract and salary only for their own chosen filters", () => {
    expect(
      filterJobs(
        [unknown],
        filters({
          employmentType: "Full time",
          contractType: "Permanent",
          minimumSalary: 30000,
          includeUnspecified: ["hours", "contract", "salary"],
        }),
      ),
    ).toEqual([unknown]);
    expect(
      filterJobs(
        [unknown],
        filters({ employmentType: "Full time", contractType: "Permanent", includeUnspecified: ["hours"] }),
      ),
    ).toEqual([]);
  });
  it("finds both full-time and part-time options from the source metadata", () => {
    const flexible = {
      ...remote,
      hoursType: "Full time · Part time",
      hoursTypes: ["Full time", "Part time"],
    };
    expect(filterJobs([flexible], filters({ employmentType: "Part time" }))).toEqual([flexible]);
  });
});

it("ranks confirmed matches before jobs included through missing information", () => {
  const selection = filters({ locationType: "Remote", includeUnspecified: ["workplace"] });
  expect(unspecifiedMatchCount({ ...jobs[0], locationType: "Remote" }, selection)).toBe(0);
  expect(unspecifiedMatchCount({ ...jobs[0], locationType: "Not specified" }, selection)).toBe(1);
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
