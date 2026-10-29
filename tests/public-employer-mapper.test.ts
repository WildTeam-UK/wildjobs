import { describe, expect, it } from "vitest";

import type { Job } from "../lib/jobs";
import { mapPublicEmployer, type PublicEmployerRecord } from "../lib/public-employer-mapper";

const employer: PublicEmployerRecord = {
  benefits: ["Flexible working"],
  culture: "A collaborative conservation team.",
  focus: null,
  locations: ["Slimbridge"],
  mission: "Protect wetlands and the wildlife and communities that depend on them.",
  name: "Wetland Wildlife Trust",
  overview: "First paragraph.\n\nSecond paragraph.",
  published_at: "2026-10-28T12:00:00Z",
  reviewed_at: "2026-10-27T12:00:00Z",
  short_name: null,
  slug: "wetland-wildlife-trust",
  website_url: "https://example.org",
};

const job = {
  employerSlug: employer.slug,
  location: "London, United Kingdom",
  slug: "wetland-role",
} as Job;

describe("public employer mapping", () => {
  it("maps reviewed content and connects current roles", () => {
    const result = mapPublicEmployer(employer, [job]);

    expect(result).toMatchObject({
      focus: "Conservation employer",
      reviewedAt: "2026-10-27",
      shortName: "WWT",
      websiteUrl: "https://example.org",
    });
    expect(result.locations).toEqual(["Slimbridge", "London, United Kingdom"]);
    expect(result.openRoles).toEqual([job]);
    expect(result.overview).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("uses honest fallbacks without inventing employer facts", () => {
    const result = mapPublicEmployer(
      {
        ...employer,
        benefits: [],
        culture: null,
        locations: [],
        mission: null,
        overview: null,
        website_url: null,
      },
      [],
    );

    expect(result).toMatchObject({
      benefits: [],
      culture: undefined,
      locations: [],
      mission: "Explore this organisation’s current conservation opportunities.",
      overview: [],
      websiteUrl: undefined,
    });
  });

  it("preserves a short organisation acronym as its monogram", () => {
    expect(mapPublicEmployer({ ...employer, name: "WWT" }, []).shortName).toBe("WWT");
  });
});
