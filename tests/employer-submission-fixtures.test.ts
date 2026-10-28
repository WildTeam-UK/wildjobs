import { describe, expect, it } from "vitest";
import { employerSubmissionById, employerSubmissions } from "../lib/employer-submission-fixtures";

describe("employer submission fixtures", () => {
  it("uses unique submission identifiers", () => {
    expect(new Set(employerSubmissions.map((submission) => submission.id)).size).toBe(
      employerSubmissions.length,
    );
  });

  it("finds a submission by its review identifier", () => {
    expect(employerSubmissionById("SUB-207")?.status).toBe("Changes requested");
  });
});
