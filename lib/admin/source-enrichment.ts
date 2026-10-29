import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AI_ENRICHMENT_POLICY_VERSION,
  enrichWithAi,
  isAiEnrichmentEnabled,
  type AiEmployerSuggestion,
} from "./ai-vacancy-enrichment";
import { evaluateAndMaybePublishSourceRecord } from "./automation-publication";
import { fetchApprovedVacancyPage, fetchEmployerPage, SourcePageError } from "./source-page-fetch";
import {
  parseEmployerPage,
  parseVacancyPage,
  SOURCE_PAGE_EXTRACTOR_VERSION,
  type VacancyPageExtraction,
} from "./vacancy-page-extraction";
import type { VacancyFieldEvidence, VacancyFieldName } from "./vacancy-detail-extraction";
import type { Database } from "../supabase/database.types";

const CORE_FIELDS = [
  "contract_type",
  "engagement_type",
  "experience_level",
  "hours_type",
  "location_text",
  "salary_text",
  "workplace_type",
] as const satisfies readonly VacancyFieldName[];

type EnrichmentTrigger = "automation" | "manual";
type EnrichmentErrorCode = Database["public"]["Tables"]["job_source_records"]["Row"]["enrichment_error_code"];
type SourceRecord = Database["public"]["Tables"]["job_source_records"]["Row"] & {
  job_sources: {
    authoritative_base_url: string | null;
    is_active: boolean;
    name: string;
    source_type: string;
  } | null;
};
type Employer = Database["public"]["Tables"]["employers"]["Row"];

export type SourceEnrichmentResult =
  | { status: "idle" }
  | {
      publication?: Awaited<ReturnType<typeof evaluateAndMaybePublishSourceRecord>>;
      recordId: number;
      runId: number;
      status: "completed" | "failed" | "needs_review" | "skipped";
    };

const DETERMINISTIC_ENRICHMENT_POLICY_VERSION = `${SOURCE_PAGE_EXTRACTOR_VERSION}-only`;

function positiveLimit(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

async function readAiBudget(supabase: SupabaseClient<Database>) {
  if (!isAiEnrichmentEnabled()) return { allowed: false, reason: "disabled" as const };
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("source_enrichment_runs")
    .select("input_tokens, output_tokens")
    .eq("ai_attempted", true)
    .gte("started_at", start.toISOString());
  if (error) throw new Error("AI usage could not be checked safely.");
  const requestLimit = positiveLimit(process.env.AI_DAILY_REQUEST_LIMIT, 25, 1_000);
  const inputLimit = positiveLimit(process.env.AI_DAILY_INPUT_TOKEN_LIMIT, 250_000, 10_000_000);
  const outputLimit = positiveLimit(process.env.AI_DAILY_OUTPUT_TOKEN_LIMIT, 40_000, 2_000_000);
  const usage = (data ?? []).reduce(
    (total, run) => ({
      input: total.input + run.input_tokens,
      output: total.output + run.output_tokens,
    }),
    { input: 0, output: 0 },
  );
  return {
    allowed: (data?.length ?? 0) < requestLimit && usage.input < inputLimit && usage.output < outputLimit,
    reason: "daily_limit" as const,
  };
}

function digest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function domainFromUrl(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLocaleLowerCase("en-GB");
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en-GB")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "employer"
  );
}

function evidence(
  fieldName: VacancyFieldName,
  value: string | null,
  sourceKind: VacancyFieldEvidence["sourceKind"],
  confidence: number,
  extractorVersion: string,
): VacancyFieldEvidence {
  return {
    confidence: value ? confidence : 0,
    evidenceText: value,
    extractionMethod: "deterministic",
    extractorVersion,
    fieldName,
    resolutionStatus: value ? "extracted" : "unresolved",
    sourceKind,
    value,
  };
}

