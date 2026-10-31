import { describe, expect, it } from "vitest";

import {
  normaliseTaxonomyCandidateTitle,
  selectStructuredLocations,
  selectTaxonomyCandidates,
  selectTaxonomyMatches,
} from "../lib/admin/job-taxonomy-enrichment";

const source = "We are recruiting a Park Ranger in Norwich, Norfolk. A generous pension is provided.";

describe("job taxonomy enrichment", () => {
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
