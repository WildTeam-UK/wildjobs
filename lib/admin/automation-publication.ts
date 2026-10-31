import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AUTOMATION_PUBLICATION_POLICY_VERSION,
  evaluatePublicationReadiness,
  publicationControlAllowsSource,
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

export type PublicationReevaluationSummary = {
  attempted: number;
  blocked: number;
  failed: number;
  published: number;
  ready: number;
};

async function readAutoPublishControl(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("automation_controls")
    .select("auto_publish_enabled, auto_publish_source_record_id")
    .eq("id", "global")
    .maybeSingle();
  if (error) {
    console.error("Automatic publication control could not be read; publication remains off.");
    return { databaseEnabled: false, targetSourceRecordId: null };
  }
  return {
    databaseEnabled: data?.auto_publish_enabled === true,
    targetSourceRecordId: data?.auto_publish_source_record_id ?? null,
  };
}

async function exactDuplicateCount(
  supabase: SupabaseClient<Database>,
  canonicalUrl: string | null,
  applicationUrl: string | null,
  currentJobId: number | null,
) {
  const queries = [];
  if (canonicalUrl) {
    let query = supabase.from("jobs").select("id").eq("source_url", canonicalUrl).limit(1);
    if (currentJobId) query = query.neq("id", currentJobId);
    queries.push(query);
  }
  if (applicationUrl) {
    let query = supabase.from("jobs").select("id").eq("application_url", applicationUrl).limit(1);
    if (currentJobId) query = query.neq("id", currentJobId);
    queries.push(query);
  }
  const results = await Promise.all(queries);
  if (results.some((result) => result.error)) throw new Error("Existing vacancies could not be checked.");
  return new Set(results.flatMap((result) => (result.data ?? []).map((item) => item.id))).size;
}

async function taxonomyCoverage(supabase: SupabaseClient<Database>, jobId: number | null) {
  if (!jobId) return { careerAreas: 0, locations: 0, occupations: 0 };
  const [careerAreas, occupations, locations] = await Promise.all([
    supabase.from("job_career_areas").select("*", { count: "exact", head: true }).eq("job_id", jobId),
    supabase.from("job_occupations").select("*", { count: "exact", head: true }).eq("job_id", jobId),
    supabase.from("job_locations").select("*", { count: "exact", head: true }).eq("job_id", jobId),
  ]);
  if (careerAreas.error || occupations.error || locations.error) {
    throw new Error("Vacancy taxonomy coverage could not be checked.");
  }
  return {
    careerAreas: careerAreas.count ?? 0,
    locations: locations.count ?? 0,
    occupations: occupations.count ?? 0,
  };
}

