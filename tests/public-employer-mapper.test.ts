import { describe, expect, it } from "vitest";

import type { Job } from "../lib/jobs";
import { mapPublicEmployer, type PublicEmployerRecord } from "../lib/public-employer-mapper";

const employer: PublicEmployerRecord = {
  ai_summary: null,
  ai_summary_generated_at: null,
  ai_summary_source_url: null,
  benefits: ["Flexible working"],
  culture: "A collaborative conservation team.",
  focus: null,
  locations: ["Slimbridge"],
  logo_url: "https://example.org/logo.svg",
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
      logoUrl: "https://example.org/logo.svg",
      reviewedAt: "2026-10-27",
      shortName: "WWT",
      websiteUrl: "https://example.org",
    });
    expect(result.locations).toEqual(["Slimbridge", "London, United Kingdom"]);
    expect(result.openRoles).toEqual([job]);
    expect(result.overview).toEqual(["First paragraph.", "Second paragraph."]);
    expect(result.profileStatus).toBe("reviewed");
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

  it("uses a clearly identified AI overview when official copy is unavailable", () => {
    const result = mapPublicEmployer(
      {
        ...employer,
        ai_summary: "A conservation charity working with communities to restore local habitats.",
        ai_summary_generated_at: "2026-10-29T12:00:00Z",
        ai_summary_source_url: "https://example.org/jobs/ranger",
        overview: null,
      },
      [],
    );

    expect(result).toMatchObject({
      aiSummarySourceUrl: "https://example.org/jobs/ranger",
      overview: ["A conservation charity working with communities to restore local habitats."],
      overviewIsAi: true,
      profileStatus: "reviewed",
    });
  });

  it("marks unreviewed enrichment as AI-assisted and derives role themes from live jobs", () => {
    const enrichedJob = {
      ...job,
      capabilities: [{ slug: "stakeholder-engagement", title: "Stakeholder engagement" }],
      careerAreaTerms: [{ slug: "community-conservation", title: "Community conservation" }],
      category: "Programme management",
    } as Job;
    const result = mapPublicEmployer(
      {
        ...employer,
        ai_summary: "A profile assembled from public organisation information.",
        ai_summary_generated_at: "2026-10-29T12:00:00Z",
        reviewed_at: null,
      },
      [enrichedJob],
    );

    expect(result.profileStatus).toBe("ai-assisted");
    expect(result.roleCapabilities).toEqual(["Stakeholder engagement"]);
    expect(result.roleCareerAreas).toEqual(["Community conservation"]);
    expect(result.roleCategories).toEqual(["Programme management"]);
  });

  it("preserves a short organisation acronym as its monogram", () => {
    expect(mapPublicEmployer({ ...employer, name: "WWT" }, []).shortName).toBe("WWT");
  });
});
