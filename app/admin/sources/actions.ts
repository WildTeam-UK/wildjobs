"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseCjsVacancyFeed } from "@/lib/admin/feed-source";
import { getSourceConnector, type SourceConnector } from "@/lib/admin/source-connector";
import { validateSource, validateSourceStatus } from "@/lib/admin/source-validation";
import { parseWwtVacancies } from "@/lib/admin/wwt-source";
import { requireAdministrator } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

const MAX_SOURCE_BYTES = 1_500_000;

function readSourceId(formData: FormData) {
  const sourceId = Number(formData.get("sourceId"));
  return Number.isSafeInteger(sourceId) && sourceId > 0 ? sourceId : null;
}

async function fetchSourceVacancies(connector: SourceConnector, url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "WildJobs source checker (+https://jobs.wildteam.org.uk)" },
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
  });

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (
    !response.ok ||
    getSourceConnector(connector === "rss" ? "feed" : "manual_curation", response.url) !== connector
  ) {
    throw new Error("The source did not return the approved vacancy endpoint.");
  }
  if (connector === "wwt" && !contentType.includes("text/html")) {
    throw new Error("The source did not return an HTML vacancies page.");
  }
  if (
    connector === "rss" &&
    !["application/rss+xml", "application/atom+xml", "application/xml", "text/xml", "text/html"].some(
      (type) => contentType.includes(type),
    )
  ) {
    throw new Error("The source did not return an RSS or Atom feed.");
  }
  if (contentLength > MAX_SOURCE_BYTES) throw new Error("The source response was too large.");

  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_SOURCE_BYTES) throw new Error("The source response was too large.");

  const sourceBody = new TextDecoder().decode(body);
  const vacancies = connector === "rss" ? parseCjsVacancyFeed(sourceBody) : parseWwtVacancies(sourceBody);
  if (!vacancies.length) throw new Error("No verified vacancy records were found.");
  return vacancies;
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

  const { data: run, error: runError } = await supabase
    .from("import_runs")
    .insert({ source_id: source.id })
    .select("id")
    .single();

  if (runError || !run) redirect("/admin/sources?error=connection-unavailable");

  try {
    const [vacancies, existingResult] = await Promise.all([
      fetchSourceVacancies(connector, sourceUrl),
      supabase
        .from("job_source_records")
        .select("id, external_id, canonical_url, content_hash, mapping_status")
        .eq("source_id", source.id),
    ]);

    if (existingResult.error) throw new Error("Existing source records could not be read.");

    const existingByExternalId = new Map(
      (existingResult.data ?? [])
        .filter((record) => record.external_id)
        .map((record) => [record.external_id, record]),
    );
    const existingByCanonicalUrl = new Map(
      (existingResult.data ?? [])
        .filter((record) => record.canonical_url)
        .map((record) => [record.canonical_url, record]),
    );
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFlagged = 0;
    const seenAt = new Date().toISOString();

    for (const vacancy of vacancies) {
      const contentHash = createHash("sha256").update(JSON.stringify(vacancy)).digest("hex");
      const existing =
        existingByExternalId.get(vacancy.externalId) ?? existingByCanonicalUrl.get(vacancy.canonicalUrl);

      if (existing) {
        const changed =
          existing.content_hash !== contentHash ||
          existing.canonical_url !== vacancy.canonicalUrl ||
          existing.external_id !== vacancy.externalId;
        const { error } = await supabase
          .from("job_source_records")
          .update({
            canonical_url: vacancy.canonicalUrl,
            closes_at: vacancy.closesAt,
            content_hash: contentHash,
            employer_name: vacancy.employer,
            external_id: vacancy.externalId,
            last_seen_at: seenAt,
            location_text: vacancy.location,
            source_title: vacancy.title,
            source_updated_at: vacancy.publishedAt,
            summary: vacancy.summary,
          })
          .eq("id", existing.id);
        if (error) throw new Error("A source record could not be updated.");
        if (changed) recordsUpdated += 1;
        if (existing.mapping_status === "possible_duplicate") recordsFlagged += 1;
        continue;
      }

      const { error } = await supabase.from("job_source_records").insert({
        canonical_url: vacancy.canonicalUrl,
        closes_at: vacancy.closesAt,
        content_hash: contentHash,
        employer_name: vacancy.employer,
        external_id: vacancy.externalId,
        first_seen_at: seenAt,
        last_seen_at: seenAt,
        location_text: vacancy.location,
        mapping_status: "unmapped",
        source_id: source.id,
        source_title: vacancy.title,
        source_updated_at: vacancy.publishedAt,
        summary: vacancy.summary,
      });
      if (error) throw new Error("A source record could not be created.");
      recordsCreated += 1;
    }

    const { error: completionError } = await supabase
      .from("import_runs")
      .update({
        finished_at: new Date().toISOString(),
        records_created: recordsCreated,
        records_flagged: recordsFlagged,
        records_seen: vacancies.length,
        records_updated: recordsUpdated,
        status: "completed",
      })
      .eq("id", run.id);
    if (completionError) throw new Error("The import run could not be completed.");
  } catch {
    await supabase
      .from("import_runs")
      .update({
        error_summary: "The approved source could not be checked. No listings were published.",
        finished_at: new Date().toISOString(),
        status: "failed",
      })
      .eq("id", run.id);
    redirect(`/admin/sources/${source.id}?status=failed`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  revalidatePath("/admin/sources");
  revalidatePath(`/admin/sources/${source.id}`);
  redirect(`/admin/sources/${source.id}?status=checked&run=${run.id}`);
}
