import { describe, expect, it } from "vitest";

import { validateJobReview } from "../lib/admin/job-review-validation";

const validValues = {
  applicationUrl: "https://example.org/jobs/apply",
  canonicalUrl: "https://example.org/jobs/conservation-officer",
  closesAt: "2026-12-20",
  contractType: "fixed_term",
  countryCode: "gb",
  description: "A complete description of this conservation vacancy and the work involved.",
  engagementType: "paid",
  employerMission: "Restore important habitats and help wildlife and communities thrive together.",
  employerOverview: "Example Nature Trust is a conservation charity working with communities and partners.",
  employerWebsiteUrl: "https://example.org",
  experienceLevel: "developing",
  hoursType: "full_time",
  locationText: "Bristol, United Kingdom",
  locationLocality: "Bristol",
  locationRegion: "City of Bristol",
  postalCode: "BS1 5AH",
  postedAt: "2026-11-01",
  requirements: "Experience working with partners.",
  responsibilities: "Coordinate practical conservation projects.",
  salaryText: "£31,000–£35,000",
  summary: "Coordinate practical conservation work with communities and delivery partners.",
  title: "Conservation Project Officer",
  workplaceType: "hybrid",
};

function reviewForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  Object.entries({ ...validValues, ...overrides }).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("job review validation", () => {
  it("accepts a complete publication-ready review", () => {
    const result = validateJobReview(reviewForm(), "2026-10-28");
    expect(result.data).toMatchObject({
      countryCode: "GB",
      employerWebsiteUrl: "https://example.org",
      locationLocality: "Bristol",
      locationRegion: "City of Bristol",
      postalCode: "BS1 5AH",
    });
  });

  it("requires a meaningful employer overview", () => {
    expect(validateJobReview(reviewForm({ employerOverview: "Too short" }), "2026-10-28")).toEqual({
      error: "Add an employer overview between 40 and 1,200 characters.",
    });
  });

  it("rejects an expired vacancy", () => {
    expect(validateJobReview(reviewForm({ closesAt: "2026-10-27" }), "2026-10-28")).toEqual({
      error: "The closing date must be today or later.",
    });
  });

  it("accepts explicit not-stated fallbacks without creating false facts", () => {
    const result = validateJobReview(
      reviewForm({
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
