import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { getSourceConnector } from "./source-connector";
import { importApprovedSource } from "./source-import";
import { fetchApprovedVacancyPage, assertPublicHttpsUrl, SourcePageError } from "./source-page-fetch";
import { parseVacancyPage } from "./vacancy-page-extraction";
import { employerIdentityMatches } from "./employer-identity";
import { toSlug } from "./job-intake-validation";
import { AiBudgetUnavailable, AiRequestUncertain, generateJobBrief, reviewJobBrief } from "./pipeline-ai";
import {
  BRIEF_POLICY_VERSION,
  briefOutputSchema,
  normalizeVacancyUrl,
  validateJobBrief,
  type BriefCatalogues,
  type BriefOutput,
} from "./job-brief-validation";

type Client = SupabaseClient<Database>;
type Task = Database["public"]["Tables"]["job_pipeline_tasks"]["Row"];
type SourceRecord = Database["public"]["Tables"]["job_source_records"]["Row"];
type TaskInput = {
  key: string;
  kind: Task["kind"];
  sourceId: number;
  recordId?: number;
  revision?: number;
  dueAt?: string;
  stage?: Task["ai_stage"];
};
export const contentHash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const check = (error: { message: string } | null, code: string) => {
  if (error) throw new Error(code);
};

export async function enqueuePipelineTask(client: Client, input: TaskInput) {
  await enqueuePipelineTasks(client, [input]);
}

async function enqueuePipelineTasks(client: Client, inputs: TaskInput[]) {
  for (let offset = 0; offset < inputs.length; offset += 500) {
    const { error } = await client.from("job_pipeline_tasks").upsert(
      inputs.slice(offset, offset + 500).map((input) => ({
        task_key: input.key,
        kind: input.kind,
        source_id: input.sourceId,
        source_record_id: input.recordId,
        source_revision: input.revision,
        ai_stage: input.stage ?? "primary",
        due_at: input.dueAt ?? new Date().toISOString(),
      })),
      { onConflict: "task_key", ignoreDuplicates: true },
    );
    check(error, "task_enqueue_failed");
  }
}

export async function schedulePipelineWork(client: Client) {
  const now = new Date();
  const pending: TaskInput[] = [];
  const { data: control, error: controlError } = await client
    .from("automation_controls")
    .select("*")
    .eq("id", "global")
    .single();
  check(controlError, "pipeline_control_unavailable");
  const live = process.env.AUTO_PUBLISH_ENABLED === "true" && control?.auto_publish_enabled;
  const { data: sources, error } = await client
    .from("job_sources")
    .select("*")
    .eq("is_active", true)
    .eq("collection_allowed", true);
  check(error, "pipeline_sources_unavailable");
  for (const source of sources ?? []) {
    if (!getSourceConnector(source.source_type, source.authoritative_base_url)) continue;
    if (source.next_import_at <= now.toISOString())
      pending.push({
        key: `import:${source.id}:${source.next_import_at}`,
        kind: "import",
        sourceId: source.id,
      });
    const { data: records, error: recordError } = await client
      .from("job_source_records")
      .select(
        "id,source_revision,next_check_at,first_seen_at,closes_at,mapping_status,job_id,automation_status,automation_policy_version",
      )
      .eq("source_id", source.id)
      .neq("mapping_status", "ignored")
      .order("first_seen_at", { ascending: false })
      .limit(1000);
    check(recordError, "pipeline_records_unavailable");
    for (const record of records ?? []) {
      const expiry =
        record.closes_at ??
        new Date(Date.parse(record.first_seen_at) + 30 * 86400000).toISOString().slice(0, 10);
      if (expiry < now.toISOString().slice(0, 10)) continue;
      if (
        live &&
        record.automation_status === "ready" &&
        record.automation_policy_version === BRIEF_POLICY_VERSION &&
        (control.auto_publish_source_record_id === null ||
          control.auto_publish_source_record_id === record.id)
      ) {
        pending.push({
          key: `release:${record.id}:${record.source_revision}:${control.updated_at}`,
          kind: "publish",
          sourceId: source.id,
          recordId: record.id,
          revision: record.source_revision,
        });
      }
      if (!record.next_check_at || record.next_check_at <= now.toISOString())
        pending.push({
          key: `verify:${record.id}:${record.next_check_at ?? "bootstrap"}`,
          kind: "verify",
          sourceId: source.id,
          recordId: record.id,
          revision: record.source_revision,
        });
    }
  }
  await enqueuePipelineTasks(client, pending);
}

