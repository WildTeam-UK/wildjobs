import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { parseApprovedVacancyFeed } from "@/lib/admin/feed-source";
import { getSourceConnector, type SourceConnector } from "@/lib/admin/source-connector";
import { extractVacancyFieldEvidence } from "@/lib/admin/vacancy-detail-extraction";
import { parseWwtVacancies } from "@/lib/admin/wwt-source";
import type { Database } from "@/lib/supabase/database.types";

const MAX_SOURCE_BYTES = 1_500_000;
const STALE_RUN_MINUTES = 15;

export type ApprovedSource = {
  authoritative_base_url: string | null;
  id: number;
  is_active: boolean;
  source_type: string;
};

export type SourceImportResult =
  | {
      recordsCreated: number;
      recordsFlagged: number;
      recordsSeen: number;
      recordsUpdated: number;
      runId: number;
      status: "completed";
    }
  | { runId: number; status: "failed" }
  | { status: "already_running" };

async function fetchSourceVacancies(connector: SourceConnector, url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "WildJobs source checker (+https://jobs.wildteam.org.uk)" },
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (
    !response.ok ||
    getSourceConnector(connector === "rss" ? "feed" : "manual_curation", response.url) !== connector
  ) {
    throw new Error("The source did not return the approved vacancy endpoint.");
  }
  if (connector === "wwt" && !contentType.includes("text/html")) {
    throw new Error("The source did not return an HTML vacancies page.");
  }
  if (
    connector === "rss" &&
    !["application/rss+xml", "application/atom+xml", "application/xml", "text/xml", "text/html"].some(
      (type) => contentType.includes(type),
    )
  ) {
    throw new Error("The source did not return an RSS or Atom feed.");
  }
  if (contentLength > MAX_SOURCE_BYTES) throw new Error("The source response was too large.");

  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_SOURCE_BYTES) throw new Error("The source response was too large.");

  const sourceBody = new TextDecoder().decode(body);
  const vacancies =
    connector === "rss" ? parseApprovedVacancyFeed(sourceBody, url) : parseWwtVacancies(sourceBody);
  if (!vacancies.length) throw new Error("No verified vacancy records were found.");
  return vacancies;
}

