import { describe, expect, it } from "vitest";

import { isPublishedCapabilityBackfillCandidate } from "../lib/admin/published-capability-backfill";

const currentPolicy = "ai-structured-v11-job-taxonomy";
const record = {
  canonicalUrl: "https://example.org/jobs/project-manager",
  detailText: "The role plans and delivers conservation projects with partners.",
  enrichmentAttempts: 3,
  enrichmentPolicyVersion: "ai-structured-v9-capabilities",
  enrichmentStatus: "complete",
  jobId: 42,
};

describe("published capability backfill eligibility", () => {
  it("accepts a linked published record from an older policy", () => {
    expect(isPublishedCapabilityBackfillCandidate(record, currentPolicy)).toBe(true);
  });

  it("does not depend on the record's previous full-enrichment attempt count", () => {
    expect(isPublishedCapabilityBackfillCandidate({ ...record, enrichmentAttempts: 3 }, currentPolicy)).toBe(
      true,
    );
  });

  it("rejects unlinked, untrusted, running and current-policy records", () => {
    expect(isPublishedCapabilityBackfillCandidate({ ...record, jobId: null }, currentPolicy)).toBe(false);
    expect(isPublishedCapabilityBackfillCandidate({ ...record, detailText: null }, currentPolicy)).toBe(
      false,
    );
    expect(
      isPublishedCapabilityBackfillCandidate(
        { ...record, canonicalUrl: "http://example.org/job" },
        currentPolicy,
      ),
    ).toBe(false);
    expect(
      isPublishedCapabilityBackfillCandidate({ ...record, enrichmentStatus: "running" }, currentPolicy),
    ).toBe(false);
    expect(
      isPublishedCapabilityBackfillCandidate(
        { ...record, enrichmentPolicyVersion: currentPolicy },
        currentPolicy,
      ),
    ).toBe(false);
  });
});
