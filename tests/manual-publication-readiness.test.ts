import { describe, expect, it } from "vitest";

import { manualPublicationChecks } from "../lib/admin/manual-publication-readiness";

const completeInput = {
  employer: {
    mission: "Protect nature.",
    overview: "A conservation charity.",
    websiteUrl: "https://example.org",
  },
  job: {
    applicationUrl: "https://example.org/apply",
    closesAt: "2026-11-30",
    description: "Full vacancy description",
    locationText: "London",
    status: "in_review",
    summary: "A useful role summary",
  },
  sources: [{ canonicalUrl: "https://example.org/jobs/1", verifiedAt: "2026-11-01T10:00:00Z" }],
  today: "2026-11-01",
} as const;

describe("manual publication readiness", () => {
  it("passes the same four groups required by manual publication", () => {
    expect(manualPublicationChecks(completeInput).every((check) => check.ready)).toBe(true);
  });

  it("explains draft, expired, unverified-source and employer-profile blockers", () => {
    const checks = manualPublicationChecks({
      ...completeInput,
      employer: { mission: null, overview: null, websiteUrl: null },
      job: { ...completeInput.job, closesAt: "2026-10-31", status: "draft" },
      sources: [{ canonicalUrl: "https://example.org/jobs/1", verifiedAt: null }],
    });

    expect(checks.map((check) => [check.key, check.ready])).toEqual([
      ["status", false],
      ["vacancy", false],
      ["source", false],
      ["employer", false],
    ]);
  });
});
