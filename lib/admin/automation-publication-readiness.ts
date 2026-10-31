import { employerIdentityConflicts } from "./employer-identity";

export const AUTOMATION_PUBLICATION_POLICY_VERSION = "canonical-draft-v2-taxonomy";

export function publicationControlAllowsSource(input: {
  databaseEnabled: boolean;
  environmentEnabled: boolean;
  sourceRecordId: number;
  targetSourceRecordId: number | null;
}) {
  return (
    input.environmentEnabled &&
    input.databaseEnabled &&
    (input.targetSourceRecordId === null || input.targetSourceRecordId === input.sourceRecordId)
  );
}

export const automationBlockerLabels = {
  application_evidence_weak: "The application address is not supported by strong source-page evidence.",
  application_url_missing: "A secure application address is missing.",
  canonical_url_missing: "The original vacancy address is missing.",
  career_area_missing: "The vacancy does not have an evidence-backed career area.",
  closing_date_missing: "The closing date is missing or has passed.",
  closing_evidence_weak: "The closing date is not supported by strong evidence.",
  country_missing: "The approved source does not yet have a default country.",
  description_missing: "The full vacancy description is missing.",
  draft_missing: "A private canonical vacancy draft has not been created.",
  duplicate_risk: "The vacancy may already exist and needs a person to resolve it.",
  employer_evidence_weak: "The employer identity is not supported by strong evidence.",
  employer_identity_conflict: "The canonical employer conflicts with the source-page evidence.",
  employer_missing: "A canonical employer could not be matched.",
  employer_profile_incomplete: "The employer website, mission or overview is incomplete.",
  engagement_evidence_weak: "Paid or volunteer status is not supported by strong evidence.",
  engagement_salary_conflict: "The paid or volunteer classification conflicts with the advertised salary.",
  engagement_missing: "The vacancy is not classified as paid or volunteer.",
  enrichment_incomplete: "Vacancy enrichment has not completed cleanly.",
  location_evidence_weak: "The location is not supported by strong evidence.",
  location_missing: "The vacancy location is missing.",
  occupation_missing: "The vacancy does not have an evidence-backed canonical occupation.",
  listing_expired: "The vacancy has closed or exceeded its 30-day fallback lifetime.",
  source_inactive: "The source is paused.",
  source_not_automatable: "This source type is not approved for automatic publication.",
  source_permission_unapproved: "This source is not approved for full vacancy-description display.",
  summary_missing: "A usable vacancy summary could not be prepared.",
  structured_location_missing: "The vacancy does not have a structured searchable location.",
  title_missing: "The vacancy title is missing.",
  workplace_missing: "The vacancy is not classified as on-site, hybrid or remote.",
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
  careerAreaCount: number;
  closesAt: string | null;
  countryCode: string | null;
  detailText: string | null;
  descriptionDisplayMode: string;
  duplicateCount: number;
  employer: {
    id: number;
    name: string;
    mission: string | null;
    overview: string | null;
    reviewedAt: string | null;
    status: string;
    websiteUrl: string | null;
  } | null;
  employerEvidence: readonly EmployerEvidence[];
  enrichmentStatus: string;
  evidence: readonly Evidence[];
  firstSeenAt: string;
  jobId: number | null;
  locationText: string | null;
  mappingStatus: string;
  occupationCount: number;
  sourceActive: boolean;
  sourceEmployerName: string | null;
  sourceEmployerWebsiteUrl: string | null;
  sourceTitle: string | null;
  sourceType: string;
  summary: string | null;
  structuredLocationCount: number;
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

function addDays(value: string, days: number) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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
  const effectiveExpiry = input.closesAt ?? addDays(input.firstSeenAt, 30);

  if (!input.sourceActive) blockers.add("source_inactive");
  if (!["feed", "api"].includes(input.sourceType)) blockers.add("source_not_automatable");
  if (!input.countryCode || !/^[A-Z]{2}$/.test(input.countryCode)) blockers.add("country_missing");
  if (input.descriptionDisplayMode !== "full") blockers.add("source_permission_unapproved");
  if (input.jobId === null) blockers.add("draft_missing");
  if (input.mappingStatus !== "mapped" || input.duplicateCount > 0) blockers.add("duplicate_risk");
  if (!["complete", "skipped"].includes(input.enrichmentStatus)) blockers.add("enrichment_incomplete");
  if (!isHttpsUrl(input.canonicalUrl)) blockers.add("canonical_url_missing");
  if (!isHttpsUrl(input.applicationUrl) && !isHttpsUrl(input.canonicalUrl)) {
    blockers.add("application_url_missing");
  }
  if (effectiveExpiry < input.today) blockers.add("listing_expired");
  if (!usableText(input.sourceTitle, 2)) blockers.add("title_missing");
  if (!usableText(input.summary, 20)) blockers.add("summary_missing");
  if (!usableText(input.detailText, 80)) blockers.add("description_missing");
  if (input.careerAreaCount < 1) blockers.add("career_area_missing");
  if (input.occupationCount < 1) blockers.add("occupation_missing");
  if (input.structuredLocationCount < 1) blockers.add("structured_location_missing");

  const salaryEvidence = input.evidence.find(
    (item) => item.field_name === "salary_text" && item.resolution_status === "extracted" && item.value,
  );
  const engagementEvidence = input.evidence.find(
    (item) => item.field_name === "engagement_type" && item.resolution_status === "extracted" && item.value,
  );
  const workplaceEvidence = input.evidence.find(
    (item) => item.field_name === "workplace_type" && item.resolution_status === "extracted" && item.value,
  );
  if (!engagementEvidence) blockers.add("engagement_missing");
  if (!workplaceEvidence) blockers.add("workplace_missing");
  if (salaryEvidence && engagementEvidence?.value === "volunteer") {
    blockers.add("engagement_salary_conflict");
  }

  if (!input.employer) {
    blockers.add("employer_missing");
  } else if (input.employer.status === "archived") {
    blockers.add("employer_missing");
  } else if (
    employerIdentityConflicts(
      { name: input.sourceEmployerName, websiteUrl: input.sourceEmployerWebsiteUrl },
      { name: input.employer.name, websiteUrl: input.employer.websiteUrl },
    )
  ) {
    blockers.add("employer_identity_conflict");
  }

  const blockerList = [...blockers];
  const totalChecks = 20;
  const score = Math.max(0, Math.round(((totalChecks - blockerList.length) / totalChecks) * 100));
  return { blockers: blockerList, fieldConfidences, ready: blockerList.length === 0, score };
}
