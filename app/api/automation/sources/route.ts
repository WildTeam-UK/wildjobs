import { isAutomationRequestAuthorized } from "@/lib/admin/automation-auth";
import { importApprovedSource } from "@/lib/admin/source-import";
import { getSourceConnector } from "@/lib/admin/source-connector";
import { createTrustedClient } from "@/lib/supabase/trusted";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isAutomationRequestAuthorized(request.headers.get("authorization"), process.env.AUTOMATION_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = createTrustedClient();
    const { data: claimed, error: claimError } = await supabase.rpc("claim_periodic_source_import", {
      interval_hours: 2,
    });
    if (claimError) throw new Error("The scheduled source check could not be claimed.");

    if (!claimed) {
      return Response.json({ action: "idle", ok: true });
    }

    const { data: sources, error } = await supabase
      .from("job_sources")
      .select("id, source_type, authoritative_base_url, is_active")
      .eq("is_active", true)
      .order("id");
    if (error) throw new Error("Approved sources could not be read.");

    const approvedSources = (sources ?? []).filter((source) =>
      Boolean(getSourceConnector(source.source_type, source.authoritative_base_url)),
    );
    const summary = { completed: 0, failed: 0, skipped: 0, sources: approvedSources.length };

    for (const source of approvedSources) {
      const result = await importApprovedSource(supabase, source);
      if (result.status === "completed") summary.completed += 1;
      if (result.status === "failed") summary.failed += 1;
      if (result.status === "already_running") summary.skipped += 1;
    }

    console.info("Scheduled WildJobs source import finished.", summary);
    return Response.json(
      { action: "imported", ok: summary.failed === 0, ...summary },
      { status: summary.failed ? 500 : 200 },
    );
  } catch (error) {
    console.error("WildJobs source automation heartbeat failed.", {
      message: error instanceof Error ? error.message : "Unknown automation error",
    });
    return Response.json({ ok: false }, { status: 500 });
  }
}
