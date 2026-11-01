"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdministrator } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { ENVIRONMENT_JOB_RSS_URL } from "@/lib/admin/feed-source";
import { enqueuePipelineTask } from "@/lib/admin/job-pipeline";

export async function savePipelineSourcePolicy(form: FormData) {
  await requireAdministrator();
  const id = Number(form.get("sourceId"));
  const note = String(form.get("permissionNotes") ?? "").trim();
  if (!Number.isSafeInteger(id) || note.length < 20 || note.length > 2000)
    redirect("/admin/automation?error=permission-note");
  const client = createTrustedClient();
  const { data: source, error } = await client
    .from("job_sources")
    .select("authoritative_base_url")
    .eq("id", id)
    .single();
  if (error || source?.authoritative_base_url !== ENVIRONMENT_JOB_RSS_URL)
    redirect("/admin/automation?error=source-scope");
  const collection = form.get("collectionAllowed") === "on";
  const ai = form.get("aiAllowed") === "on";
  const publication = form.get("publicationAllowed") === "on";
  if (((ai || publication) && !collection) || (publication && !ai))
    redirect("/admin/automation?error=permission-order");
  const { error: saveError } = await client
    .from("job_sources")
    .update({
      collection_allowed: collection,
      ai_processing_allowed: ai,
      publication_allowed: publication,
      permissions_reviewed_at: new Date().toISOString().slice(0, 10),
      permission_notes: note,
      description_display_mode: "summary_only",
      logo_reuse_allowed: false,
    })
    .eq("id", id);
  if (saveError) redirect("/admin/automation?error=save");
  revalidatePath("/admin/automation");
  revalidatePath("/admin/sources");
  redirect("/admin/automation?saved=permissions");
}

export async function setPipelinePublishing(form: FormData) {
  await requireAdministrator();
  const enabled = form.get("enabled") === "true";
  const targetText = String(form.get("recordId") ?? "").trim();
  const target = targetText ? Number(targetText) : null;
  if (target !== null && (!Number.isSafeInteger(target) || target < 1))
    redirect("/admin/automation?error=target");
  const client = createTrustedClient();
  if (enabled && target !== null) {
    const { data: blockers, error } = await client.rpc("pipeline_publish_blockers", { p_record_id: target });
    if (error || blockers?.length) redirect("/admin/automation?error=not-ready");
  }
  const { error } = await client
    .from("automation_controls")
    .update({
      auto_publish_enabled: enabled,
      auto_publish_source_record_id: target,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "global");
  if (error) redirect("/admin/automation?error=save");
  revalidatePath("/admin/automation");
  redirect("/admin/automation?saved=publishing");
}

export async function retryPipelineTask(form: FormData) {
  await requireAdministrator();
  const id = Number(form.get("taskId"));
  if (!Number.isSafeInteger(id)) redirect("/admin/automation?error=task");
  const client = createTrustedClient();
  const { data: task, error } = await client.from("job_pipeline_tasks").select("*").eq("id", id).single();
  if (error || !task || !["failed", "review"].includes(task.status)) redirect("/admin/automation?error=task");
  if (task.source_record_id) {
    const { data: record, error: readError } = await client
      .from("job_source_records")
      .select("source_revision")
      .eq("id", task.source_record_id)
      .single();
    if (readError || !record) redirect("/admin/automation?error=task");
    const revision = record.source_revision + 1;
    const { error: updateError } = await client
      .from("job_source_records")
      .update({ source_revision: revision, pipeline_error: null })
      .eq("id", task.source_record_id)
      .eq("source_revision", record.source_revision);
    if (updateError) redirect("/admin/automation?error=save");
    await enqueuePipelineTask(client, {
      key: `verify:${task.source_record_id}:staff:${revision}`,
      kind: "verify",
      sourceId: task.source_id,
      recordId: task.source_record_id,
      revision,
    });
  } else {
    const { error: updateError } = await client
      .from("job_pipeline_tasks")
      .update({ status: "pending", attempts: 0, error_code: null, due_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) redirect("/admin/automation?error=save");
  }
  revalidatePath("/admin/automation");
  redirect("/admin/automation?saved=retry");
}
