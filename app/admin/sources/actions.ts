"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createJobDraft } from "@/lib/admin/create-job-draft";
import { findDuplicateJob, findDuplicateSourceRecord } from "@/lib/admin/duplicate-match";
import { importApprovedSource } from "@/lib/admin/source-import";
import { getSourceConnector } from "@/lib/admin/source-connector";
import { buildSourceRecordDraftDefaults, prepareSourceRecordJobInput } from "@/lib/admin/source-record-draft";
import {
  validateSource,
  validateSourceRecordLink,
  validateSourceRecordStatus,
  validateSourceStatus,
} from "@/lib/admin/source-validation";
import { requireAdministrator } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

function readSourceId(formData: FormData) {
  const sourceId = Number(formData.get("sourceId"));
  return Number.isSafeInteger(sourceId) && sourceId > 0 ? sourceId : null;
}

function readRecordId(formData: FormData) {
  const recordId = Number(formData.get("recordId"));
  return Number.isSafeInteger(recordId) && recordId > 0 ? recordId : null;
}

export async function addSource(formData: FormData) {
  await requireAdministrator();
  const result = validateSource(formData);

  if (result.error) redirect(`/admin/sources?error=${result.error}`);

  const supabase = await createClient();
  const { error } = await supabase.from("job_sources").insert({
    authoritative_base_url: result.data.authoritativeBaseUrl,
    is_active: result.data.isActive,
    name: result.data.name,
    source_type: result.data.sourceType,
  });

  if (error) {
    redirect(`/admin/sources?error=${error.code === "23505" ? "duplicate" : "unavailable"}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/sources");
  redirect("/admin/sources?status=created");
}

export async function setSourceStatus(formData: FormData) {
  await requireAdministrator();
  const result = validateSourceStatus(formData);

  if (result.error) redirect(`/admin/sources?error=${result.error}`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_sources")
    .update({ is_active: result.data.isActive })
    .eq("id", result.data.sourceId)
    .select("id")
    .maybeSingle();

  if (error) redirect("/admin/sources?error=unavailable");
  if (!data) redirect("/admin/sources?error=invalid-source");

  revalidatePath("/admin");
  revalidatePath("/admin/sources");
  redirect(`/admin/sources?status=${result.data.isActive ? "activated" : "paused"}`);
}

export async function setSourceRecordStatus(formData: FormData) {
  await requireAdministrator();
  const result = validateSourceRecordStatus(formData);
  if (result.error) redirect("/admin/sources?error=invalid-record");

  const supabase = await createClient();
  const { data: record, error: recordError } = await supabase
    .from("job_source_records")
    .select("id, source_id, job_id, mapping_status")
    .eq("id", result.data.recordId)
    .maybeSingle();

  if (recordError || !record || record.job_id !== null || record.mapping_status === "mapped") {
    redirect("/admin/sources?error=invalid-record");
  }

  const { data: updatedRecord, error: updateError } = await supabase
    .from("job_source_records")
    .update({ mapping_status: result.data.status })
    .eq("id", record.id)
    .eq("source_id", record.source_id)
    .is("job_id", null)
    .neq("mapping_status", "mapped")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedRecord) {
    redirect(`/admin/sources/${record.source_id}?error=triage-unavailable`);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/sources/${record.source_id}`);
  redirect(`/admin/sources/${record.source_id}?status=triaged&record=${record.id}`);
}

export async function linkSourceRecordToJob(formData: FormData) {
  await requireAdministrator();
  const result = validateSourceRecordLink(formData);
  if (result.error) redirect("/admin/sources?error=invalid-record");

  const supabase = await createClient();
  const { data: record, error: recordError } = await supabase
    .from("job_source_records")
    .select("id, source_id")
    .eq("id", result.data.recordId)
    .maybeSingle();
  if (recordError || !record) redirect("/admin/sources?error=invalid-record");

  const { data: jobId, error } = await supabase.rpc("link_source_record_to_job", {
    p_job_id: result.data.jobId,
    p_source_record_id: record.id,
  });
  if (error || !jobId) {
    redirect(`/admin/sources/${record.source_id}?error=link-unavailable&record=${record.id}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath(`/admin/sources/${record.source_id}`);
  redirect(`/admin/sources/${record.source_id}?status=linked&record=${record.id}`);
}

export async function prepareSourceRecordDraft(formData: FormData) {
  await requireAdministrator();
  const recordId = readRecordId(formData);
  if (!recordId) redirect("/admin/sources?error=invalid-record");

  const supabase = await createClient();
  const { data: record, error: recordError } = await supabase
    .from("job_source_records")
    .select(
      "id, source_id, canonical_url, mapping_status, job_id, source_title, employer_name, location_text, closes_at, source_updated_at, summary, job_sources(name, is_active)",
    )
    .eq("id", recordId)
    .maybeSingle();

  if (
    recordError ||
    !record ||
    !record.canonical_url ||
    record.job_id !== null ||
    !record.job_sources?.is_active ||
    !["unmapped", "possible_duplicate"].includes(record.mapping_status)
  ) {
    redirect("/admin/sources?error=invalid-record");
  }
  if (record.mapping_status === "possible_duplicate") {
    redirect(`/admin/sources/${record.source_id}?error=duplicate-review&record=${record.id}`);
  }

  const [jobsResult, otherRecordsResult] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, title, status, employers(name), job_source_records(canonical_url)")
      .order("updated_at", { ascending: false })
      .limit(1_000),
    supabase
      .from("job_source_records")
      .select("id, source_id, canonical_url, employer_name, source_title, job_sources(name)")
      .neq("source_id", record.source_id)
      .is("job_id", null)
      .in("mapping_status", ["unmapped", "possible_duplicate"])
      .limit(1_000),
  ]);
  if (jobsResult.error || otherRecordsResult.error) {
    redirect(`/admin/sources/${record.source_id}?error=prepare-unavailable&record=${record.id}`);
  }

  const duplicateJob = findDuplicateJob(
    record,
    (jobsResult.data ?? []).map((job) => ({
      canonicalUrls: job.job_source_records.flatMap((sourceRecord) =>
        sourceRecord.canonical_url ? [sourceRecord.canonical_url] : [],
      ),
      employerName: job.employers.name,
      id: job.id,
      status: job.status,
      title: job.title,
    })),
  );
  const duplicateSource = findDuplicateSourceRecord(
    record,
    (otherRecordsResult.data ?? []).map((sourceRecord) => ({
      canonicalUrl: sourceRecord.canonical_url,
      employerName: sourceRecord.employer_name,
      id: sourceRecord.id,
      sourceId: sourceRecord.source_id,
      sourceName: sourceRecord.job_sources.name,
      sourceTitle: sourceRecord.source_title,
    })),
  );
  if (duplicateJob || duplicateSource) {
    redirect(`/admin/sources/${record.source_id}?error=duplicate-review&record=${record.id}`);
  }

  const defaults = buildSourceRecordDraftDefaults({
    ...record,
    employer_name: record.employer_name ?? record.job_sources.name,
  });
  const result = prepareSourceRecordJobInput(defaults);
  if (!result.data) {
    redirect(`/admin/jobs/new?recordId=${record.id}&auto=needs-review`);
  }

  const { data: jobId, error } = await createJobDraft(supabase, result.data);
  if (error || !jobId) {
    redirect(`/admin/sources/${record.source_id}?error=prepare-unavailable&record=${record.id}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/sources/${record.source_id}`);
  redirect(`/admin/jobs/${jobId}?status=created`);
}

export async function runSourceDiscovery(formData: FormData) {
  await requireAdministrator();
  const sourceId = readSourceId(formData);
  if (!sourceId) redirect("/admin/sources?error=invalid-source");

  const supabase = await createClient();
  const { data: source, error: sourceError } = await supabase
    .from("job_sources")
    .select("id, source_type, authoritative_base_url, is_active")
    .eq("id", sourceId)
    .maybeSingle();

  if (sourceError || !source || !source.is_active) {
    redirect("/admin/sources?error=invalid-source");
  }
  const connector = getSourceConnector(source.source_type, source.authoritative_base_url);
  if (!connector) {
    redirect("/admin/sources?error=unsupported-connection");
  }
  const sourceUrl = source.authoritative_base_url;
  if (!sourceUrl) redirect("/admin/sources?error=unsupported-connection");

  let result;
  try {
    result = await importApprovedSource(supabase, source);
  } catch {
    redirect("/admin/sources?error=connection-unavailable");
  }

  if (result.status === "failed") redirect(`/admin/sources/${source.id}?status=failed`);
  if (result.status === "already_running") {
    redirect(`/admin/sources/${source.id}?status=already-running`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${source.id}`);
  redirect(`/admin/sources/${source.id}?status=checked&run=${result.runId}`);
}
