"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { invalidatePublicData } from "@/lib/public-data-cache";

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
  invalidatePublicData();
  revalidatePath("/admin/courses");
  revalidatePath("/");
}
