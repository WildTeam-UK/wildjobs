const BACKFILL_STATUSES = new Set(["complete", "needs_review", "skipped"]);

export type PublishedCapabilityBackfillRecord = {
  canonicalUrl: string | null;
  detailText: string | null;
  enrichmentAttempts: number;
  enrichmentPolicyVersion: string | null;
  enrichmentStatus: string;
  jobId: number | null;
};

export function isPublishedCapabilityBackfillCandidate(
  record: PublishedCapabilityBackfillRecord,
  policyVersion: string,
) {
  return Boolean(
    record.jobId &&
    record.canonicalUrl?.startsWith("https://") &&
    record.detailText?.trim() &&
    BACKFILL_STATUSES.has(record.enrichmentStatus) &&
    record.enrichmentPolicyVersion !== policyVersion,
  );
}
