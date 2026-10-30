import { validateJobIntake } from "./job-intake-validation";
import {
  extractVacancyDetails,
  extractVacancyFieldEvidence,
  type VacancyFieldEvidence,
  type VacancyFieldName,
} from "./vacancy-detail-extraction";

type StoredEvidence = {
  confidence: number;
  evidence_text: string | null;
  extraction_method: string;
  extractor_version: string;
  field_name: string;
  resolution_status: string;
  source_kind: string;
  value: string | null;
};

type SourceRecordDraftInput = {
  application_url?: string | null;
  canonical_url: string | null;
  closes_at: string | null;
  detail_text?: string | null;
  employer_name: string | null;
  employer_website_url?: string | null;
  job_source_field_evidence?: StoredEvidence[];
  location_locality?: string | null;
  location_region?: string | null;
  location_text: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  source_id: number;
  source_title: string | null;
  source_updated_at: string | null;
  summary: string | null;
};

function excerpt(value: string, maximum: number) {
  const text = value.trim();
  if (text.length <= maximum) return text;

  const candidate = text.slice(0, maximum - 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const cutoff = lastSpace > maximum * 0.75 ? lastSpace : candidate.length;
  return `${candidate.slice(0, cutoff).trimEnd()}…`;
}

function normaliseStoredEvidence(items: StoredEvidence[] | undefined): VacancyFieldEvidence[] {
  return (items ?? []).flatMap((item) => {
    const fieldName = item.field_name as VacancyFieldName;
    if (
      ![
        "application_url",
        "closes_at",
        "contract_type",
        "employer_name",
        "employer_website_url",
        "engagement_type",
        "experience_level",
        "hours_type",
        "location_text",
        "salary_text",
        "workplace_type",
      ].includes(fieldName)
    ) {
      return [];
    }

    return [
      {
        confidence: item.confidence,
        evidenceText: item.evidence_text,
        extractionMethod: item.extraction_method as VacancyFieldEvidence["extractionMethod"],
        extractorVersion: item.extractor_version,
        fieldName,
        resolutionStatus: item.resolution_status as VacancyFieldEvidence["resolutionStatus"],
        sourceKind: item.source_kind as VacancyFieldEvidence["sourceKind"],
        value: item.value,
      },
    ];
  });
}

function acceptedValue(evidence: VacancyFieldEvidence[], fieldName: VacancyFieldName) {
  const item = evidence.find(
    (candidate) =>
      candidate.fieldName === fieldName &&
      candidate.resolutionStatus === "extracted" &&
      candidate.confidence >= 70 &&
      candidate.value,
  );
  return item?.value ?? undefined;
}

export function buildSourceRecordDraftDefaults(record: SourceRecordDraftInput) {
  const sourceSummary = record.summary?.trim() || undefined;
  const detailText = record.detail_text?.trim() || sourceSummary;
  const extractedDetails = extractVacancyDetails(detailText ?? null);
  const storedEvidence = normaliseStoredEvidence(record.job_source_field_evidence);
  const fieldEvidence = storedEvidence.length
    ? storedEvidence
    : extractVacancyFieldEvidence(detailText ?? null);
  const summarySource = sourceSummary && sourceSummary.length >= 20 ? sourceSummary : detailText;

  return {
    applicationUrl:
      record.application_url ??
      acceptedValue(fieldEvidence, "application_url") ??
      record.canonical_url ??
      undefined,
    canonicalUrl: record.canonical_url ?? undefined,
    closesAt: acceptedValue(fieldEvidence, "closes_at") ?? record.closes_at ?? undefined,
    contractType: acceptedValue(fieldEvidence, "contract_type") ?? extractedDetails.contractType,
    countryCode: record.country_code ?? "GB",
    description: detailText ? excerpt(detailText, 20_000) : undefined,
    engagementType: acceptedValue(fieldEvidence, "engagement_type") ?? extractedDetails.engagementType,
    employerName:
      (acceptedValue(fieldEvidence, "employer_name") ?? record.employer_name)?.slice(0, 160) || undefined,
    employerWebsiteUrl:
      record.employer_website_url ?? acceptedValue(fieldEvidence, "employer_website_url") ?? undefined,
    experienceLevel: acceptedValue(fieldEvidence, "experience_level") ?? extractedDetails.experienceLevel,
    fieldEvidence,
    hoursType: acceptedValue(fieldEvidence, "hours_type") ?? extractedDetails.hoursType,
    locationText: acceptedValue(fieldEvidence, "location_text") ?? record.location_text ?? undefined,
    locationLocality: record.location_locality ?? undefined,
    locationRegion: record.location_region ?? undefined,
    postalCode: record.postal_code ?? undefined,
    postedAt: record.source_updated_at?.slice(0, 10),
    salaryText: acceptedValue(fieldEvidence, "salary_text") ?? extractedDetails.salaryText,
    sourceId: record.source_id,
    summary: summarySource && summarySource.length >= 20 ? excerpt(summarySource, 500) : undefined,
    title: record.source_title?.slice(0, 180) || undefined,
    workplaceType: acceptedValue(fieldEvidence, "workplace_type") ?? extractedDetails.workplaceType,
  };
}

export function prepareSourceRecordJobInput(
  defaults: ReturnType<typeof buildSourceRecordDraftDefaults>,
  today?: string,
) {
  const values = {
    applicationUrl: defaults.applicationUrl ?? "",
    canonicalUrl: defaults.canonicalUrl ?? "",
    closesAt: defaults.closesAt ?? "",
    contractType: defaults.contractType ?? "not_specified",
    countryCode: defaults.countryCode,
    description: defaults.description ?? "",
    engagementType: defaults.engagementType ?? "not_specified",
    employerName: defaults.employerName ?? "",
    employerWebsiteUrl: defaults.employerWebsiteUrl ?? "",
    experienceLevel: defaults.experienceLevel ?? "not_specified",
    hoursType: defaults.hoursType ?? "not_specified",
    locationText: defaults.locationText ?? "",
    locationLocality: defaults.locationLocality ?? "",
    locationRegion: defaults.locationRegion ?? "",
    postalCode: defaults.postalCode ?? "",
    postedAt: defaults.postedAt ?? "",
    requirements: "",
    responsibilities: "",
    salaryText: defaults.salaryText ?? "",
    sourceId: String(defaults.sourceId),
    summary: defaults.summary ?? "",
    title: defaults.title ?? "",
    workplaceType: defaults.workplaceType ?? "not_specified",
  };
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  if (!defaults.salaryText) formData.set("salaryNotStated", "on");

  return validateJobIntake(formData, today);
}
