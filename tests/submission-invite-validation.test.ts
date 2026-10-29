import { describe, expect, it } from "vitest";

import { validateSubmissionInvite } from "../lib/admin/submission-invite-validation";

function inviteForm(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("submission invitation validation", () => {
  it("normalises a valid work email and optional employer", () => {
    expect(
      validateSubmissionInvite(inviteForm({ employerId: "12", inviteeEmail: " Hiring@Example.org " })),
    ).toEqual({ data: { employerId: 12, inviteeEmail: "hiring@example.org" } });
  });

  it("allows an invitation before an employer is matched", () => {
    expect(
      validateSubmissionInvite(inviteForm({ employerId: "", inviteeEmail: "jobs@example.org" })),
    ).toEqual({
      data: { employerId: null, inviteeEmail: "jobs@example.org" },
    });
  });

  it.each([
    { employerId: "", inviteeEmail: "not-an-email" },
    { employerId: "-1", inviteeEmail: "jobs@example.org" },
    { employerId: "1.5", inviteeEmail: "jobs@example.org" },
    { employerId: "not-a-record", inviteeEmail: "jobs@example.org" },
  ])("rejects invalid invitation input %#", (values) => {
    expect(validateSubmissionInvite(inviteForm(values)).error).toBeTruthy();
  });
});
