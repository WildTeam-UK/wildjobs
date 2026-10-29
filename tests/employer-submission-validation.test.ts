import { describe, expect, it } from "vitest";

import { validateEmployerSubmission } from "../lib/employer-submissions/validation";

const validSubmission = {
  applicationUrl: "https://example.org/jobs/apply",
  authorityConfirmed: true,
  closingDate: "2099-12-31",
  contactEmail: " Hiring@Example.org ",
  contactName: " Alex Example ",
  locationText: " Bristol ",
  organisationName: " Example Conservation Trust ",
  roleSummary: " Lead a practical programme that restores habitats with communities. ",
  roleTitle: " Conservation Programme Manager ",
  salaryText: " £38,000–£42,000 ",
  token: "a".repeat(43),
  website: "",
  workplaceType: "hybrid",
};

describe("employer submission validation", () => {
  it("normalises a complete invited submission", () => {
    expect(validateEmployerSubmission(validSubmission)).toEqual({
      data: {
        ...validSubmission,
        applicationUrl: "https://example.org/jobs/apply",
        contactEmail: "hiring@example.org",
        contactName: "Alex Example",
        locationText: "Bristol",
        organisationName: "Example Conservation Trust",
        roleSummary: "Lead a practical programme that restores habitats with communities.",
        roleTitle: "Conservation Programme Manager",
        salaryText: "£38,000–£42,000",
      },
    });
  });

  it.each([
    ["an invalid token", { token: "short" }],
    ["an invalid email", { contactEmail: "not-an-email" }],
    ["a past closing date", { closingDate: "2000-01-01" }],
    ["an unknown workplace type", { workplaceType: "somewhere" }],
    ["an insecure application URL", { applicationUrl: "http://example.org/apply" }],
    ["missing authority confirmation", { authorityConfirmed: false }],
  ])("rejects %s", (_label, changes) => {
    expect(validateEmployerSubmission({ ...validSubmission, ...changes }).error).toBeTruthy();
  });
});
