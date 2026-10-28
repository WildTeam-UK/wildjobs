import { describe, expect, it } from "vitest";
import { employerByName, employerBySlug, employers, jobsForEmployer } from "../lib/employers";
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
        courseSlug: "",
      }).map((job) => job.slug),
    ).toEqual(["biodiversity-data-analyst"]);
  });

  it("combines structured filters", () => {
    expect(
      filterJobs(jobs, {
        query: "",
        locationType: "Hybrid",
        employmentType: "Full time",
        category: "",
        courseSlug: "",
      }).map((job) => job.slug),
    ).toEqual(["community-conservation-coordinator", "forest-programme-manager"]);
  });

  it("finds roles related to a WildTeam course", () => {
    expect(
      filterJobs(jobs, {
        query: "",
        locationType: "",
        employmentType: "",
        category: "",
        courseSlug: "monitoring-and-evaluation",
      }).map((job) => job.slug),
    ).toEqual(["marine-restoration-officer", "biodiversity-data-analyst", "forest-programme-manager"]);
  });

  it("matches both working hours and contract types", () => {
    const liveJob = {
      ...jobs[0],
      contractType: "Fixed term",
      hoursType: "Full time",
    };

    expect(
      filterJobs([liveJob], {
        query: "",
        locationType: "",
        employmentType: "Fixed term",
        category: "",
        courseSlug: "",
      }),
    ).toEqual([liveJob]);
  });

  it("returns stable alphabetical categories", () => {
    expect(jobCategories(jobs)).toEqual(
      [...jobCategories(jobs)].sort((left, right) => left.localeCompare(right)),
    );
  });
});

describe("employer profiles", () => {
  it("provides one profile for every fixture employer", () => {
    expect(jobs.every((job) => employerByName(job.organisation))).toBe(true);
    expect(employers.every((employer) => employerBySlug(employer.slug))).toBe(true);
  });

  it("connects an employer profile to its roles", () => {
    expect(jobsForEmployer("Example Coastal Trust").map((job) => job.slug)).toEqual([
      "marine-restoration-officer",
    ]);
  });
});
