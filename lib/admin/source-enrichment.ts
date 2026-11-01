import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { enqueuePipelineTask, runPipelineTask, schedulePipelineWork } from "./job-pipeline";

// Compatibility entry point for the existing staff action. All execution now uses leased tasks.
export async function enrichNextPendingSourceRecord(
  client: SupabaseClient<Database>,
  trigger: "manual" | "automation",
  recordId?: number,
) {
  if (trigger === "manual" && recordId) {
    const { data: record, error } = await client
      .from("job_source_records")
      .select("id,source_id,source_revision")
      .eq("id", recordId)
      .single();
    if (error || !record) throw new Error("source_record_missing");
    const revision = record.source_revision + 1;
    const { error: updateError } = await client
      .from("job_source_records")
      .update({ source_revision: revision, pipeline_error: null })
      .eq("id", recordId)
      .eq("source_revision", record.source_revision);
    if (updateError) throw new Error("staff_retry_failed");
    await enqueuePipelineTask(client, {
      key: `verify:${recordId}:staff:${revision}`,
      kind: "verify",
      sourceId: record.source_id,
      recordId,
      revision,
    });
  } else await schedulePipelineWork(client);
  const task = await runPipelineTask(client, recordId);
  if (task.status === "idle") return { status: "idle" as const };
  return {
    recordId: task.recordId ?? recordId ?? 0,
    runId: task.taskId,
    status:
      task.status === "review" || task.status === "deferred"
        ? ("needs_review" as const)
        : task.status === "cancelled"
          ? ("skipped" as const)
          : task.status,
  };
}
