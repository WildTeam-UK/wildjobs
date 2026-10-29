import { describe, expect, it } from "vitest";

import {
  employerSubmissionStatusLabel,
  parseEmployerSubmissionId,
  workplaceTypeLabel,
} from "../lib/admin/employer-submission-display";

describe("employer submission display", () => {
  it("maps stored workflow and workplace values to readable labels", () => {
    expect(employerSubmissionStatusLabel("ready_for_job_review")).toBe("Ready for job review");
    expect(workplaceTypeLabel("on_site")).toBe("On-site");
  });

  it.each(["0", "-1", "1.5", "SUB-12", "not-a-number", "9007199254740992"])(
    "rejects invalid record id %s",
    (value) => {
      expect(parseEmployerSubmissionId(value)).toBeNull();
    },
  );

  it("accepts a positive safe record id", () => {
    expect(parseEmployerSubmissionId("208")).toBe(208);
  });
});
