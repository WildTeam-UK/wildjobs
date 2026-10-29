import { describe, expect, it } from "vitest";

import {
  AUTOMATION_PUBLICATION_POLICY_VERSION,
  evaluatePublicationReadiness,
  publicationControlAllowsSource,
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
      name: "Example Trust",
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
    firstSeenAt: "2026-10-20T09:00:00Z",
    jobId: null,
    locationText: "Bristol",
    mappingStatus: "unmapped",
    sourceActive: true,
    sourceEmployerName: "Example Trust",
    sourceEmployerWebsiteUrl: "https://example.org",
    sourceTitle: "Senior Ranger",
    sourceType: "feed",
    summary: "Join the reserve team and help restore important habitats.",
    today: "2026-10-29",
  };
}

describe("automated publication readiness", () => {
  it("allows a fully evidenced vacancy without fabricating optional fields", () => {
    const result = evaluatePublicationReadiness(readyInput());

    expect(AUTOMATION_PUBLICATION_POLICY_VERSION).toBe("evidence-gated-v5");
    expect(result).toMatchObject({ blockers: [], ready: true, score: 100 });
  });

  it("allows only the selected source record during a controlled live test", () => {
    const control = { databaseEnabled: true, environmentEnabled: true, targetSourceRecordId: 17 };

    expect(publicationControlAllowsSource({ ...control, sourceRecordId: 17 })).toBe(true);
    expect(publicationControlAllowsSource({ ...control, sourceRecordId: 36 })).toBe(false);
    expect(publicationControlAllowsSource({ ...control, databaseEnabled: false, sourceRecordId: 17 })).toBe(
      false,
    );
  });

  it("blocks possible duplicates but not absent optional classification evidence", () => {
    const input = readyInput();
    input.duplicateCount = 1;
    input.evidence = input.evidence.filter((item) => item.field_name !== "engagement_type");

    const result = evaluatePublicationReadiness(input);

    expect(result.ready).toBe(false);
    expect(result.blockers).toEqual(["duplicate_risk"]);
  });

  it("does not block on an incomplete employer profile", () => {
    const input = readyInput();
    input.employerEvidence = [];
    input.employer = {
      ...input.employer!,
      mission: null,
      overview: null,
      websiteUrl: null,
    };

    expect(evaluatePublicationReadiness(input)).toMatchObject({ blockers: [], ready: true });
  });

  it("uses the canonical vacancy page when a separate application address is absent", () => {
    const input = readyInput();
    input.applicationUrl = null;

    expect(evaluatePublicationReadiness(input)).toMatchObject({ blockers: [], ready: true });
  });

  it("allows an unknown closing date for 30 days and then expires the listing", () => {
    const input = readyInput();
    input.closesAt = null;

    expect(evaluatePublicationReadiness(input)).toMatchObject({ blockers: [], ready: true });

    input.today = "2026-11-20";
    expect(evaluatePublicationReadiness(input)).toMatchObject({
      blockers: ["listing_expired"],
      ready: false,
    });
  });

  it("blocks a canonical employer that conflicts with the source-page identity", () => {
    const input = readyInput();
    input.sourceEmployerName = "Regional Flood & Coastal Committees";
    input.sourceEmployerWebsiteUrl = "https://www.gov.uk/government/organisations/environment-agency";
    input.employer = {
      ...input.employer!,
      name: "Natural England",
      websiteUrl: "https://www.gov.uk/government/organisations/natural-england",
    };

    expect(evaluatePublicationReadiness(input)).toMatchObject({
      blockers: ["employer_identity_conflict"],
      ready: false,
    });
  });

  it("accepts a recognised employer acronym when the website also agrees", () => {
    const input = readyInput();
    input.sourceEmployerName = "RSPB";
    input.sourceEmployerWebsiteUrl = "https://www.rspb.org.uk/careers";
    input.employer = {
      ...input.employer!,
      name: "Royal Society for the Protection of Birds",
      websiteUrl: "https://www.rspb.org.uk",
    };

    expect(evaluatePublicationReadiness(input)).toMatchObject({ blockers: [], ready: true });
  });

  it("blocks a volunteer classification when the advert contains salary evidence", () => {
    const input = readyInput();
    input.evidence = [
      ...input.evidence.map((item) =>
        item.field_name === "engagement_type" ? { ...item, value: "volunteer" } : item,
      ),
      {
        confidence: 95,
        field_name: "salary_text",
        resolution_status: "extracted",
        value: "£28,000 to £30,000",
      },
    ];

    expect(evaluatePublicationReadiness(input)).toMatchObject({
      blockers: ["engagement_salary_conflict"],
      ready: false,
    });
  });
});
