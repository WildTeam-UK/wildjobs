import { describe, expect, it } from "vitest";

import {
  buildEmployerSubmissionDraftSlugs,
  validateEmployerSubmissionReviewNote,
} from "../lib/admin/employer-submission-review";

describe("employer submission review", () => {
  it("normalises an actionable review note", () => {
    const formData = new FormData();
    formData.set("reviewNote", "  Please confirm the closing date with the employer.  ");

    expect(validateEmployerSubmissionReviewNote(formData)).toEqual({
      data: { reviewNote: "Please confirm the closing date with the employer." },
    });
  });

  it("rejects a review note that is too short", () => {
    const formData = new FormData();
    formData.set("reviewNote", "Too short");

    expect(validateEmployerSubmissionReviewNote(formData)).toEqual({
      error: "Add a clear review note between 10 and 2,000 characters.",
    });
  });

  it("builds stable slugs for the private employer and job drafts", () => {
    expect(
      buildEmployerSubmissionDraftSlugs({
        closingDate: "2099-12-31",
        organisationName: "WildJobs Test Organisation",
        roleTitle: "WildJobs Submission Test — Do Not Publish",
        submissionId: 5,
      }),
    ).toEqual({
      employerSlug: "wildjobs-test-organisation",
      jobSlug: "wildjobs-submission-test-do-not-publish-wildjobs-test-organisation-2099-12-31-5",
    });
  });
});