async function readRecord(client: Client, id: number) {
  const { data, error } = await client
    .from("job_source_records")
    .select("*,job_sources!inner(*)")
    .eq("id", id)
    .single();
  check(error, "source_record_unavailable");
  if (!data) throw new Error("source_record_missing");
  return data;
}

async function closeSourceJob(client: Client, record: SourceRecord, code: string) {
  if (record.job_id) {
    const { error } = await client
      .from("jobs")
      .update({
        status: "expired",
        indexing_eligible: false,
        jobposting_eligible: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.job_id)
      .eq("status", "published");
    check(error, "job_expiry_failed");
  }
  const { error } = await client
    .from("job_source_records")
    .update({
      automation_status: "blocked",
      automation_blockers: ["listing_expired"],
      pipeline_error: code,
      next_check_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    })
    .eq("id", record.id);
  check(error, "source_expiry_failed");
}

async function resolveEmployer(client: Client, name: string, websiteUrl: string | null) {
  const { data: employers, error } = await client
    .from("employers")
    .select("id,name,website_url,status,employer_aliases(alias)")
    .neq("status", "archived")
    .limit(2000);
  check(error, "employer_lookup_failed");
  const matches = (employers ?? []).filter((employer) =>
    [employer.name, ...employer.employer_aliases.map((a) => a.alias)].some((alias) =>
      employerIdentityMatches({ name, websiteUrl }, { name: alias, websiteUrl: employer.website_url }),
    ),
  );
  if (matches.length > 1) throw new Error("employer_identity_ambiguous");
  if (matches.length) return matches[0].id;
  const slug = toSlug(name).slice(0, 70);
  // Names are canonicalized under a unique slug; collisions are exceptions rather than silently creating duplicates.
  const { data: created, error: createError } = await client
    .from("employers")
    .insert({ name, slug, status: "draft", website_url: websiteUrl })
    .select("id")
    .single();
  check(createError, "employer_identity_requires_review");
  if (!created) throw new Error("employer_identity_missing");
  return created.id;
}

async function verifyRecord(client: Client, task: Task) {
  const r = await readRecord(client, task.source_record_id!);
  const source = r.job_sources;
  if (r.mapping_status === "ignored") return "cancelled" as const;
  if (!r.canonical_url || !source.authoritative_base_url) throw new Error("source_url_missing");
  let fetched;
  try {
    fetched = await fetchApprovedVacancyPage(
      r.canonical_url,
      source.source_type,
      source.authoritative_base_url,
    );
  } catch (error) {
    if (error instanceof SourcePageError && [404, 410].includes(error.httpStatus ?? 0)) {
      await closeSourceJob(client, r, "source_removed");
      return "completed" as const;
    }
    throw error;
  }
  const page = parseVacancyPage(fetched.html, fetched.url);
  if (
    /\b(?:this (?:job|vacancy) (?:has (?:now )?expired|is (?:now )?closed|is no longer available)|applications (?:for this (?:job|role) )?are now closed)\b/i.test(
      page.detailText,
    )
  ) {
    await closeSourceJob(client, r, "source_closed");
    return "completed" as const;
  }
  if (page.detailText.length < 80) throw new Error("incomplete_source_page");
  const closesAt = page.closesAt ?? r.closes_at;
  if (closesAt && closesAt < new Date().toISOString().slice(0, 10)) {
    await closeSourceJob(client, r, "deadline_passed");
    return "completed" as const;
  }
  const name = page.employerName ?? r.employer_name;
  if (!name) throw new Error("employer_identity_missing");
  const applicationUrl = normalizeVacancyUrl(page.applicationUrl ?? fetched.url);
  await assertPublicHttpsUrl(applicationUrl);
  if (!page.applicationInstructionsFound) throw new Error("application_instructions_missing");
  const employerId = await resolveEmployer(client, name, page.employerWebsiteUrl);
  if (!r.job_id) {
    const { data: duplicates, error: duplicateError } = await client
      .from("jobs")
      .select("id,title,location_text,closes_at,source_url")
      .eq("employer_id", employerId)
      .in("status", ["draft", "in_review", "published"])
      .limit(1000);
    check(duplicateError, "duplicate_lookup_failed");
    const sameUrl = (duplicates ?? []).find(
      (j) => j.source_url && normalizeVacancyUrl(j.source_url) === normalizeVacancyUrl(fetched.url),
    );
    if (sameUrl) {
      const { error } = await client
        .from("job_source_records")
        .update({ job_id: sameUrl.id, employer_id: employerId, mapping_status: "mapped" })
        .eq("id", r.id);
      check(error, "duplicate_link_failed");
      r.job_id = sameUrl.id;
    } else if (
      (duplicates ?? []).some(
        (j) =>
          j.title.trim().toLowerCase() === r.source_title?.trim().toLowerCase() && j.closes_at === closesAt,
      )
    ) {
      const { error } = await client
        .from("job_source_records")
        .update({ mapping_status: "possible_duplicate", pipeline_error: "duplicate_identity_ambiguous" })
        .eq("id", r.id);
      check(error, "duplicate_flag_failed");
      return "review" as const;
    }
  }
  const hash = contentHash({
    text: page.evidenceText,
    applicationUrl,
    title: page.title ?? r.source_title,
    employerId,
    closesAt,
  });
  const revision = r.source_revision + (r.detail_content_hash && hash !== r.detail_content_hash ? 1 : 0);
  const now = new Date().toISOString();
  const { error: snapshotError } = await client.from("job_source_snapshots").upsert(
    {
      source_record_id: r.id,
      kind: "detail",
      content_hash: hash,
      payload: { ...page, url: fetched.url } as unknown as Json,
    },
    { onConflict: "source_record_id,kind,content_hash", ignoreDuplicates: true },
  );
  check(snapshotError, "snapshot_save_failed");
  const { data: updated, error: recordError } = await client
    .from("job_source_records")
    .update({
      detail_text: page.evidenceText,
      detail_content_hash: hash,
      detail_fetched_at: now,
      verified_at: now,
      last_http_status: 200,
      employer_id: employerId,
      employer_name: name,
      source_title: page.title ?? r.source_title,
      employer_website_url: page.employerWebsiteUrl ?? r.employer_website_url,
      source_revision: revision,
      closes_at: closesAt,
      application_url: applicationUrl,
      location_text: page.locationText ?? r.location_text,
      country_code: page.locationCountryCode ?? r.country_code,
      location_locality: page.locationLocality ?? r.location_locality,
      location_region: page.locationRegion ?? r.location_region,
      postal_code: page.postalCode ?? r.postal_code,
      next_check_at: new Date(Date.now() + 12 * 3600000).toISOString(),
      pipeline_error: null,
    })
    .eq("id", r.id)
    .eq("source_revision", r.source_revision)
    .select("*")
    .maybeSingle();
  check(recordError, "source_verification_failed");
  if (!updated) return "cancelled" as const;
  let jobId = r.job_id;
  if (!jobId) {
    const { data, error } = await client.rpc("prepare_automated_job_draft", {
      p_source_record_id: r.id,
      p_employer_id: employerId,
      p_job_slug: toSlug(`${r.source_title ?? page.title}-${name}-${r.id}`),
    });
    check(error, "draft_preparation_failed");
    jobId = data;
  }
  const { data: job, error: jobError } = await client
    .from("jobs")
    .select("status,brief_source_hash,brief_policy_version,staff_reviewed_fields")
    .eq("id", jobId!)
    .single();
  check(jobError, "draft_read_failed");
  if (
    !job ||
    ["in_review", "withdrawn", "rejected", "expired"].includes(job.status) ||
    job.staff_reviewed_fields.length
  )
    return "review" as const;
  if (job.brief_source_hash === hash && job.brief_policy_version === BRIEF_POLICY_VERSION) {
    const { error } = await client.from("jobs").update({ source_verified_at: now }).eq("id", jobId!);
    check(error, "freshness_update_failed");
  } else if (source.ai_processing_allowed) {
    await enqueuePipelineTask(client, {
      key: `enrich:${r.id}:${revision}:${BRIEF_POLICY_VERSION}`,
      kind: "enrich",
      sourceId: r.source_id,
      recordId: r.id,
      revision,
    });
  }
  return "completed" as const;
}

async function readCatalogues(client: Client, text: string): Promise<BriefCatalogues> {
  const results = await Promise.all([
    client.from("occupations").select("id,title,description").eq("is_active", true).order("title").limit(120),
    client
      .from("career_areas")
      .select("id,title,description")
      .eq("is_active", true)
      .order("display_order")
      .limit(40),
    client
      .from("capabilities")
      .select("id,title,description")
      .eq("is_active", true)
      .order("title")
      .limit(160),
    client.from("benefits").select("id,title,description").eq("is_active", true).order("title").limit(80),
  ]);
  for (const result of results) check(result.error, "taxonomy_unavailable");
  const ranked = (items: BriefCatalogues["occupations"], maximum: number) =>
    items
      .map((item) => ({
        item,
        score: item.title
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length > 3 && text.toLowerCase().includes(w)).length,
      }))
      .sort((a, b) => b.score - a.score || a.item.id - b.item.id)
      .slice(0, maximum)
      .map(({ item }) => item);
  return {
    occupations: ranked(results[0].data ?? [], 30),
    careerAreas: results[1].data ?? [],
    capabilities: ranked(results[2].data ?? [], 25),
    benefits: ranked(results[3].data ?? [], 16),
  };
}

