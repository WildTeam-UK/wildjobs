"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdministrator } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { publicUrl } from "@/lib/directory-url";
import { fetchPublicText } from "@/lib/directory-http";
import { parseSourceFeed } from "@/lib/directory-sources";
import { syncDirectory } from "@/lib/directory-sync";

function refreshPages() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/sources");
  revalidatePath("/admin/jobs");
}
export async function addSource(form: FormData) {
  await requireAdministrator();
  let error: string | undefined;
  try {
    const url = publicUrl(String(form.get("feed_url") ?? "")).toString();
    const response = await fetchPublicText(url, 15000);
    const parsed = parseSourceFeed(response.text, response.url);
    const name = String(form.get("name") ?? "").trim() || parsed.name;
    const saved = await createTrustedClient().rpc("manage_directory_source", {
      p_action: "add",
      p_url: url,
      p_name: name,
    });
    if (saved.error) throw new Error(saved.error.message);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Feed could not be added.";
  }
  if (error) redirect("/admin/sources?error=" + encodeURIComponent(error.slice(0, 200)));
  refreshPages();
  redirect("/admin/sources?added=1");
}
export async function changeSource(form: FormData) {
  await requireAdministrator();
  const id = Number(form.get("id")),
    action = String(form.get("action") ?? "");
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !["pause", "resume", "refresh", "remove", "rename"].includes(action)
  )
    redirect("/admin/sources?error=Choose+a+valid+source+action.");
  const result = await createTrustedClient().rpc("manage_directory_source", {
    p_action: action,
    p_id: id,
    p_name: String(form.get("name") ?? "").trim(),
  });
  if (result.error) redirect("/admin/sources?error=The+source+could+not+be+updated.");
  if (action === "refresh") {
    try {
      await syncDirectory(true, id);
    } catch {
      refreshPages();
      redirect("/admin/sources?error=The+refresh+could+not+finish.+See+the+source+status+below.");
    }
  }
  refreshPages();
  redirect("/admin/sources?updated=1");
}
