import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { parseApprovedVacancyFeed } from "./feed-source";
import { getSourceConnector } from "./source-connector";
import { parseWwtVacancies } from "./wwt-source";
import { normalizeVacancyUrl } from "./job-brief-validation";

export type ApprovedSource = {
  authoritative_base_url: string | null;
  id: number;
  is_active: boolean;
  source_type: string;
};
export type SourceImportResult =
  | {
      recordsCreated: number;
      recordsFlagged: number;
      recordsSeen: number;
      recordsUpdated: number;
      runId: number;
      status: "completed";
    }
  | { runId: number; status: "failed" }
  | { status: "already_running" };

export async function importApprovedSource(
  client: SupabaseClient<Database>,
  input: ApprovedSource,
): Promise<SourceImportResult> {
  const { data: source, error: sourceError } = await client
    .from("job_sources")
    .select("*")
    .eq("id", input.id)
    .single();
  if (
    sourceError ||
    !source?.is_active ||
    !source.collection_allowed ||
    !source.permissions_reviewed_at ||
    !source.authoritative_base_url
  )
    throw new Error("source_collection_unapproved");
  const connector = getSourceConnector(source.source_type, source.authoritative_base_url);
  if (!connector) throw new Error("source_connector_missing");
  await client
    .from("import_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_summary: "Import lease expired.",
    })
    .eq("source_id", source.id)
    .eq("status", "started")
    .lt("started_at", new Date(Date.now() - 15 * 60000).toISOString());
  const { data: run, error: runError } = await client
    .from("import_runs")
    .insert({ source_id: source.id })
    .select("id")
    .single();
  if (runError?.code === "23505") return { status: "already_running" };
  if (runError || !run) throw new Error("import_start_failed");
  try {
    const headers: Record<string, string> = {
      "User-Agent": "WildJobs source checker (+https://jobs.wildteam.org.uk)",
    };
    if (source.http_etag) headers["If-None-Match"] = source.http_etag;
    if (source.http_last_modified) headers["If-Modified-Since"] = source.http_last_modified;
    const response = await fetch(source.authoritative_base_url, {
      cache: "no-store",
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
    });
    let counts = { created: 0, changed: 0, seen: 0 };
    if (response.status !== 304) {
      if (!response.ok || Number(response.headers.get("content-length") ?? 0) > 1500000)
        throw new Error("feed_fetch_failed");
      const body = await response.arrayBuffer();
      if (body.byteLength > 1500000) throw new Error("feed_too_large");
      const text = new TextDecoder().decode(body);
      const vacancies =
        connector === "rss"
          ? parseApprovedVacancyFeed(text, source.authoritative_base_url)
          : parseWwtVacancies(text);
      if (connector === "wwt" && !vacancies.length && !/no vacancies|no results/i.test(text))
        throw new Error("source_parser_failed");
      const items = vacancies.map((vacancy) => {
        const item = { ...vacancy, canonicalUrl: normalizeVacancyUrl(vacancy.canonicalUrl) };
        // Publication timestamp churn does not make the advert materially different.
        const { publishedAt: _publishedAt, ...material } = item;
        return { ...item, contentHash: createHash("sha256").update(JSON.stringify(material)).digest("hex") };
      });
      const { data, error } = await client.rpc("ingest_pipeline_feed", {
        p_source_id: source.id,
        p_items: items as unknown as Json,
      });
      if (error) throw new Error("feed_persistence_failed");
      counts = data as unknown as typeof counts;
    }
    const saved = await Promise.all([
      client
        .from("job_sources")
        .update({
          next_import_at: new Date(Date.now() + 2 * 3600000).toISOString(),
          http_etag: response.headers.get("etag") ?? source.http_etag,
          http_last_modified: response.headers.get("last-modified") ?? source.http_last_modified,
        })
        .eq("id", source.id),
      client
        .from("import_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          records_seen: counts.seen,
          records_created: counts.created,
          records_updated: counts.changed,
          records_flagged: 0,
        })
        .eq("id", run.id),
    ]);
    if (saved.some((r) => r.error)) throw new Error("import_completion_failed");
    return {
      status: "completed",
      runId: run.id,
      recordsCreated: counts.created,
      recordsUpdated: counts.changed,
      recordsSeen: counts.seen,
      recordsFlagged: 0,
    };
  } catch (error) {
    console.error("Approved source import stopped.", {
      sourceId: source.id,
      code: error instanceof Error ? error.message : "source_import_failed",
    });
    await client
      .from("import_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error_summary:
          "The approved feed could not be fetched, parsed or saved; its last successful records remain intact.",
      })
      .eq("id", run.id);
    return { status: "failed", runId: run.id };
  }
}
