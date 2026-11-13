"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { verifyPublicImage } from "@/lib/directory-http";
import { invalidatePublicData } from "@/lib/public-data-cache";

export async function updateLogo(form: FormData) {
  await requireStaff();
  const name = String(form.get("name") ?? "");
  const value = String(form.get("logo_url") ?? "").trim();
  const db = createTrustedClient();
  if (value.startsWith("data:image/")) {
    const existing = await db.from("directory_organisations").select("logo_url").eq("name", name).single();
    if (existing.error || existing.data.logo_url !== value) throw new Error("Use an HTTPS image URL.");
  } else if (value) {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("Use an HTTPS image URL.");
  }
  if (value && !(await verifyPublicImage(value)))
    throw new Error(
      "Choose a readable logo at least 64 pixels wide or high, with visible detail on white. Blank, transparent-only and all-white logos cannot be saved.",
    );
  const { error } = await db
    .from("directory_organisations")
    .update({ logo_url: value || null })
    .eq("name", name);
  if (error) throw new Error("Could not update logo.");
  invalidatePublicData();
  revalidatePath("/admin/organisations");
  revalidatePath("/");
}
