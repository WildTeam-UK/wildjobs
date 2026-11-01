import { isAutomationRequestAuthorized } from "@/lib/admin/automation-auth";
import { runPipelineTask, schedulePipelineWork } from "@/lib/admin/job-pipeline";
import { syncPeriodicLearnWorldsCourses } from "@/lib/admin/learnworlds-course-sync";
import { createTrustedClient } from "@/lib/supabase/trusted";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isAutomationRequestAuthorized(request.headers.get("authorization"), process.env.AUTOMATION_SECRET))
    return new Response("Unauthorized", { status: 401 });
  try {
    const client = createTrustedClient();
    const { error } = await client
      .from("source_import_automation")
      .update({ last_heartbeat_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) throw new Error("heartbeat_persistence_failed");
    // A course sync has its own bounded request, rather than sharing a timeout with vacancy generation.
    const courses = await syncPeriodicLearnWorldsCourses(client);
    if (courses.status === "completed" || courses.status === "failed")
      return Response.json(
        { ok: courses.status === "completed", action: "course_catalogue_synced", courses },
        { status: courses.status === "failed" ? 500 : 200 },
      );
    await schedulePipelineWork(client);
    const task = await runPipelineTask(client);
    return Response.json(
      { ok: task.status !== "failed", action: task.status === "idle" ? "idle" : "pipeline_task", task },
      { status: task.status === "failed" ? 500 : 200 },
    );
  } catch (error) {
    console.error("WildJobs heartbeat failed.", { code: error instanceof Error ? error.message : "unknown" });
    return Response.json({ ok: false, error: "pipeline_unavailable" }, { status: 500 });
  }
}
