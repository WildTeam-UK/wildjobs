"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { importApprovedSource } from "@/lib/admin/source-import";
import { getSourceConnector } from "@/lib/admin/source-connector";
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