async function evaluateAndMaybePublishSourceRecordUnsafe(
  supabase: SupabaseClient<Database>,
  sourceRecordId: number,
): Promise<AutomationResult> {
  const { data: record, error } = await supabase
    .from("job_source_records")
    .select(
      "id, job_id, mapping_status, canonical_url, application_url, closes_at, first_seen_at, source_title, summary, ai_summary, detail_text, country_code, location_text, employer_name, employer_website_url, enrichment_status, job_sources(name, source_type, is_active, default_country_code, description_display_mode), employers(id, name, status, website_url, mission, overview, reviewed_at, employer_field_evidence(field_name, confidence)), job_source_field_evidence(field_name, resolution_status, value, confidence)",
    )
    .eq("id", sourceRecordId)
    .maybeSingle();
  if (error || !record) throw new Error("The source record could not be evaluated for publication.");

  const duplicateCount = await exactDuplicateCount(
    supabase,
    record.canonical_url,
    record.application_url,
    record.job_id,
  );
  const coverage = await taxonomyCoverage(supabase, record.job_id);
  const readiness = evaluatePublicationReadiness({
    applicationUrl: record.application_url,
    canonicalUrl: record.canonical_url,
    careerAreaCount: coverage.careerAreas,
    closesAt: record.closes_at,
    countryCode: record.country_code ?? record.job_sources?.default_country_code ?? null,
    detailText: record.detail_text,
    descriptionDisplayMode: record.job_sources?.description_display_mode ?? "link_only",
    duplicateCount,
    employer: record.employers
      ? {
          id: record.employers.id,
          name: record.employers.name,
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
    firstSeenAt: record.first_seen_at,
    jobId: record.job_id,
    locationText: record.location_text,
    mappingStatus: record.mapping_status,
    occupationCount: coverage.occupations,
    sourceActive: record.job_sources?.is_active ?? false,
    sourceEmployerName: record.employer_name,
    sourceEmployerWebsiteUrl: record.employer_website_url,
    sourceTitle: record.source_title,
    sourceType: record.job_sources?.source_type ?? "",
    summary: record.summary ?? record.ai_summary,
    structuredLocationCount: coverage.locations,
    today: new Date().toISOString().slice(0, 10),
  });
  const control = await readAutoPublishControl(supabase);
  const mode = publicationControlAllowsSource({
    ...control,
    environmentEnabled: process.env.AUTO_PUBLISH_ENABLED === "true",
    sourceRecordId: record.id,
  })
    ? "live"
    : "shadow";
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
      .eq("id", record.id),
    supabase.from("automation_publication_decisions").insert(commonDecision),
  ]);
  if (recordUpdate.error || decisionInsert.error) {
    throw new Error("The automated publication decision could not be recorded.");
  }

  if (!readiness.ready || mode === "shadow") {
    return { blockers: readiness.blockers, score: readiness.score, status: decision };
  }

  const slug = toSlug(
    `${record.source_title ?? "vacancy"}-${record.employers?.name ?? "employer"}-${record.closes_at ?? record.first_seen_at.slice(0, 10)}-${record.id}`,
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
        .eq("id", record.id),
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
        .eq("id", sourceRecordId),
      supabase.from("automation_publication_decisions").insert({
        blocker_codes: [],
        decision: "failed",
        field_confidences: {},
        mode: "shadow",
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

export async function reevaluateStalePublicationDecisions(
  supabase: SupabaseClient<Database>,
): Promise<PublicationReevaluationSummary> {
  const control = await readAutoPublishControl(supabase);
  const liveMode = process.env.AUTO_PUBLISH_ENABLED === "true" && control.databaseEnabled;
  const batchSize = liveMode ? 1 : 10;
  let query = supabase
    .from("job_source_records")
    .select("id, jobs!inner(status)")
    .not("job_id", "is", null)
    .eq("mapping_status", "mapped")
    .eq("jobs.status", "draft")
    .in("enrichment_status", ["complete", "failed", "needs_review", "skipped"]);
  if (liveMode && control.targetSourceRecordId !== null) {
    query = query.eq("id", control.targetSourceRecordId);
  }
  query = liveMode
    ? query.or(
        `automation_policy_version.is.null,automation_policy_version.neq.${AUTOMATION_PUBLICATION_POLICY_VERSION},and(automation_policy_version.eq.${AUTOMATION_PUBLICATION_POLICY_VERSION},automation_status.eq.ready)`,
      )
    : query.or(
        `automation_policy_version.is.null,automation_policy_version.neq.${AUTOMATION_PUBLICATION_POLICY_VERSION}`,
      );
  const { data: records, error } = await query.order("first_seen_at").limit(batchSize);
  if (error) throw new Error("Stale publication decisions could not be read.");

  const summary: PublicationReevaluationSummary = {
    attempted: 0,
    blocked: 0,
    failed: 0,
    published: 0,
    ready: 0,
  };
  for (const record of records ?? []) {
    const result = await evaluateAndMaybePublishSourceRecord(supabase, record.id);
    summary.attempted += 1;
    summary[result.status] += 1;
  }
  return summary;
}
