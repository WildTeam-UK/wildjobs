import { extractVacancyDetails, extractVacancyFieldEvidence } from "./vacancy-detail-extraction";

type SourceRecordDraftInput = {
  canonical_url: string | null;
  closes_at: string | null;
  employer_name: string | null;
  location_text: string | null;
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

export function buildSourceRecordDraftDefaults(record: SourceRecordDraftInput) {
  const sourceSummary = record.summary?.trim() || undefined;
  const extractedDetails = extractVacancyDetails(sourceSummary ?? null);
  const fieldEvidence = extractVacancyFieldEvidence(sourceSummary ?? null);

  return {
    applicationUrl: record.canonical_url ?? undefined,
    canonicalUrl: record.canonical_url ?? undefined,
    closesAt: record.closes_at ?? undefined,
    countryCode: "GB",
    description: sourceSummary,
    employerName: record.employer_name?.slice(0, 160) || undefined,
    locationText: record.location_text ?? undefined,
    postedAt: record.source_updated_at?.slice(0, 10),
    sourceId: record.source_id,
    fieldEvidence,
    summary: sourceSummary && sourceSummary.length >= 20 ? excerpt(sourceSummary, 500) : undefined,
    title: record.source_title?.slice(0, 180) || undefined,
    ...extractedDetails,
  };
}