function briefApplication(output: BriefOutput, r: SourceRecord) {
  const missing: string[] = [];
  if (!output.fields.salary_text.value) missing.push("The advert does not specify a salary.");
  if (!output.fields.workplace_type.value) missing.push("The working arrangement is not explicitly stated.");
  if (!r.closes_at)
    missing.push("No closing date is advertised; check the original vacancy before applying.");
  const fields = Object.fromEntries(Object.entries(output.fields).map(([key, value]) => [key, value.value]));
  const taxonomy = (items: BriefOutput["occupations"]) =>
    items.map((item) => ({ ...item, confidence: 90, originalText: item.evidence }));
  return {
    policy_version: BRIEF_POLICY_VERSION,
    job: {
      ...fields,
      title: r.source_title,
      summary: output.summary.text,
      description: output.overview.text,
      responsibilities: output.responsibilities.map((item) => item.text).join("\n"),
      requirements: output.essential.map((item) => item.text).join("\n"),
      application_url: r.application_url,
      closes_at: r.closes_at,
      expires_at:
        r.closes_at ?? new Date(Date.parse(r.first_seen_at) + 30 * 86400000).toISOString().slice(0, 10),
      posted_at: r.source_updated_at?.slice(0, 10) ?? r.first_seen_at.slice(0, 10),
      locality: r.location_locality,
      region: r.location_region,
      postal_code: r.postal_code,
    },
    brief: {
      conservationContext: output.conservationContext.text,
      desirable: output.desirable.map((i) => i.text),
      practical: output.practical.map((i) => i.text),
      applicationChecklist: output.applicationChecklist.map((i) => i.text),
      missingInformation: missing,
    },
    occupations: taxonomy(output.occupations),
    career_areas: taxonomy(output.careerAreas),
    benefits: taxonomy(output.benefits),
    locations: [
      {
        rawText: output.fields.location_text.value,
        evidence: output.fields.location_text.evidence,
        countryCode: output.fields.country_code.value,
        locality: r.location_locality,
        region: r.location_region,
        postalCode: r.postal_code,
        addressLine1: null,
        addressLine2: null,
        precision: r.postal_code
          ? "postcode"
          : r.location_locality
            ? "locality"
            : r.location_region
              ? "region"
              : "country",
        confidence: 90,
      },
    ],
    capabilities: output.capabilities.map((item) => ({
      capabilityId: item.termId,
      confidence: 90,
      evidence: item.evidence,
      importance: "useful",
      relevanceScore: 80,
    })),
  };
}

