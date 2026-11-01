"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { syncDirectory } from "@/lib/directory-sync";
export async function setAutomation(form: FormData) {
  await requireStaff();
  const { error } = await createTrustedClient()
    .from("directory_settings")
    .update({ enabled: form.get("enabled") === "true", next_feed_at: new Date().toISOString() })
    .eq("id", true);
  if (error) throw new Error("Could not update automation.");
  revalidatePath("/admin");
}
export async function runFeed() {
  await requireStaff();
  try {
    await syncDirectory(true);
  } catch {
    redirect("/admin?run=error");
  }
  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin?run=complete");
}
export async function updateCourse(form: FormData) {
  await requireStaff();
  const slug = String(form.get("slug") ?? "");
  const { error } = await createTrustedClient()
    .from("courses")
    .update({
      matching_notes: String(form.get("matching_notes") ?? "").slice(0, 3000),
      is_filter_visible: form.get("enabled") === "on",
    })
    .eq("slug", slug);
  if (error) throw new Error("Could not update course.");
  revalidatePath("/admin/courses");
  revalidatePath("/");
}
export async function updateLogo(form: FormData) {
  await requireStaff();
  const name = String(form.get("name") ?? "");
  const value = String(form.get("logo_url") ?? "").trim();
  if (value) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Use an HTTPS image URL.");
  }
  const { error } = await createTrustedClient()
    .from("directory_organisations")
    .update({ logo_url: value || null })
    .eq("name", name);
  if (error) throw new Error("Could not update logo.");
  revalidatePath("/admin/organisations");
  revalidatePath("/");
}