function mergeEvidence(
  current: readonly Database["public"]["Tables"]["job_source_field_evidence"]["Row"][],
  candidates: readonly VacancyFieldEvidence[],
) {
  const byField = new Map(current.map((item) => [item.field_name, item]));
  const selected: VacancyFieldEvidence[] = [];

  const salaryAmountCount = (value: string | null) => value?.match(/(?:£|GBP\s*)[\d,.]+/gi)?.length ?? 0;

  for (const candidate of candidates) {
    const existing = byField.get(candidate.fieldName);
    if (existing?.extraction_method === "manual") continue;
    if (candidate.resolutionStatus === "unresolved" && existing?.resolution_status === "extracted") {
      continue;
    }
    if (
      candidate.resolutionStatus === "extracted" &&
      existing?.resolution_status === "extracted" &&
      existing.confidence > candidate.confidence
    ) {
      continue;
    }
    if (
      candidate.fieldName === "salary_text" &&
      candidate.resolutionStatus === "extracted" &&
      existing?.resolution_status === "extracted" &&
      existing.confidence === candidate.confidence &&
      salaryAmountCount(existing.value) > salaryAmountCount(candidate.value)
    ) {
      continue;
    }
    selected.push(candidate);
    byField.set(candidate.fieldName, {
      confidence: candidate.confidence,
      created_at: existing?.created_at ?? new Date().toISOString(),
      evidence_text: candidate.evidenceText,
      extraction_method: candidate.extractionMethod,
      extractor_version: candidate.extractorVersion,
      field_name: candidate.fieldName,
      resolution_status: candidate.resolutionStatus,
      source_kind: candidate.sourceKind,
      source_record_id: existing?.source_record_id ?? 0,
      updated_at: new Date().toISOString(),
      value: candidate.value,
    });
  }
  return { byField, selected };
}

async function claimSourceRecord(
  supabase: SupabaseClient<Database>,
  trigger: EnrichmentTrigger,
  allowAiBackfill: boolean,
  requestedRecordId?: number,
) {
  const baseQuery = () =>
    supabase
      .from("job_source_records")
      .select("*, job_sources!inner(name, source_type, authoritative_base_url, is_active)")
      .is("job_id", null)
      .in("mapping_status", ["unmapped", "possible_duplicate"])
      .lt("enrichment_attempts", 3);

  let candidateResult = requestedRecordId
    ? await baseQuery()
        .eq("id", requestedRecordId)
        .in("enrichment_status", ["pending", "needs_review", "failed", "complete", "skipped"])
        .maybeSingle()
    : await baseQuery().eq("enrichment_status", "pending").order("first_seen_at").limit(1).maybeSingle();

  if (!candidateResult.data && !requestedRecordId && allowAiBackfill) {
    candidateResult = await baseQuery()
      .in("enrichment_status", ["complete", "needs_review", "skipped"])
      .or(`enrichment_policy_version.is.null,enrichment_policy_version.neq.${AI_ENRICHMENT_POLICY_VERSION}`)
      .order("first_seen_at")
      .limit(1)
      .maybeSingle();
  }

  const { data: candidate, error } = candidateResult;
  if (error) throw new Error("Pending enrichment records could not be read.");
  if (!candidate) return null;

  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from("job_source_records")
    .update({
      enrichment_attempts: candidate.enrichment_attempts + 1,
      enrichment_error_code: null,
      enrichment_last_attempted_at: now,
      enrichment_status: "running",
    })
    .eq("id", candidate.id)
    .eq("enrichment_attempts", candidate.enrichment_attempts)
    .eq("enrichment_status", candidate.enrichment_status)
    .select("*, job_sources!inner(name, source_type, authoritative_base_url, is_active)")
    .maybeSingle();
  if (claimError) throw new Error("The enrichment record could not be claimed.");
  if (!claimed) return null;

  const { data: run, error: runError } = await supabase
    .from("source_enrichment_runs")
    .insert({
      content_hash: claimed.content_hash,
      source_record_id: claimed.id,
      trigger_type: trigger,
    })
    .select("id")
    .single();
  if (runError || !run) {
    await supabase
      .from("job_source_records")
      .update({ enrichment_status: "pending" })
      .eq("id", claimed.id)
      .eq("enrichment_status", "running");
    return null;
  }
  return { record: claimed as SourceRecord, runId: run.id };
}

