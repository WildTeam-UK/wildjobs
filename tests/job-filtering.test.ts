import { describe, expect, it } from "vitest";
import { filterJobs, jobCategories } from "../lib/job-filtering";
import { jobs } from "../lib/jobs";

describe("job filtering", () => {
  it("searches across role, organisation, location and summary text", () => {
    expect(
      filterJobs(jobs, {
        query: "ecological datasets",
        locationType: "",
        employmentType: "",
        category: "",
      }).map((job) => job.slug),
    ).toEqual(["biodiversity-data-analyst"]);
  });

  it("combines structured filters", () => {
    expect(
      filterJobs(jobs, { query: "", locationType: "Hybrid", employmentType: "Full time", category: "" }).map(
        (job) => job.slug,
      ),
    ).toEqual(["community-conservation-coordinator", "forest-programme-manager"]);
  });

  it("returns stable alphabetical categories", () => {
    expect(jobCategories(jobs)).toEqual(
      [...jobCategories(jobs)].sort((left, right) => left.localeCompare(right)),
    );
  });
});
