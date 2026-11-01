import { describe, expect, it } from "vitest";

import type { CandidatePreferences } from "../lib/candidate-preferences";
import { matchJobsToPreferences, preferenceMatchScore } from "../lib/job-preference-matching";
import { jobs } from "./job-fixtures";

const preferences: CandidatePreferences = {
  careerAreaIds: [1],
  careerAreaTitles: ["Community conservation"],
  contractTypes: ["fixed_term"],
  experienceLevel: "developing",
  hasPreferences: true,
  hoursTypes: ["full_time"],
  preferenceCount: 6,
  preferredLocation: "Bristol",
  workplaceTypes: ["hybrid"],
};

describe("transparent job preference matching", () => {
  it("scores only explicit candidate choices", () => {
    const job = { ...jobs[0], contractType: "Fixed term", experienceLevel: "developing" };
    expect(preferenceMatchScore(job, preferences)).toBe(6);
  });

  it("returns stronger matching roles first and excludes unrelated roles", () => {
    const strongMatch = { ...jobs[0], contractType: "Fixed term", experienceLevel: "developing" };
    const partialMatch = { ...jobs[3], contractType: "Permanent", experienceLevel: "leadership" };
    const unrelated = {
      ...jobs[2],
      contractType: "Permanent",
      employmentType: "Part time" as const,
      experienceLevel: "experienced",
      hoursType: "Part time",
      locationType: "On-site" as const,
    };

    expect(matchJobsToPreferences([partialMatch, unrelated, strongMatch], preferences)).toEqual([
      strongMatch,
      partialMatch,
    ]);
  });

  it("does not personalise when no preferences have been saved", () => {
    expect(
      matchJobsToPreferences(jobs, {
        ...preferences,
        careerAreaIds: [],
        careerAreaTitles: [],
        contractTypes: [],
        experienceLevel: "open",
        hasPreferences: false,
        hoursTypes: [],
        preferenceCount: 0,
        preferredLocation: "",
        workplaceTypes: [],
      }),
    ).toEqual([]);
  });
});