export async function importApprovedSource(
  supabase: SupabaseClient<Database>,
  source: ApprovedSource,
): Promise<SourceImportResult> {
  const connector = getSourceConnector(source.source_type, source.authoritative_base_url);
  if (!source.is_active || !connector || !source.authoritative_base_url) {
    throw new Error("The source does not have an active approved connector.");
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_RUN_MINUTES * 60_000).toISOString();
  const { error: staleRunError } = await supabase
    .from("import_runs")
    .update({
      error_summary: "The import did not finish and was closed before a later source check.",
      finished_at: now.toISOString(),
      status: "failed",
    })
    .eq("source_id", source.id)
    .eq("status", "started")
    .lt("started_at", staleBefore);
  if (staleRunError) throw new Error("Stale import runs could not be closed.");

  const { data: run, error: runError } = await supabase
    .from("import_runs")
    .insert({ source_id: source.id })
    .select("id")
    .single();
  if (runError?.code === "23505") return { status: "already_running" };
  if (runError || !run) throw new Error("The import run could not be started.");

  try {
    const [vacancies, existingResult] = await Promise.all([
      fetchSourceVacancies(connector, source.authoritative_base_url),
      supabase
        .from("job_source_records")
        .select(
          "id, external_id, canonical_url, content_hash, mapping_status, automation_status, enrichment_status, enrichment_attempts",
        )
        .eq("source_id", source.id),
    ]);

    if (existingResult.error) throw new Error("Existing source records could not be read.");

    const existingByExternalId = new Map(
      (existingResult.data ?? [])
        .filter((record) => record.external_id)
        .map((record) => [record.external_id, record]),
    );
    const existingByCanonicalUrl = new Map(
      (existingResult.data ?? [])
        .filter((record) => record.canonical_url)
        .map((record) => [record.canonical_url, record]),
    );
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFlagged = 0;
    const seenAt = new Date().toISOString();
    const evidenceRows: Database["public"]["Tables"]["job_source_field_evidence"]["Insert"][] = [];

    for (const vacancy of vacancies) {
      const contentHash = createHash("sha256").update(JSON.stringify(vacancy)).digest("hex");
      const existing =
        existingByExternalId.get(vacancy.externalId) ?? existingByCanonicalUrl.get(vacancy.canonicalUrl);

      if (existing) {
        const changed =
          existing.content_hash !== contentHash ||
          existing.canonical_url !== vacancy.canonicalUrl ||
          existing.external_id !== vacancy.externalId;
        const { error } = await supabase
          .from("job_source_records")
          .update({
            canonical_url: vacancy.canonicalUrl,
            closes_at: vacancy.closesAt,
            content_hash: contentHash,
            employer_name: vacancy.employer,
            external_id: vacancy.externalId,
            last_seen_at: seenAt,
            location_text: vacancy.location,
            source_title: vacancy.title,
            source_updated_at: vacancy.publishedAt,
            summary: vacancy.summary,
            ...(changed && existing.mapping_status !== "ignored" && existing.automation_status !== "published"
              ? {
                  automation_blockers: [],
                  automation_evaluated_at: null,
                  automation_policy_version: null,
                  automation_score: null,
                  automation_status: "pending",
                  enrichment_attempts: 0,
                  enrichment_error_code: null,
                  enrichment_policy_version: null,
                  enrichment_status: "pending",
                }
              : {}),
          })
          .eq("id", existing.id);
        if (error) throw new Error("A source record could not be updated.");
        evidenceRows.push(
          ...extractVacancyFieldEvidence(vacancy.summary).map((item) => ({
            confidence: item.confidence,
            evidence_text: item.evidenceText,
            extraction_method: item.extractionMethod,
            extractor_version: item.extractorVersion,
            field_name: item.fieldName,
            resolution_status: item.resolutionStatus,
            source_kind: item.sourceKind,
            source_record_id: existing.id,
            updated_at: seenAt,
            value: item.value,
          })),
        );
        if (changed) recordsUpdated += 1;
        if (existing.mapping_status === "possible_duplicate") recordsFlagged += 1;
        continue;
      }

      const { data: createdRecord, error } = await supabase
        .from("job_source_records")
        .insert({
          canonical_url: vacancy.canonicalUrl,
          closes_at: vacancy.closesAt,
          content_hash: contentHash,
          employer_name: vacancy.employer,
          external_id: vacancy.externalId,
          first_seen_at: seenAt,
          last_seen_at: seenAt,
          location_text: vacancy.location,
          mapping_status: "unmapped",
          source_id: source.id,
          source_title: vacancy.title,
          source_updated_at: vacancy.publishedAt,
          summary: vacancy.summary,
        })
        .select("id")
        .single();
      if (error || !createdRecord) throw new Error("A source record could not be created.");
      evidenceRows.push(
        ...extractVacancyFieldEvidence(vacancy.summary).map((item) => ({
          confidence: item.confidence,
          evidence_text: item.evidenceText,
          extraction_method: item.extractionMethod,
          extractor_version: item.extractorVersion,
          field_name: item.fieldName,
          resolution_status: item.resolutionStatus,
          source_kind: item.sourceKind,
          source_record_id: createdRecord.id,
          updated_at: seenAt,
          value: item.value,
        })),
      );
      recordsCreated += 1;
    }

    const { error: evidenceError } = await supabase
      .from("job_source_field_evidence")
      .upsert(evidenceRows, { onConflict: "source_record_id,field_name" });
    if (evidenceError) throw new Error("Source evidence could not be saved.");

    const { error: completionError } = await supabase
      .from("import_runs")
      .update({
        finished_at: new Date().toISOString(),
        records_created: recordsCreated,
        records_flagged: recordsFlagged,
        records_seen: vacancies.length,
        records_updated: recordsUpdated,
        status: "completed",
      })
      .eq("id", run.id);
    if (completionError) throw new Error("The import run could not be completed.");

    return {
      recordsCreated,
      recordsFlagged,
      recordsSeen: vacancies.length,
      recordsUpdated,
      runId: run.id,
      status: "completed",
    };
  } catch {
    await supabase
      .from("import_runs")
      .update({
        error_summary: "The approved source could not be checked. No listings were published.",
        finished_at: new Date().toISOString(),
        status: "failed",
      })
      .eq("id", run.id);
    return { runId: run.id, status: "failed" };
  }
}
