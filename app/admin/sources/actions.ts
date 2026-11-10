"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdministrator } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { publicUrl } from "@/lib/directory-url";
import { closingDate } from "@/lib/directory-lifecycle";
import { sourceConfigSchema, sourceError } from "@/lib/source-config";
import { readSource } from "@/lib/source-reader";
import { sourceCatalogue } from "@/lib/source-catalogue";
import { syncDirectory } from "@/lib/directory-sync";
import type { Json } from "@/lib/supabase/database.types";

function finish(message: string, error = false): never {
  for (const path of ["/", "/admin", "/admin/sources", "/admin/jobs"]) revalidatePath(path);
  redirect(`/admin/sources?${error ? "error" : "message"}=${encodeURIComponent(message.slice(0, 800))}`);
}
function sourceId(form: FormData) {
  const id = Number(form.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Choose a valid source.");
  return id;
}
async function checkSource(id: number, actor: string) {
  const db = createTrustedClient();
  const source = await db.from("directory_sources").select("*").eq("id", id).is("removed_at", null).single();
  if (source.error) throw new Error("Source could not be loaded.");
  let result: Json;
  try {
    const checked = await readSource({
      url: source.data.feed_url,
      name: source.data.name,
      config: sourceConfigSchema.parse(source.data.configuration),
    });
    result = checked.preview as unknown as Json;
  } catch (error) {
    result = { ...sourceError(error), checkedAt: new Date().toISOString() };
  }
  const saved = await db.rpc("record_directory_source_check", {
    p_source_id: id,
    p_revision: source.data.configuration_revision,
    p_result: result,
    p_actor: actor,
  });
  if (saved.error || !saved.data)
    throw new Error("The source changed during its check. Check its current settings again.");
}
export async function addSource(form: FormData) {
  const staff = await requireAdministrator();
  let error: string | undefined;
  try {
    const url = publicUrl(String(form.get("feed_url") || "")).toString();
    const kind = String(form.get("kind") || "auto");
    const config = sourceConfigSchema.parse({
      kind,
      organisation: String(form.get("organisation") || ""),
      intervalHours: Number(form.get("interval_hours") || 12),
      listingSelector: String(form.get("listing_selector") || ""),
      jobLinkSelector: String(form.get("job_link_selector") || ""),
      nextSelector: String(form.get("next_selector") || ""),
      emptySelector: String(form.get("empty_selector") || ""),
      descriptionSelector: String(form.get("description_selector") || ""),
      allowedOrigins: String(form.get("allowed_origins") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((v) => publicUrl(v).origin),
      ...(kind === "manual"
        ? {
            manual: {
              title: String(form.get("job_title") || ""),
              description: String(form.get("job_description") || ""),
              location: String(form.get("job_location") || ""),
              salary: String(form.get("job_salary") || ""),
              closesAt: closingDate(String(form.get("job_closes") || "")) || "",
            },
          }
        : {}),
    });
    const notes = String(form.get("notes") || "").trim();
    if (notes.length > 2000) throw new Error("Source notes can contain up to 2,000 characters.");
    const saved = await createTrustedClient().rpc("save_directory_source", {
      p_url: url,
      p_name: String(form.get("name") || "").trim() || new URL(url).hostname,
      p_configuration: config as unknown as Json,
      p_notes: notes,
      ...(form.get("id") ? { p_id: sourceId(form) } : {}),
      p_actor: staff.userId,
    });
    if (saved.error) throw new Error(saved.error.message);
    await checkSource(saved.data, staff.userId);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Source could not be saved.";
  }
  if (error) finish(error, true);
  finish(
    "Source saved and checked. Review its preview or the reason it needs attention before enabling imports.",
  );
}
export async function changeSource(form: FormData) {
  const staff = await requireAdministrator();
  let error: string | undefined;
  try {
    const id = sourceId(form),
      action = String(form.get("action") || "");
    if (action === "check") await checkSource(id, staff.userId);
    else if (action === "restore") {
      const db = createTrustedClient();
      const source = await db.from("directory_sources").select("*").eq("id", id).single();
      if (source.error || !source.data.removed_at) throw new Error("Choose a removed source to restore.");
      const restored = await db.rpc("save_directory_source", {
        p_url: source.data.feed_url,
        p_name: source.data.name,
        p_configuration: source.data.configuration,
        p_notes: source.data.notes,
        p_actor: staff.userId,
      });
      if (restored.error) throw new Error(restored.error.message);
      await checkSource(restored.data, staff.userId);
    } else {
      if (!["pause", "resume", "refresh", "remove"].includes(action))
        throw new Error("Choose a valid source action.");
      const db = createTrustedClient();
      const result = await db.rpc("change_directory_source", {
        p_source_id: id,
        p_action: action,
        p_actor: staff.userId,
        p_reviewed: form.get("reviewed") === "on",
      });
      if (result.error) throw new Error(result.error.message);
      if (action === "refresh") {
        const source = await db.from("directory_sources").select("enabled").eq("id", id).single();
        if (source.error) throw new Error("The source status could not be loaded.");
        if (source.data.enabled) await syncDirectory(true, id);
        else await checkSource(id, staff.userId);
      }
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Source could not be updated.";
  }
  if (error) finish(error, true);
  finish("Source updated. See its current check and import status below.");
}
export async function queueCatalogue() {
  const staff = await requireAdministrator();
  const db = createTrustedClient();
  const existing = await db.from("directory_sources").select("feed_url");
  if (existing.error) finish("The existing source catalogue could not be loaded.", true);
  const urls = new Set(existing.data.map((s) => s.feed_url));
  for (const source of sourceCatalogue) {
    if (urls.has(source.url)) continue;
    const result = await db.rpc("save_directory_source", {
      p_url: source.url,
      p_name: source.name,
      p_configuration: sourceConfigSchema.parse(source.config) as unknown as Json,
      p_notes:
        source.notes || "From the November 2026 conservation sources list. Access and reuse review pending.",
      p_actor: staff.userId,
    });
    if (result.error)
      finish(
        "The catalogue was partly queued. Retry to add the remaining entries; existing sources are preserved.",
        true,
      );
    urls.add(source.url);
  }
  finish(
    "The proposed catalogue is saved with imports paused. Check sources in batches before enabling them.",
  );
}
export async function checkNextBatch() {
  const staff = await requireAdministrator();
  const sources = await createTrustedClient()
    .from("directory_sources")
    .select("id")
    .is("removed_at", null)
    .is("checked_at", null)
    .order("id")
    .limit(3);
  if (sources.error) finish("The next source batch could not be loaded.", true);
  const results = await Promise.allSettled(
    sources.data.map((source) => checkSource(source.id, staff.userId)),
  );
  if (results.some((r) => r.status === "rejected"))
    finish("Some checks could not be saved. Previous jobs are preserved.", true);
  finish(
    sources.data.length
      ? `${sources.data.length} sources checked. Review their previews below.`
      : "Every current source has been checked.",
  );
}
