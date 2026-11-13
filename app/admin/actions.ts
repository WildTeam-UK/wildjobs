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