async function enrichRecord(client: Client, task: Task) {
  const r = await readRecord(client, task.source_record_id!);
  if (!r.job_sources.is_active || !r.job_sources.collection_allowed || !r.job_sources.ai_processing_allowed)
    return "cancelled" as const;
  if (r.source_revision !== task.source_revision) return "cancelled" as const;
  if (!r.detail_text || !r.detail_content_hash || !r.job_id) throw new Error("verified_evidence_missing");
  const text = `${r.source_title}\n${r.detail_text}`;
  const catalogues = await readCatalogues(client, text);
  const { data: cached, error: cacheError } = await client
    .from("job_brief_versions")
    .select("*")
    .eq("source_record_id", r.id)
    .eq("source_revision", r.source_revision)
    .eq("policy_version", BRIEF_POLICY_VERSION)
    .maybeSingle();
  check(cacheError, "brief_cache_unavailable");
  let output: BriefOutput;
  let model: string;
  let errors: string[];
  if (cached) {
    output = briefOutputSchema.parse(cached.payload);
    model = cached.model;
    errors = validateJobBrief(output, text, catalogues);
  } else {
    const generated = await generateJobBrief(client, {
      recordId: r.id,
      revision: r.source_revision,
      title: r.source_title ?? "",
      text,
      catalogues,
    });
    output = generated.result;
    model = generated.model;
    errors = validateJobBrief(output, text, catalogues);
    const { error } = await client.from("job_brief_versions").insert({
      source_record_id: r.id,
      source_revision: r.source_revision,
      content_hash: r.detail_content_hash,
      policy_version: BRIEF_POLICY_VERSION,
      model,
      payload: output as unknown as Json,
      validation_errors: errors,
    });
    check(error, "brief_cache_save_failed");
  }
  if (task.ai_stage === "escalation" && cached?.model !== (process.env.AI_REVIEW_MODEL ?? "gpt-6.1-sol")) {
    const generated = await generateJobBrief(client, {
      recordId: r.id,
      revision: r.source_revision,
      title: r.source_title ?? "",
      text,
      catalogues,
      retry: true,
    });
    output = generated.result;
    model = generated.model;
    errors = validateJobBrief(output, text, catalogues);
    const { error } = await client
      .from("job_brief_versions")
      .update({ model, payload: output as unknown as Json, validation_errors: errors, review_result: null })
      .eq("source_record_id", r.id)
      .eq("source_revision", r.source_revision)
      .eq("policy_version", BRIEF_POLICY_VERSION);
    check(error, "escalation_save_failed");
  }
  if (errors.length && task.ai_stage === "primary") {
    await enqueuePipelineTask(client, {
      key: `enrich:${r.id}:${r.source_revision}:${BRIEF_POLICY_VERSION}:escalation`,
      kind: "enrich",
      sourceId: r.source_id,
      recordId: r.id,
      revision: r.source_revision,
      stage: "escalation",
    });
    return "completed" as const;
  }
  const reviewNeeded = r.id % 20 === 0 || process.env.PIPELINE_REVIEW_ALL === "true";
  if (!errors.length && reviewNeeded && task.ai_stage !== "review" && !cached?.review_result) {
    await enqueuePipelineTask(client, {
      key: `enrich:${r.id}:${r.source_revision}:${BRIEF_POLICY_VERSION}:review`,
      kind: "enrich",
      sourceId: r.source_id,
      recordId: r.id,
      revision: r.source_revision,
      stage: "review",
    });
    return "completed" as const;
  }
  if (task.ai_stage === "review" && !cached?.review_result && !errors.length) {
    const review = await reviewJobBrief(client, {
      recordId: r.id,
      revision: r.source_revision,
      text,
      brief: output,
    });
    if (!review.result.accurate || !review.result.useful || !review.result.materiallyComplete)
      errors.push(
        ...(review.result.issues.length ? review.result.issues : ["Independent review failed"]).map(
          (issue) => `review: ${issue}`,
        ),
      );
    const { error } = await client
      .from("job_brief_versions")
      .update({ review_result: review.result, validation_errors: errors })
      .eq("source_record_id", r.id)
      .eq("source_revision", r.source_revision)
      .eq("policy_version", BRIEF_POLICY_VERSION);
    check(error, "review_save_failed");
  } else if (cached?.review_result) errors = cached.validation_errors;
  if (errors.length) {
    const { error } = await client
      .from("job_source_records")
      .update({
        enrichment_status: "needs_review",
        pipeline_error: errors.join("; ").slice(0, 2000),
        automation_status: "blocked",
        automation_blockers: ["brief_unverified"],
      })
      .eq("id", r.id);
    check(error, "brief_review_save_failed");
    return "review" as const;
  }
  const { error } = await client.rpc("apply_pipeline_brief", {
    p_record_id: r.id,
    p_revision: r.source_revision,
    p_source_hash: r.detail_content_hash,
    p_result: briefApplication(output, r) as unknown as Json,
  });
  check(error, "brief_application_failed");
  await enqueuePipelineTask(client, {
    key: `publish:${r.id}:${r.source_revision}:${BRIEF_POLICY_VERSION}`,
    kind: "publish",
    sourceId: r.source_id,
    recordId: r.id,
    revision: r.source_revision,
  });
  return "completed" as const;
}

