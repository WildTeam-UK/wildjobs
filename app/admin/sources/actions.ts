"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { validateSource, validateSourceStatus } from "@/lib/admin/source-validation";
import { requireAdministrator } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

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