async function uniqueEmployerSlug(supabase: SupabaseClient<Database>, name: string) {
  const base = slugify(name);
  const { data, error } = await supabase
    .from("employers")
    .select("slug")
    .or(`slug.eq.${base},slug.like.${base}-%`)
    .limit(1_000);
  if (error) throw new Error("Employer identities could not be checked.");
  const used = new Set((data ?? []).map((item) => item.slug));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

async function resolveEmployer(
  supabase: SupabaseClient<Database>,
  record: SourceRecord,
  page: VacancyPageExtraction,
) {
  const name = page.employerName ?? record.employer_name;
  const websiteUrl = page.employerWebsiteUrl ?? record.employer_website_url;
  const domain = domainFromUrl(websiteUrl);
  let employer: Employer | null = null;

  if (record.employer_id) {
    const result = await supabase.from("employers").select("*").eq("id", record.employer_id).maybeSingle();
    if (result.error) throw new Error("The matched employer could not be read.");
    employer = result.data;
  }

  if (!employer && (name || domain)) {
    const result = await supabase.from("employers").select("*").limit(2_000);
    if (result.error) throw new Error("Employers could not be matched.");
    employer =
      (result.data ?? []).find((candidate) => domain && candidate.website_domain === domain) ??
      (result.data ?? []).find(
        (candidate) =>
          name && candidate.name.trim().toLocaleLowerCase("en-GB") === name.trim().toLocaleLowerCase("en-GB"),
      ) ??
      null;
  }

  if (!employer && name) {
    const slug = await uniqueEmployerSlug(supabase, name);
    const result = await supabase
      .from("employers")
      .insert({
        name: name.trim().slice(0, 200),
        slug,
        status: "draft",
        website_domain: domain,
        website_url: websiteUrl,
      })
      .select("*")
      .single();
    if (result.error) throw new Error("The employer record could not be prepared.");
    employer = result.data;
  }

  return employer;
}

async function persistEmployerEnrichment(
  supabase: SupabaseClient<Database>,
  employer: Employer,
  input: {
    logoUrl: string | null;
    sourceUrl: string | null;
    suggestions: readonly AiEmployerSuggestion[];
    websiteUrl: string | null;
  },
) {
  if (employer.status === "published" || employer.reviewed_at) return employer;
  const suggestions = new Map(input.suggestions.map((item) => [item.fieldName, item]));
  const locations = input.suggestions
    .filter((item) => item.fieldName === "locations")
    .map((item) => item.value);
  const benefits = input.suggestions
    .filter((item) => item.fieldName === "benefits")
    .map((item) => item.value);
  const update: Database["public"]["Tables"]["employers"]["Update"] = {
    benefits: employer.benefits.length ? employer.benefits : [...new Set(benefits)],
    culture: employer.culture ?? suggestions.get("culture")?.value ?? null,
    enriched_at: new Date().toISOString(),
    focus: employer.focus ?? suggestions.get("focus")?.value ?? null,
    locations: employer.locations.length ? employer.locations : [...new Set(locations)],
    logo_source_url: employer.logo_source_url ?? (input.logoUrl ? input.sourceUrl : null),
    logo_url: employer.logo_url ?? input.logoUrl,
    mission: employer.mission ?? suggestions.get("mission")?.value ?? null,
    overview: employer.overview ?? suggestions.get("overview")?.value ?? null,
    profile_source_url: employer.profile_source_url ?? input.sourceUrl,
    website_domain: employer.website_domain ?? domainFromUrl(input.websiteUrl),
    website_url: employer.website_url ?? input.websiteUrl,
  };
  const { data, error } = await supabase
    .from("employers")
    .update(update)
    .eq("id", employer.id)
    .select("*")
    .single();
  if (error) throw new Error("Employer enrichment could not be saved.");

  const evidenceRows: Database["public"]["Tables"]["employer_field_evidence"]["Insert"][] = [];
  if (input.websiteUrl && input.sourceUrl) {
    evidenceRows.push({
      confidence: 95,
      employer_id: employer.id,
      evidence_text: input.websiteUrl,
      extraction_method: "deterministic",
      extractor_version: "official-site-v1",
      field_name: "website_url",
      source_url: input.sourceUrl,
      value: input.websiteUrl,
    });
  }
  if (input.logoUrl && input.sourceUrl) {
    evidenceRows.push({
      confidence: 90,
      employer_id: employer.id,
      evidence_text: input.logoUrl,
      extraction_method: "deterministic",
      extractor_version: "official-site-v1",
      field_name: "logo_url",
      source_url: input.sourceUrl,
      value: input.logoUrl,
    });
  }
  const suggestionGroups = new Map<string, typeof input.suggestions>();
  for (const suggestion of input.suggestions) {
    const existing = suggestionGroups.get(suggestion.fieldName) ?? [];
    suggestionGroups.set(suggestion.fieldName, [...existing, suggestion]);
  }
  for (const [fieldName, items] of suggestionGroups) {
    if (!input.sourceUrl || !items.length) continue;
    evidenceRows.push({
      confidence: Math.max(...items.map((item) => item.confidence)),
      employer_id: employer.id,
      evidence_text: items
        .map((item) => item.evidence)
        .join(" · ")
        .slice(0, 1_000),
      extraction_method: "ai",
      extractor_version: "ai-structured-v1",
      field_name: fieldName,
      source_url: input.sourceUrl,
      value: items
        .map((item) => item.value)
        .join("\n")
        .slice(0, 4_000),
    });
  }
  if (evidenceRows.length) {
    const { error: evidenceError } = await supabase
      .from("employer_field_evidence")
      .upsert(evidenceRows, { onConflict: "employer_id,field_name" });
    if (evidenceError) throw new Error("Employer evidence could not be saved.");
  }
  return data;
}

function explicitPageEvidence(record: SourceRecord, page: VacancyPageExtraction) {
  return [
    evidence("application_url", page.applicationUrl, "source_page", 100, "source-page-structured-v1"),
    evidence(
      "closes_at",
      page.closesAt ?? record.closes_at,
      page.closesAt ? "source_page" : "feed",
      100,
      "source-page-structured-v1",
    ),
    evidence(
      "employer_name",
      page.employerName ?? record.employer_name,
      page.employerName ? "source_page" : "feed",
      95,
      "source-page-structured-v1",
    ),
    evidence("employer_website_url", page.employerWebsiteUrl, "source_page", 90, "source-page-structured-v1"),
    evidence(
      "location_text",
      page.locationText ?? record.location_text,
      page.locationText ? "source_page" : "feed",
      95,
      "source-page-structured-v1",
    ),
  ];
}

async function finishFailed(
  supabase: SupabaseClient<Database>,
  recordId: number,
  runId: number,
  errorCode: Exclude<EnrichmentErrorCode, null>,
) {
  const now = new Date().toISOString();
  await Promise.all([
    supabase
      .from("job_source_records")
      .update({ enrichment_error_code: errorCode, enrichment_status: "failed" })
      .eq("id", recordId),
    supabase
      .from("source_enrichment_runs")
      .update({ error_code: errorCode, finished_at: now, status: "failed" })
      .eq("id", runId),
  ]);
}

export async function enrichNextPendingSourceRecord(
  supabase: SupabaseClient<Database>,
  trigger: EnrichmentTrigger,
  requestedRecordId?: number,
): Promise<SourceEnrichmentResult> {
  const aiBudget = await readAiBudget(supabase);
  const claimed = await claimSourceRecord(supabase, trigger, aiBudget.allowed, requestedRecordId);
  if (!claimed) return { status: "idle" };
  const { record, runId } = claimed;
  const source = record.job_sources;
  if (!record.canonical_url || !source?.is_active || !source.authoritative_base_url) {
    await finishFailed(supabase, record.id, runId, "unsupported_source");
    return { recordId: record.id, runId, status: "failed" };
  }

  try {
    const detail = await fetchApprovedVacancyPage(
      record.canonical_url,
      source.source_type,
      source.authoritative_base_url,
    );
    const page = parseVacancyPage(detail.html, detail.url);
    if (page.detailText.length < 80) throw new SourcePageError("invalid_source_page");
    const detailContentHash = digest({
      applicationUrl: page.applicationUrl,
      detailText: page.detailText,
      employerWebsiteUrl: page.employerWebsiteUrl,
      extractorVersion: SOURCE_PAGE_EXTRACTOR_VERSION,
      policyVersion: isAiEnrichmentEnabled()
        ? AI_ENRICHMENT_POLICY_VERSION
        : DETERMINISTIC_ENRICHMENT_POLICY_VERSION,
    });

    if (record.enriched_content_hash === detailContentHash) {
      const finishedAt = new Date().toISOString();
      await Promise.all([
        supabase
          .from("job_source_records")
          .update({ enrichment_completed_at: finishedAt, enrichment_status: "complete" })
          .eq("id", record.id),
        supabase
          .from("source_enrichment_runs")
          .update({ finished_at: finishedAt, source_page_fetched: true, status: "skipped" })
          .eq("id", runId),
      ]);
      const publication = await evaluateAndMaybePublishSourceRecord(supabase, record.id);
      return { publication, recordId: record.id, runId, status: "skipped" };
    }

    const employer = await resolveEmployer(supabase, record, page);
    const employerWebsiteUrl = page.employerWebsiteUrl ?? employer?.website_url ?? null;
    let employerPage: { logoUrl: string | null; sourceUrl: string | null; text: string } = {
      logoUrl: page.employerLogoUrl,
      sourceUrl: page.employerLogoUrl ? detail.url : null,
      text: "",
    };
    if (
      employerWebsiteUrl &&
      (!employer?.enriched_at ||
        (isAiEnrichmentEnabled() && (!employer?.mission?.trim() || !employer?.overview?.trim()))) &&
      employer?.status !== "published" &&
      !employer?.reviewed_at
    ) {
      try {
        const fetchedEmployer = await fetchEmployerPage(employerWebsiteUrl);
        const parsedEmployer = parseEmployerPage(fetchedEmployer.html, fetchedEmployer.url);
        employerPage = {
          logoUrl: parsedEmployer.logoUrl ?? page.employerLogoUrl,
          sourceUrl: fetchedEmployer.url,
          text: parsedEmployer.text,
        };
      } catch {
        // Employer research is optional. The vacancy can still be enriched and reviewed.
      }
    }

    const { data: existingEvidence, error: evidenceReadError } = await supabase
      .from("job_source_field_evidence")
      .select("*")
      .eq("source_record_id", record.id);
    if (evidenceReadError) throw new Error("Existing evidence could not be read.");
    const deterministic = mergeEvidence(existingEvidence ?? [], [
      ...page.evidence,
      ...explicitPageEvidence(record, page),
    ]);
    const unresolved = CORE_FIELDS.filter(
      (fieldName) => deterministic.byField.get(fieldName)?.resolution_status !== "extracted",
    );

    let aiResult: Awaited<ReturnType<typeof enrichWithAi>> = { status: "disabled" };
    let aiError = false;
    const aiNeeded = Boolean(unresolved.length || employerPage.text);
    if (aiNeeded && aiBudget.allowed) {
      try {
        aiResult = await enrichWithAi({
          employerName: employer?.name ?? page.employerName ?? record.employer_name,
          employerText: employerPage.text || null,
          listingText: page.detailText,
          unresolvedFields: unresolved,
        });
      } catch (error) {
        aiError = true;
        console.error("Vacancy AI enrichment stopped safely.", {
          message: error instanceof Error ? error.message : "Unknown AI error",
          recordId: record.id,
        });
      }
    }

    const finalEvidence =
      aiResult.status === "completed"
        ? mergeEvidence([...deterministic.byField.values()], aiResult.evidence)
        : deterministic;
    const changedEvidence = [
      ...deterministic.selected,
      ...(aiResult.status === "completed" ? finalEvidence.selected : []),
    ];
    if (changedEvidence.length) {
      const savedAt = new Date().toISOString();
      const { error: saveEvidenceError } = await supabase.from("job_source_field_evidence").upsert(
        changedEvidence.map((item) => ({
          confidence: item.confidence,
          evidence_text: item.evidenceText,
          extraction_method: item.extractionMethod,
          extractor_version: item.extractorVersion,
          field_name: item.fieldName,
          resolution_status: item.resolutionStatus,
          source_kind: item.sourceKind,
          source_record_id: record.id,
          updated_at: savedAt,
          value: item.value,
        })),
        { onConflict: "source_record_id,field_name" },
      );
      if (saveEvidenceError) throw new Error("Enrichment evidence could not be saved.");
    }

    if (employer) {
      await persistEmployerEnrichment(supabase, employer, {
        logoUrl: employerPage.logoUrl,
        sourceUrl: employerPage.sourceUrl,
        suggestions: aiResult.status === "completed" ? aiResult.employerSuggestions : [],
        websiteUrl: employerWebsiteUrl,
      });
    }

    const evidenceMap = finalEvidence.byField;
    const resolved = CORE_FIELDS.filter(
      (fieldName) => evidenceMap.get(fieldName)?.resolution_status === "extracted",
    ).length;
    const mandatoryComplete = Boolean(
      (page.employerName ?? record.employer_name) &&
      (page.locationText ?? record.location_text) &&
      (page.closesAt ?? record.closes_at) &&
      page.applicationUrl &&
      page.detailText,
    );
    const status = mandatoryComplete ? "complete" : "needs_review";
    const enrichmentPolicyVersion =
      !aiNeeded || aiResult.status === "completed"
        ? isAiEnrichmentEnabled()
          ? AI_ENRICHMENT_POLICY_VERSION
          : DETERMINISTIC_ENRICHMENT_POLICY_VERSION
        : DETERMINISTIC_ENRICHMENT_POLICY_VERSION;
    const aiSkipReason = !aiNeeded
      ? "not_needed"
      : aiResult.status === "completed" || aiError
        ? null
        : aiBudget.reason;
    const finishedAt = new Date().toISOString();
    const { error: recordUpdateError } = await supabase
      .from("job_source_records")
      .update({
        application_url: page.applicationUrl,
        closes_at: page.closesAt ?? record.closes_at,
        detail_content_hash: detailContentHash,
        detail_fetched_at: finishedAt,
        detail_text: page.detailText,
        employer_id: employer?.id ?? record.employer_id,
        employer_name: page.employerName ?? record.employer_name,
        employer_website_url: employerWebsiteUrl,
        enriched_content_hash:
          !aiNeeded || aiResult.status === "completed" || !isAiEnrichmentEnabled() ? detailContentHash : null,
        enrichment_completed_at: finishedAt,
        enrichment_error_code: aiError ? "ai_unavailable" : null,
        enrichment_policy_version: enrichmentPolicyVersion,
        enrichment_status: status,
        location_text: page.locationText ?? record.location_text,
      })
      .eq("id", record.id);
    if (recordUpdateError) throw new Error("The enriched source record could not be saved.");

    const { error: runUpdateError } = await supabase
      .from("source_enrichment_runs")
      .update({
        ai_attempted: aiResult.status === "completed" || aiError,
        ai_generation_id: aiResult.status === "completed" ? aiResult.generationId : null,
        ai_model: aiResult.status === "completed" ? aiResult.model : null,
        ai_skip_reason: aiSkipReason,
        employer_page_fetched: Boolean(employerPage.text),
        error_code: aiError ? "ai_unavailable" : null,
        fields_resolved: resolved,
        fields_unresolved: CORE_FIELDS.length - resolved,
        finished_at: finishedAt,
        input_tokens: aiResult.status === "completed" ? aiResult.inputTokens : 0,
        output_tokens: aiResult.status === "completed" ? aiResult.outputTokens : 0,
        source_page_fetched: true,
        status: status === "complete" ? "completed" : "needs_review",
      })
      .eq("id", runId);
    if (runUpdateError) throw new Error("The enrichment run could not be completed.");

    const publication = await evaluateAndMaybePublishSourceRecord(supabase, record.id);
    return {
      publication,
      recordId: record.id,
      runId,
      status: status === "complete" ? "completed" : status,
    };
  } catch (error) {
    const errorCode = error instanceof SourcePageError ? error.code : "persistence_failed";
    await finishFailed(supabase, record.id, runId, errorCode);
    console.error("Vacancy enrichment failed safely.", {
      errorCode,
      message: error instanceof Error ? error.message : "Unknown enrichment error",
      recordId: record.id,
    });
    return { recordId: record.id, runId, status: "failed" };
  }
}