async function publishRecord(client: Client, task: Task) {
  const r = await readRecord(client, task.source_record_id!);
  if (r.source_revision !== task.source_revision) return "cancelled" as const;
  const { data: blockers, error } = await client.rpc("pipeline_publish_blockers", { p_record_id: r.id });
  check(error, "publication_check_failed");
  const { data: control, error: controlError } = await client
    .from("automation_controls")
    .select("*")
    .eq("id", "global")
    .single();
  check(controlError, "publication_control_failed");
  const live =
    process.env.AUTO_PUBLISH_ENABLED === "true" &&
    control?.auto_publish_enabled &&
    (control.auto_publish_source_record_id === null || control.auto_publish_source_record_id === r.id);
  const state = blockers?.length ? "blocked" : "ready";
  const updates = await Promise.all([
    client
      .from("job_source_records")
      .update({
        automation_status: state,
        automation_blockers: blockers ?? [],
        automation_policy_version: BRIEF_POLICY_VERSION,
        automation_evaluated_at: new Date().toISOString(),
        automation_score: blockers?.length ? 0 : 100,
      })
      .eq("id", r.id),
    client.from("automation_publication_decisions").insert({
      source_record_id: r.id,
      job_id: r.job_id,
      mode: live ? "live" : "shadow",
      decision: state,
      blocker_codes: blockers ?? [],
      score: blockers?.length ? 0 : 100,
      policy_version: BRIEF_POLICY_VERSION,
    }),
  ]);
  for (const result of updates) check(result.error, "publication_decision_save_failed");
  if (blockers?.length) return "review" as const;
  if (!live) return "completed" as const;
  const { error: publishError } = await client.rpc("publish_automated_source_record", {
    p_source_record_id: r.id,
    p_job_slug: "",
    p_policy_version: BRIEF_POLICY_VERSION,
    p_score: 100,
  });
  check(publishError, "atomic_publication_failed");
  return "completed" as const;
}

