import { describe, expect, it } from "vitest";

import { capabilityCoverage, uniqueIds } from "../lib/admin/capability-admin";

describe("capability admin reporting", () => {
  it("deduplicates nullable relationship identifiers", () => {
    expect(uniqueIds([3, null, 3, 8, null])).toEqual([3, 8]);
  });

  it("separates matched, unmatched and awaiting published jobs", () => {
    expect(
      capabilityCoverage({
        classifiedJobIds: [1, 2, 2, 99],
        matchedJobIds: [2, 2, 99],
        publishedJobIds: [1, 2, 3],
      }),
    ).toEqual({
      awaitingClassification: 1,
      classifiedWithoutMatch: 1,
      matchedJobs: 1,
      publishedJobs: 3,
    });
  });
});
