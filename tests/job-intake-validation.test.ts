import { describe, expect, it } from "vitest";

import { toSlug, validateJobIntake } from "../lib/admin/job-intake-validation";

const validValues = {
  applicationUrl: "https://example.org/jobs/apply",
  canonicalUrl: "https://example.org/jobs/conservation-officer",
  closesAt: "2026-12-20",
  contractType: "fixed_term",
  countryCode: "gb",
  description: "A complete description of this conservation vacancy and the work involved.",
  engagementType: "paid",
  employerName: "Example Nature Trust",
  employerWebsiteUrl: "https://example.org",
  experienceLevel: "developing",
  hoursType: "full_time",
  locationText: "Bristol, United Kingdom",
  postedAt: "2026-11-01",
  requirements: "Experience working with partners.",
  responsibilities: "Coordinate practical conservation projects.",
  salaryText: "£31,000–£35,000",
  sourceId: "4",
  summary: "Coordinate practical conservation work with communities and delivery partners.",
  title: "Conservation Project Officer",
  workplaceType: "hybrid",
};

function jobForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  Object.entries({ ...validValues, ...overrides }).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("manual job intake validation", () => {
  it("normalises approved vacancy input", () => {
    const result = validateJobIntake(jobForm(), "2026-10-28");

    expect(result.data).toMatchObject({
      countryCode: "GB",
      employerSlug: "example-nature-trust",
      jobSlug: "conservation-project-officer-example-nature-trust-2026-12-20",
      sourceId: 4,
    });
  });

  it("rejects a duplicate-risk non-HTTPS source address", () => {
    expect(
      validateJobIntake(jobForm({ canonicalUrl: "http://example.org/jobs/role" }), "2026-10-28"),
    ).toEqual({ error: "Enter the HTTPS address of the original vacancy." });
  });

  it("rejects a vacancy that has already closed", () => {
    expect(validateJobIntake(jobForm({ closesAt: "2026-10-27" }), "2026-10-28")).toEqual({
      error: "The closing date must be today or later.",
    });
  });

  it("creates stable URL slugs", () => {
    expect(toSlug("People & Nature – Côte d'Ivoire")).toBe("people-nature-cote-d-ivoire");
  });

  it("stores genuinely unstated facts as null instead of guessing", () => {
    const result = validateJobIntake(
      jobForm({
        contractType: "not_specified",
        engagementType: "not_specified",
        experienceLevel: "not_specified",
        hoursType: "not_specified",
        salaryNotStated: "on",
        salaryText: "",
        workplaceType: "not_specified",
      }),
      "2026-10-28",
    );

    expect(result.data).toMatchObject({
      contractType: null,
      engagementType: null,
      experienceLevel: null,
      hoursType: null,
      salaryText: null,
      workplaceType: null,
    });
  });
});