export async function runPipelineTask(client: Client, recordId?: number) {
  const { data, error } = await client.rpc("claim_pipeline_task", recordId ? { p_record_id: recordId } : {});
  check(error, "task_claim_failed");
  if (!data) return { status: "idle" as const };
  const task = data as unknown as Task;
  let status: "completed" | "review" | "failed" | "cancelled" | "deferred" = "completed";
  let errorCode: string | null = null;
  try {
    if (task.kind === "import") {
      const { data: source, error } = await client
        .from("job_sources")
        .select("*")
        .eq("id", task.source_id)
        .single();
      check(error, "import_source_missing");
      if (!source) throw new Error("import_source_missing");
      const result = await importApprovedSource(client, source);
      if (result.status === "failed") throw new Error("source_import_failed");
    } else if (task.kind === "verify") status = await verifyRecord(client, task);
    else if (task.kind === "enrich") status = await enrichRecord(client, task);
    else status = await publishRecord(client, task);
  } catch (error) {
    errorCode = error instanceof Error ? error.message : "pipeline_task_failed";
    status =
      error instanceof AiBudgetUnavailable
        ? "deferred"
        : error instanceof AiRequestUncertain ||
            /ambiguous|requires_review|identity_missing|instructions_missing/.test(errorCode)
          ? "review"
          : "failed";
    if (task.source_record_id)
      await client
        .from("job_source_records")
        .update({ pipeline_error: errorCode.slice(0, 2000) })
        .eq("id", task.source_record_id);
    console.error("WildJobs pipeline task stopped.", { taskId: task.id, kind: task.kind, errorCode });
  }
  const { data: finished, error: finishError } = await client.rpc("finish_pipeline_task", {
    p_task_id: task.id,
    p_lease_token: task.lease_token!,
    p_status: status,
    ...(errorCode ? { p_error: errorCode.slice(0, 2000) } : {}),
  });
  check(finishError, "task_completion_failed");
  if (!finished) throw new Error("task_lease_lost");
  return { status, taskId: task.id, kind: task.kind, recordId: task.source_record_id, errorCode };
}
