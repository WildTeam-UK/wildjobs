import { describe, expect, it } from "vitest";

import {
  AUTOMATION_PUBLICATION_POLICY_VERSION,
  evaluatePublicationReadiness,
  type PublicationReadinessInput,
} from "../lib/admin/automation-publication-readiness";

function readyInput(): PublicationReadinessInput {
  return {
    applicationUrl: "https://example.org/apply",
    canonicalUrl: "https://example.org/jobs/ranger",
    closesAt: "2026-11-30",
    countryCode: "GB",
    detailText: "A".repeat(200),
    duplicateCount: 0,
    employer: {
      id: 7,
      mission: "Protect nature.",
      overview: "A conservation organisation working across the United Kingdom.",
      reviewedAt: null,
      status: "draft",
      websiteUrl: "https://example.org",
    },
    employerEvidence: [
      { confidence: 91, field_name: "mission" },
      { confidence: 88, field_name: "overview" },
    ],
    enrichmentStatus: "complete",
    evidence: [
      {
        confidence: 100,
        field_name: "application_url",
        resolution_status: "extracted",
        value: "https://example.org/apply",
      },
      { confidence: 100, field_name: "closes_at", resolution_status: "extracted", value: "2026-11-30" },
      { confidence: 95, field_name: "employer_name", resolution_status: "extracted", value: "Example Trust" },
      { confidence: 95, field_name: "location_text", resolution_status: "extracted", value: "Bristol" },
      { confidence: 90, field_name: "engagement_type", resolution_status: "extracted", value: "paid" },
    ],
    jobId: null,
    locationText: "Bristol",
    mappingStatus: "unmapped",
    sourceActive: true,
    sourceTitle: "Senior Ranger",
    sourceType: "feed",
    summary: "Join the reserve team and help restore important habitats.",
    today: "2026-10-29",
  };
}

describe("automated publication readiness", () => {
  it("allows a fully evidenced vacancy without fabricating optional fields", () => {
    const result = evaluatePublicationReadiness(readyInput());

    expect(AUTOMATION_PUBLICATION_POLICY_VERSION).toBe("evidence-gated-v1");
    expect(result).toMatchObject({ blockers: [], ready: true, score: 100 });
  });

  it("blocks possible duplicates and weak required evidence", () => {
    const input = readyInput();
    input.duplicateCount = 1;
    input.evidence = input.evidence.filter((item) => item.field_name !== "engagement_type");

    const result = evaluatePublicationReadiness(input);

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(expect.arrayContaining(["duplicate_risk", "engagement_evidence_weak"]));
  });

  it("requires an evidence-backed employer profile unless staff already reviewed it", () => {
    const input = readyInput();
    input.employerEvidence = [];

    expect(evaluatePublicationReadiness(input).blockers).toContain("employer_profile_incomplete");

    input.employer = { ...input.employer!, reviewedAt: "2026-10-29T12:00:00Z" };
    expect(evaluatePublicationReadiness(input).blockers).not.toContain("employer_profile_incomplete");
  });
});
