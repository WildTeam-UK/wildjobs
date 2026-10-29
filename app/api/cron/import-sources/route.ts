import { isCronRequestAuthorized } from "@/lib/admin/cron-auth";
import { importApprovedSource } from "@/lib/admin/source-import";
import { getSourceConnector } from "@/lib/admin/source-connector";
import { createIngestionClient } from "@/lib/supabase/ingestion";

export async function GET(request: Request) {
  if (!isCronRequestAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const supabase = createIngestionClient();
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
    return Response.json({ ok: summary.failed === 0, ...summary }, { status: summary.failed ? 500 : 200 });
  } catch (error) {
    console.error("Scheduled WildJobs source import could not start.", {
      message: error instanceof Error ? error.message : "Unknown import error",
    });
    return Response.json({ ok: false }, { status: 500 });
  }
}
