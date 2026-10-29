import { describe, expect, it } from "vitest";

import { combineEvidenceChanges } from "../lib/admin/vacancy-evidence-selection";
import type { VacancyFieldEvidence } from "../lib/admin/vacancy-detail-extraction";

function evidence(
  fieldName: VacancyFieldEvidence["fieldName"],
  value: string,
  extractionMethod: VacancyFieldEvidence["extractionMethod"],
): VacancyFieldEvidence {
  return {
    confidence: 95,
    evidenceText: value,
    extractionMethod,
    extractorVersion: `${extractionMethod}-test`,
    fieldName,
    resolutionStatus: "extracted",
    sourceKind: extractionMethod === "ai" ? "source_page" : "feed",
    value,
  };
}

describe("vacancy evidence change selection", () => {
  it("keeps deterministic changes when an AI run also completes", () => {
    expect(
      combineEvidenceChanges(
        [evidence("salary_text", "£27,952.67", "deterministic")],
        [evidence("experience_level", "experienced", "ai")],
      ).map((item) => [item.fieldName, item.value]),
    ).toEqual([
      ["salary_text", "£27,952.67"],
      ["experience_level", "experienced"],
    ]);
  });

  it("uses the accepted AI change when it supersedes the same deterministic field", () => {
    expect(
      combineEvidenceChanges(
        [evidence("hours_type", "part_time", "deterministic")],
        [evidence("hours_type", "flexible", "ai")],
      ),
    ).toMatchObject([{ extractionMethod: "ai", value: "flexible" }]);
  });
});
