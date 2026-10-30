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
import {
  evidenceAppearsInText,
  isEmployerProfileSourceUrl,
  isEmployerResearchPending,
  normaliseResearchUrl,
  sameWebsiteHost,
} from "./employer-research-validation";
import { employerIdentityConflicts, employerIdentityMatches } from "./employer-identity";
import { looksLikeFavicon, selectEmployerLogo } from "./employer-logo-selection";
import { shouldGenerateAiSummary } from "./publication-summary";
import { fetchApprovedVacancyPage, fetchEmployerPage, SourcePageError } from "./source-page-fetch";
import {
  parseEmployerPage,
  parseVacancyPage,
  SOURCE_PAGE_EXTRACTOR_VERSION,
  type VacancyPageExtraction,
} from "./vacancy-page-extraction";
import { combineEvidenceChanges } from "./vacancy-evidence-selection";
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
  const requestLimit = positiveLimit(process.env.AI_DAILY_REQUEST_LIMIT, 200, 1_000);
  const inputLimit = positiveLimit(process.env.AI_DAILY_INPUT_TOKEN_LIMIT, 500_000, 10_000_000);
  const outputLimit = positiveLimit(process.env.AI_DAILY_OUTPUT_TOKEN_LIMIT, 80_000, 2_000_000);
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
    if (
      employer &&
      employerIdentityConflicts(
        { name, websiteUrl },
        { name: employer.name, websiteUrl: employer.website_url },
      )
    ) {
      employer = null;
    }
  }

  if (!employer && (name || domain)) {
    const result = await supabase.from("employers").select("*").limit(2_000);
    if (result.error) throw new Error("Employers could not be matched.");
    employer =
      (result.data ?? []).find((candidate) =>
        employerIdentityMatches(
          { name, websiteUrl },
          { name: candidate.name, websiteUrl: candidate.website_url },
        ),
      ) ?? null;
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
    logoSourceUrl: string | null;
    logoUrl: string | null;
    sourceUrl: string | null;
    suggestions: readonly AiEmployerSuggestion[];
    websiteUrl: string | null;
  },
) {
  if (employer.reviewed_at) return employer;
  const suggestions = new Map(input.suggestions.map((item) => [item.fieldName, item]));
  const selectedLogo = selectEmployerLogo({
    candidateLogoSourceUrl: input.logoSourceUrl,
    candidateLogoUrl: input.logoUrl,
    existingLogoSourceUrl: employer.logo_source_url,
    existingLogoUrl: employer.logo_url,
  });
  const locations = input.suggestions
    .filter((item) => item.fieldName === "locations")
    .map((item) => item.value);
  const benefits = input.suggestions
    .filter((item) => item.fieldName === "benefits")
    .map((item) => item.value);
  const update: Database["public"]["Tables"]["employers"]["Update"] = {
    ai_summary: employer.ai_summary ?? suggestions.get("summary")?.value ?? null,
    ai_summary_generated_at:
      employer.ai_summary_generated_at ?? (suggestions.get("summary") ? new Date().toISOString() : null),
    ai_summary_source_url: employer.ai_summary_source_url ?? suggestions.get("summary")?.sourceUrl ?? null,
    benefits: employer.benefits.length ? employer.benefits : [...new Set(benefits)],
    culture: employer.culture ?? suggestions.get("culture")?.value ?? null,
    enriched_at: new Date().toISOString(),
    focus: employer.focus ?? suggestions.get("focus")?.value ?? null,
    locations: employer.locations.length ? employer.locations : [...new Set(locations)],
    logo_source_url: selectedLogo.logoSourceUrl,
    logo_url: selectedLogo.logoUrl,
    mission: employer.mission ?? suggestions.get("mission")?.value ?? null,
    overview: employer.overview,
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
  if (selectedLogo.logoUrl && selectedLogo.logoSourceUrl) {
    evidenceRows.push({
      confidence: 90,
      employer_id: employer.id,
      evidence_text: selectedLogo.logoUrl,
      extraction_method: "deterministic",
      extractor_version: "verified-logo-source-v2",
      field_name: "logo_url",
      source_url: selectedLogo.logoSourceUrl,
      value: selectedLogo.logoUrl,
    });
  }
  const suggestionGroups = new Map<string, typeof input.suggestions>();
  for (const suggestion of input.suggestions) {
    const existing = suggestionGroups.get(suggestion.fieldName) ?? [];
    suggestionGroups.set(suggestion.fieldName, [...existing, suggestion]);
  }
  for (const [fieldName, items] of suggestionGroups) {
    const evidenceSourceUrl = items.find((item) => item.sourceUrl)?.sourceUrl ?? input.sourceUrl;
    if (!evidenceSourceUrl || !items.length) continue;
    evidenceRows.push({
      confidence: Math.max(...items.map((item) => item.confidence)),
      employer_id: employer.id,
      evidence_text: items
        .map((item) => item.evidence)
        .join(" · ")
        .slice(0, 1_000),
      extraction_method: "ai",
      extractor_version: AI_ENRICHMENT_POLICY_VERSION,
      field_name: fieldName === "summary" ? "ai_summary" : fieldName,
      source_url: evidenceSourceUrl,
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

async function fetchEmployerContext(
  websiteUrl: string,
  fallbackLogoUrl: string | null,
  fallbackLogoSourceUrl: string | null,
) {
  const homepage = await fetchEmployerPage(websiteUrl);
  const parsedHomepage = parseEmployerPage(homepage.html, homepage.url);
  const fallback = {
    logoSourceUrl: parsedHomepage.logoSourceUrl ?? fallbackLogoSourceUrl,
    logoUrl: parsedHomepage.logoUrl ?? fallbackLogoUrl,
    sourceUrl: homepage.url,
    text: parsedHomepage.text,
  };
  const researchUrl = parsedHomepage.researchUrls[0];
  if (!researchUrl) return fallback;

  try {
    const researchPage = await fetchEmployerPage(researchUrl);
    const parsedResearchPage = parseEmployerPage(researchPage.html, researchPage.url);
    if (parsedResearchPage.text.length < 80) return fallback;
    return {
      logoSourceUrl:
        parsedHomepage.logoSourceUrl ?? parsedResearchPage.logoSourceUrl ?? fallbackLogoSourceUrl,
      logoUrl: parsedHomepage.logoUrl ?? parsedResearchPage.logoUrl ?? fallbackLogoUrl,
      sourceUrl: researchPage.url,
      text: parsedResearchPage.text,
    };
  } catch {
    return fallback;
  }
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

    let employer = await resolveEmployer(supabase, record, page);
    let employerWebsiteUrl = page.employerWebsiteUrl ?? employer?.website_url ?? null;
    let employerPage: {
      logoSourceUrl: string | null;
      logoUrl: string | null;
      sourceUrl: string | null;
      text: string;
    } = {
      logoSourceUrl: page.employerLogoUrl ? detail.url : null,
      logoUrl: page.employerLogoUrl,
      sourceUrl: page.employerLogoUrl ? detail.url : null,
      text: "",
    };
    if (
      employerWebsiteUrl &&
      (!employer?.enriched_at ||
        !employer?.logo_url ||
        looksLikeFavicon(employer.logo_url) ||
        (isAiEnrichmentEnabled() &&
          !employer?.ai_summary?.trim() &&
          !employer?.mission?.trim() &&
          !employer?.overview?.trim())) &&
      !employer?.reviewed_at
    ) {
      try {
        employerPage = await fetchEmployerContext(
          employerWebsiteUrl,
          page.employerLogoUrl,
          page.employerLogoUrl ? detail.url : null,
        );
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
    const employerResearchNeeded = Boolean(
      employer?.name &&
      !employerWebsiteUrl &&
      !employer.ai_summary?.trim() &&
      !employer.mission?.trim() &&
      !employer.overview?.trim() &&
      employer.name !== "Private Employer" &&
      !employer.reviewed_at,
    );
    const shouldSummariseJob = shouldGenerateAiSummary(record.ai_summary);
    const aiNeeded = Boolean(
      unresolved.length || shouldSummariseJob || employerPage.text || employerResearchNeeded,
    );
    if (aiNeeded && aiBudget.allowed) {
      try {
        aiResult = await enrichWithAi({
          allowEmployerWebResearch: employerResearchNeeded,
          employerName: employer?.name ?? page.employerName ?? record.employer_name,
          employerSourceUrl: employerPage.sourceUrl,
          employerText: employerPage.text || null,
          listingSourceUrl: detail.url,
          listingText: page.detailText,
          shouldSummariseJob,
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

    if (
      employer &&
      aiResult.status === "completed" &&
      !employerWebsiteUrl &&
      aiResult.researchedEmployerWebsiteUrl
    ) {
      const listingSummaryIsVerified = (suggestion: AiEmployerSuggestion) =>
        suggestion.fieldName === "summary" &&
        normaliseResearchUrl(suggestion.sourceUrl) === normaliseResearchUrl(detail.url) &&
        evidenceAppearsInText(suggestion.evidence, page.detailText);
      employerWebsiteUrl = aiResult.researchedEmployerWebsiteUrl;
      const researchUrls = [
        employerWebsiteUrl,
        ...aiResult.employerSuggestions.flatMap((item) => (item.sourceUrl ? [item.sourceUrl] : [])),
      ]
        .filter((value, index, values) => values.indexOf(value) === index)
        .filter((value) => sameWebsiteHost(value, employerWebsiteUrl))
        .slice(0, 2);
      const researchedPages: {
        logoSourceUrl: string | null;
        logoUrl: string | null;
        text: string;
        url: string;
      }[] = [];
      for (const researchUrl of researchUrls) {
        try {
          const fetched = await fetchEmployerPage(researchUrl);
          const parsed = parseEmployerPage(fetched.html, fetched.url);
          researchedPages.push({
            logoSourceUrl: parsed.logoSourceUrl,
            logoUrl: parsed.logoUrl,
            text: parsed.text,
            url: fetched.url,
          });
        } catch {
          // Web research remains optional and fails closed when an official page cannot be verified safely.
        }
      }
      if (researchedPages.length) {
        employerPage = {
          logoSourceUrl:
            researchedPages.find((item) => item.logoUrl)?.logoSourceUrl ??
            (page.employerLogoUrl ? detail.url : null),
          logoUrl: researchedPages.find((item) => item.logoUrl)?.logoUrl ?? page.employerLogoUrl,
          sourceUrl: researchedPages[0].url,
          text: researchedPages.map((item) => item.text).join("\n\n"),
        };
        aiResult = {
          ...aiResult,
          employerSuggestions: aiResult.employerSuggestions.flatMap((suggestion) => {
            if (listingSummaryIsVerified(suggestion)) {
              return [suggestion];
            }
            const matchingPage = researchedPages.find(
              (item) =>
                sameWebsiteHost(item.url, suggestion.sourceUrl) &&
                (suggestion.fieldName === "culture" ||
                  suggestion.fieldName === "benefits" ||
                  suggestion.fieldName === "locations" ||
                  isEmployerProfileSourceUrl(item.url)) &&
                evidenceAppearsInText(suggestion.evidence, item.text),
            );
            return matchingPage ? [{ ...suggestion, sourceUrl: matchingPage.url }] : [];
          }),
        };
      } else {
        employerWebsiteUrl = null;
        aiResult = {
          ...aiResult,
          employerSuggestions: aiResult.employerSuggestions.filter(listingSummaryIsVerified),
        };
      }
    }

    const finalEvidence =
      aiResult.status === "completed"
        ? mergeEvidence([...deterministic.byField.values()], aiResult.evidence)
        : deterministic;
    const changedEvidence =
      aiResult.status === "completed"
        ? combineEvidenceChanges(deterministic.selected, finalEvidence.selected)
        : deterministic.selected;
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
      employer = await persistEmployerEnrichment(supabase, employer, {
        logoSourceUrl: employerPage.logoSourceUrl,
        logoUrl: employerPage.logoUrl,
        sourceUrl: employerPage.sourceUrl,
        suggestions: aiResult.status === "completed" ? aiResult.employerSuggestions : [],
        websiteUrl: employerWebsiteUrl,
      });
    }
    const employerProfilePending = employer ? isEmployerResearchPending(employer) : false;

    const evidenceMap = finalEvidence.byField;
    const resolved = CORE_FIELDS.filter(
      (fieldName) => evidenceMap.get(fieldName)?.resolution_status === "extracted",
    ).length;
    const mandatoryComplete = Boolean(
      (page.employerName ?? record.employer_name) && (page.applicationUrl ?? detail.url) && page.detailText,
    );
    const status = mandatoryComplete ? "complete" : "needs_review";
    const enrichmentPolicyVersion = employerProfilePending
      ? `${AI_ENRICHMENT_POLICY_VERSION}-employer-pending`
      : !aiNeeded || aiResult.status === "completed"
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
        ai_summary:
          aiResult.status === "completed" && aiResult.jobSummary
            ? aiResult.jobSummary.value
            : record.ai_summary,
        ai_summary_generated_at:
          aiResult.status === "completed" && aiResult.jobSummary
            ? finishedAt
            : record.ai_summary_generated_at,
        application_url: page.applicationUrl,
        closes_at: page.closesAt ?? record.closes_at,
        detail_content_hash: detailContentHash,
        detail_fetched_at: finishedAt,
        detail_text: page.detailText,
        employer_id: employer?.id ?? record.employer_id,
        employer_name: page.employerName ?? record.employer_name,
        employer_website_url: employerWebsiteUrl,
        enriched_content_hash:
          !employerProfilePending &&
          (!aiNeeded || aiResult.status === "completed" || !isAiEnrichmentEnabled())
            ? detailContentHash
            : null,
        enrichment_completed_at: finishedAt,
        enrichment_error_code: aiError ? "ai_unavailable" : null,
        enrichment_policy_version: enrichmentPolicyVersion,
        enrichment_status: status,
        country_code: page.locationCountryCode ?? record.country_code,
        location_locality: page.locationLocality ?? record.location_locality,
        location_region: page.locationRegion ?? record.location_region,
        location_text: page.locationText ?? record.location_text,
        postal_code: page.postalCode ?? record.postal_code,
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
