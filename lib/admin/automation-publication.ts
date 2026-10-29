import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AUTOMATION_PUBLICATION_POLICY_VERSION,
  evaluatePublicationReadiness,
  type AutomationBlockerCode,
} from "./automation-publication-readiness";
import { toSlug } from "./job-intake-validation";
import type { Database, Json } from "../supabase/database.types";

type AutomationResult = {
  blockers: AutomationBlockerCode[];
  jobId?: number;
  score: number;
  status: "blocked" | "failed" | "published" | "ready";
};

function isAutoPublishEnabled() {
  return process.env.AUTO_PUBLISH_ENABLED === "true";
}

async function exactDuplicateCount(
  supabase: SupabaseClient<Database>,
  canonicalUrl: string | null,
  applicationUrl: string | null,
) {
  const queries = [];
  if (canonicalUrl) queries.push(supabase.from("jobs").select("id").eq("source_url", canonicalUrl).limit(1));
  if (applicationUrl) {
    queries.push(supabase.from("jobs").select("id").eq("application_url", applicationUrl).limit(1));
  }
  const results = await Promise.all(queries);
  if (results.some((result) => result.error)) throw new Error("Existing vacancies could not be checked.");
  return new Set(results.flatMap((result) => (result.data ?? []).map((item) => item.id))).size;
}

async function evaluateAndMaybePublishSourceRecordUnsafe(
  supabase: SupabaseClient<Database>,
  sourceRecordId: number,
): Promise<AutomationResult> {
  const { data: record, error } = await supabase
    .from("job_source_records")
    .select(
      "id, job_id, mapping_status, canonical_url, application_url, closes_at, source_title, summary, detail_text, location_text, enrichment_status, job_sources(name, source_type, is_active, default_country_code), employers(id, name, status, website_url, mission, overview, reviewed_at, employer_field_evidence(field_name, confidence)), job_source_field_evidence(field_name, resolution_status, value, confidence)",
    )
    .eq("id", sourceRecordId)
    .maybeSingle();
  if (error || !record) throw new Error("The source record could not be evaluated for publication.");

  const duplicateCount = await exactDuplicateCount(supabase, record.canonical_url, record.application_url);
  const readiness = evaluatePublicationReadiness({
    applicationUrl: record.application_url,
    canonicalUrl: record.canonical_url,
    closesAt: record.closes_at,
    countryCode: record.job_sources?.default_country_code ?? null,
    detailText: record.detail_text,
    duplicateCount,
    employer: record.employers
      ? {
          id: record.employers.id,
          mission: record.employers.mission,
          overview: record.employers.overview,
          reviewedAt: record.employers.reviewed_at,
          status: record.employers.status,
          websiteUrl: record.employers.website_url,
        }
      : null,
    employerEvidence: record.employers?.employer_field_evidence ?? [],
    enrichmentStatus: record.enrichment_status,
    evidence: record.job_source_field_evidence,
    jobId: record.job_id,
    locationText: record.location_text,
    mappingStatus: record.mapping_status,
    sourceActive: record.job_sources?.is_active ?? false,
    sourceTitle: record.source_title,
    sourceType: record.job_sources?.source_type ?? "",
    summary: record.summary,
    today: new Date().toISOString().slice(0, 10),
  });
  const mode = isAutoPublishEnabled() ? "live" : "shadow";
  const evaluatedAt = new Date().toISOString();
  const decision = readiness.ready ? "ready" : "blocked";
  const commonDecision = {
    blocker_codes: readiness.blockers,
    decision,
    field_confidences: readiness.fieldConfidences as Json,
    mode,
    policy_version: AUTOMATION_PUBLICATION_POLICY_VERSION,
    score: readiness.score,
    source_record_id: record.id,
  } satisfies Database["public"]["Tables"]["automation_publication_decisions"]["Insert"];

  const [recordUpdate, decisionInsert] = await Promise.all([
    supabase
      .from("job_source_records")
      .update({
        automation_blockers: readiness.blockers,
        automation_evaluated_at: evaluatedAt,
        automation_policy_version: AUTOMATION_PUBLICATION_POLICY_VERSION,
        automation_score: readiness.score,
        automation_status: decision,
      })
      .eq("id", record.id)
      .is("job_id", null),
    supabase.from("automation_publication_decisions").insert(commonDecision),
  ]);
  if (recordUpdate.error || decisionInsert.error) {
    throw new Error("The automated publication decision could not be recorded.");
  }

  if (!readiness.ready || mode === "shadow") {
    return { blockers: readiness.blockers, score: readiness.score, status: decision };
  }

  const slug = toSlug(
    `${record.source_title ?? "vacancy"}-${record.employers?.name ?? "employer"}-${record.closes_at ?? "open"}-${record.id}`,
  );
  const { data: jobId, error: publishError } = await supabase.rpc("publish_automated_source_record", {
    p_job_slug: slug,
    p_policy_version: AUTOMATION_PUBLICATION_POLICY_VERSION,
    p_score: readiness.score,
    p_source_record_id: record.id,
  });
  if (publishError || !jobId) {
    const failedAt = new Date().toISOString();
    await Promise.all([
      supabase
        .from("job_source_records")
        .update({ automation_evaluated_at: failedAt, automation_status: "failed" })
        .eq("id", record.id)
        .is("job_id", null),
      supabase.from("automation_publication_decisions").insert({
        ...commonDecision,
        blocker_codes: [],
        decision: "failed",
      }),
    ]);
    console.error("Automated publication stopped safely.", { recordId: record.id });
    return { blockers: [], score: readiness.score, status: "failed" };
  }

  return { blockers: [], jobId, score: readiness.score, status: "published" };
}

export async function evaluateAndMaybePublishSourceRecord(
  supabase: SupabaseClient<Database>,
  sourceRecordId: number,
): Promise<AutomationResult> {
  try {
    return await evaluateAndMaybePublishSourceRecordUnsafe(supabase, sourceRecordId);
  } catch (error) {
    const evaluatedAt = new Date().toISOString();
    await Promise.all([
      supabase
        .from("job_source_records")
        .update({
          automation_blockers: [],
          automation_evaluated_at: evaluatedAt,
          automation_policy_version: AUTOMATION_PUBLICATION_POLICY_VERSION,
          automation_score: 0,
          automation_status: "failed",
        })
        .eq("id", sourceRecordId)
        .is("job_id", null),
      supabase.from("automation_publication_decisions").insert({
        blocker_codes: [],
        decision: "failed",
        field_confidences: {},
        mode: isAutoPublishEnabled() ? "live" : "shadow",
        policy_version: AUTOMATION_PUBLICATION_POLICY_VERSION,
        score: 0,
        source_record_id: sourceRecordId,
      }),
    ]);
    console.error("Automated publication evaluation stopped safely.", {
      message: error instanceof Error ? error.message : "Unknown publication evaluation error",
      recordId: sourceRecordId,
    });
    return { blockers: [], score: 0, status: "failed" };
  }
}
