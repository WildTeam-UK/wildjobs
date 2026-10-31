import { describe, expect, it } from "vitest";

import {
  canonicalJobLocationFallback,
  normaliseTaxonomyCandidateTitle,
  selectExactCapabilityMatches,
  selectExactOccupationMatch,
  selectStructuredLocations,
  selectTaxonomyCandidates,
  selectTaxonomyMatches,
  taxonomyClassificationNeedsReview,
} from "../lib/admin/job-taxonomy-enrichment";

const source = "We are recruiting a Park Ranger in Norwich, Norfolk. A generous pension is provided.";

describe("job taxonomy enrichment", () => {
  it("adds conservative exact capability matches without accepting short incidental aliases", () => {
    expect(
      selectExactCapabilityMatches(
        [
          { aliases: ["programme delivery"], id: 1, title: "Project management" },
          { aliases: ["M&E"], id: 6, title: "Monitoring and evaluation" },
          { aliases: [], id: 7, title: "Stakeholder engagement" },
        ],
        "Lead programme delivery and stakeholder engagement across the partnership.",
      ),
    ).toEqual([
      expect.objectContaining({ capabilityId: 1, evidence: "programme delivery" }),
      expect.objectContaining({ capabilityId: 7, evidence: "stakeholder engagement" }),
    ]);
  });

  it("prefers the most specific occupation phrase in the vacancy title", () => {
    const occupations = [
      { aliases: [], id: 91, title: "Gardener" },
      { aliases: [], id: 98, title: "Project manager" },
      { aliases: ["Park ranger"], id: 100, title: "Ranger" },
    ];

    expect(
      selectExactOccupationMatch(
        occupations,
        "Garsdale - Hawes Project Manager with Yorkshire Dales National Park Authority",
      ),
    ).toEqual([
      { confidence: 100, evidence: "Project Manager", originalText: "Project Manager", termId: 98 },
    ]);
    expect(selectExactOccupationMatch(occupations, "Assistant Ranger with Kent County Council")).toEqual([
      { confidence: 100, evidence: "Ranger", originalText: "Ranger", termId: 100 },
    ]);
    expect(selectExactOccupationMatch(occupations, "Gardener (Newhailes) with National Trust")).toEqual([
      { confidence: 100, evidence: "Gardener", originalText: "Gardener", termId: 91 },
    ]);
    expect(selectExactOccupationMatch(occupations, "Ranger engagement officer")).toEqual([]);
  });

  it("holds a classification for review when its core occupation or career area is missing", () => {
    expect(taxonomyClassificationNeedsReview({ careerAreaMatches: [], occupationMatches: [{}] })).toBe(true);
    expect(taxonomyClassificationNeedsReview({ careerAreaMatches: [{}], occupationMatches: [{}] })).toBe(
      false,
    );
  });

  it("preserves a reviewed canonical job location when AI cannot quote one from the source page", () => {
    expect(
      canonicalJobLocationFallback({
        countryCode: "GB",
        locality: null,
        locationText: "Slimbridge, Gloucestershire, United Kingdom",
        postalCode: null,
        region: null,
      }),
    ).toMatchObject({
      assignment_source: "deterministic",
      country_code: "GB",
      precision: "country",
      raw_text: "Slimbridge, Gloucestershire, United Kingdom",
    });
    expect(
      canonicalJobLocationFallback({
        countryCode: null,
        locality: null,
        locationText: "Field location to be agreed",
        postalCode: null,
        region: null,
      }),
    ).toBeNull();
  });

  it("keeps only evidence-backed matches from the supplied catalogue", () => {
    expect(
      selectTaxonomyMatches(
        [
          { confidence: 92, evidence: "Park Ranger", originalText: "Park Ranger", termId: 4 },
          { confidence: 99, evidence: "Park Ranger", originalText: null, termId: 99 },
          { confidence: 59, evidence: "pension", originalText: null, termId: 5 },
        ],
        new Set([4, 5]),
        source,
        2,
      ),
    ).toEqual([{ confidence: 92, evidence: "Park Ranger", originalText: "Park Ranger", termId: 4 }]);
  });

  it("normalises and deduplicates unmatched concepts for review", () => {
    expect(normaliseTaxonomyCandidateTitle("  Grants & Partnerships Lead  ")).toBe(
      "grants and partnerships lead",
    );
    expect(
      selectTaxonomyCandidates(
        [
          {
            confidence: 88,
            evidence: "Park Ranger",
            originalText: null,
            taxonomyType: "occupation",
            title: "Protected Areas Ranger",
          },
          {
            confidence: 90,
            evidence: "Park Ranger",
            originalText: null,
            taxonomyType: "occupation",
            title: "protected areas ranger",
          },
        ],
        source,
      ),
    ).toHaveLength(1);
  });

  it("keeps only structured locations whose raw wording and evidence appear in the advert", () => {
    expect(
      selectStructuredLocations(
        [
          {
            addressLine1: null,
            addressLine2: null,
            confidence: 90,
            countryCode: "GB",
            evidence: "Norwich, Norfolk",
            locality: "Norwich",
            postalCode: null,
            precision: "locality",
            rawText: "Norwich, Norfolk",
            region: "Norfolk",
          },
          {
            addressLine1: null,
            addressLine2: null,
            confidence: 95,
            countryCode: "GB",
            evidence: "London",
            locality: "London",
            postalCode: null,
            precision: "locality",
            rawText: "London",
            region: null,
          },
        ],
        source,
      ),
    ).toHaveLength(1);
  });
});
