export const AUTOMATION_PUBLICATION_POLICY_VERSION = "evidence-gated-v1";

export const automationBlockerLabels = {
  already_linked: "This source record is already linked to a WildJobs vacancy.",
  application_evidence_weak: "The application address is not supported by strong source-page evidence.",
  application_url_missing: "A secure application address is missing.",
  canonical_url_missing: "The original vacancy address is missing.",
  closing_date_missing: "The closing date is missing or has passed.",
  closing_evidence_weak: "The closing date is not supported by strong evidence.",
  country_missing: "The approved source does not yet have a default country.",
  description_missing: "The full vacancy description is missing.",
  duplicate_risk: "The vacancy may already exist and needs a person to resolve it.",
  employer_evidence_weak: "The employer identity is not supported by strong evidence.",
  employer_missing: "A canonical employer could not be matched.",
  employer_profile_incomplete: "The employer website, mission or overview is incomplete.",
  engagement_evidence_weak: "Paid or volunteer status is not supported by strong evidence.",
  enrichment_incomplete: "Vacancy enrichment has not completed cleanly.",
  location_evidence_weak: "The location is not supported by strong evidence.",
  location_missing: "The vacancy location is missing.",
  source_inactive: "The source is paused.",
  source_not_automatable: "This source type is not approved for automatic publication.",
  summary_missing: "A usable vacancy summary could not be prepared.",
  title_missing: "The vacancy title is missing.",
} as const;

export type AutomationBlockerCode = keyof typeof automationBlockerLabels;

type Evidence = {
  confidence: number;
  field_name: string;
  resolution_status: string;
  value: string | null;
};

type EmployerEvidence = {
  confidence: number;
  field_name: string;
};

export type PublicationReadinessInput = {
  applicationUrl: string | null;
  canonicalUrl: string | null;
  closesAt: string | null;
  countryCode: string | null;
  detailText: string | null;
  duplicateCount: number;
  employer: {
    id: number;
    mission: string | null;
    overview: string | null;
    reviewedAt: string | null;
    status: string;
    websiteUrl: string | null;
  } | null;
  employerEvidence: readonly EmployerEvidence[];
  enrichmentStatus: string;
  evidence: readonly Evidence[];
  jobId: number | null;
  locationText: string | null;
  mappingStatus: string;
  sourceActive: boolean;
  sourceTitle: string | null;
  sourceType: string;
  summary: string | null;
  today: string;
};

export type PublicationReadiness = {
  blockers: AutomationBlockerCode[];
  fieldConfidences: Record<string, number>;
  ready: boolean;
  score: number;
};

function isHttpsUrl(value: string | null) {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function usableText(value: string | null, minimum: number) {
  return Boolean(value?.trim() && value.trim().length >= minimum);
}

function strongestEvidence(evidence: readonly Evidence[]) {
  const confidences: Record<string, number> = {};
  for (const item of evidence) {
    if (item.resolution_status !== "extracted" || !item.value) continue;
    confidences[item.field_name] = Math.max(confidences[item.field_name] ?? 0, item.confidence);
  }
  return confidences;
}

export function evaluatePublicationReadiness(input: PublicationReadinessInput): PublicationReadiness {
  const blockers = new Set<AutomationBlockerCode>();
  const fieldConfidences = strongestEvidence(input.evidence);
  const employerConfidences = Object.fromEntries(
    input.employerEvidence.map((item) => [item.field_name, item.confidence]),
  );
  const summaryCandidate = input.summary?.trim() || input.detailText?.trim().slice(0, 500) || "";

  if (!input.sourceActive) blockers.add("source_inactive");
  if (!["feed", "api"].includes(input.sourceType)) blockers.add("source_not_automatable");
  if (!input.countryCode || !/^[A-Z]{2}$/.test(input.countryCode)) blockers.add("country_missing");
  if (input.jobId !== null) blockers.add("already_linked");
  if (input.mappingStatus !== "unmapped" || input.duplicateCount > 0) blockers.add("duplicate_risk");
  if (!["complete", "skipped"].includes(input.enrichmentStatus)) blockers.add("enrichment_incomplete");
  if (!isHttpsUrl(input.canonicalUrl)) blockers.add("canonical_url_missing");
  if (!isHttpsUrl(input.applicationUrl)) blockers.add("application_url_missing");
  if (!input.closesAt || input.closesAt < input.today) blockers.add("closing_date_missing");
  if (!usableText(input.sourceTitle, 2)) blockers.add("title_missing");
  if (!usableText(summaryCandidate, 20)) blockers.add("summary_missing");
  if (!usableText(input.detailText, 80)) blockers.add("description_missing");
  if (!usableText(input.locationText, 2)) blockers.add("location_missing");

  if ((fieldConfidences.application_url ?? 0) < 95) blockers.add("application_evidence_weak");
  if ((fieldConfidences.closes_at ?? 0) < 90) blockers.add("closing_evidence_weak");
  if ((fieldConfidences.employer_name ?? 0) < 80) blockers.add("employer_evidence_weak");
  if ((fieldConfidences.location_text ?? 0) < 80) blockers.add("location_evidence_weak");
  if ((fieldConfidences.engagement_type ?? 0) < 80) blockers.add("engagement_evidence_weak");

  if (!input.employer) {
    blockers.add("employer_missing");
  } else {
    const profileComplete =
      input.employer.status !== "archived" &&
      isHttpsUrl(input.employer.websiteUrl) &&
      usableText(input.employer.mission, 2) &&
      usableText(input.employer.overview, 20);
    const profileEvidenceStrong =
      Boolean(input.employer.reviewedAt) ||
      input.employer.status === "published" ||
      ((employerConfidences.mission ?? 0) >= 80 && (employerConfidences.overview ?? 0) >= 80);
    if (!profileComplete || !profileEvidenceStrong) blockers.add("employer_profile_incomplete");
  }

  const blockerList = [...blockers];
  const totalChecks = 18;
  const score = Math.max(0, Math.round(((totalChecks - blockerList.length) / totalChecks) * 100));
  return { blockers: blockerList, fieldConfidences, ready: blockerList.length === 0, score };
}
