"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";
import {
  collectPilotAdverts,
  publishPilotDraft,
  refreshPilotDrafts,
  setRoleAlias,
} from "@/lib/guide-workflow";
import { guideCatalog, guidePath } from "@/lib/guide-content";
import { createTrustedClient } from "@/lib/supabase/trusted";

function revalidateGuides() {
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/guides");
  revalidatePath("/admin/guides/[slug]", "page");
  for (const guide of guideCatalog) revalidatePath(guidePath(guide));
}
export async function refreshGuide(form: FormData) {
  await requireStaff();
  const slug = String(form.get("slug") ?? "");
  if (!guideCatalog.some((g) => g.slug === slug)) throw new Error("Choose a guide from the catalogue.");
  await refreshPilotDrafts(slug);
  revalidateGuides();
  redirect(`/admin/guides/${slug}`);
}
export async function collectGuideEvidence() {
  await requireStaff();
  await collectPilotAdverts();
  revalidateGuides();
  redirect("/admin/guides?collected=1");
}
export async function reviewRole(form: FormData) {
  await requireStaff();
  const id = Number(form.get("job_id")),
    decision = String(form.get("decision"));
  if (!Number.isSafeInteger(id) || id <= 0 || !["include", "exclude"].includes(decision))
    throw new Error("Choose a valid role decision.");
  const job = await createTrustedClient()
    .from("directory_jobs")
    .select("title")
    .eq("id", id)
    .is("merged_into", null)
    .single();
  if (job.error) throw new Error("This advert could not be found.");
  await setRoleAlias(job.data.title, decision === "include");
  revalidateGuides();
  redirect("/admin/guides?mapping=updated");
}
export async function approveGuide(form: FormData) {
  await requireStaff();
  const id = Number(form.get("id")),
    inputHash = String(form.get("input_hash") ?? "");
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    !/^[a-f\d]{64}$/.test(inputHash) ||
    form.get("reviewed") !== "on"
  )
    throw new Error("Confirm that you reviewed the draft and its evidence.");
  let error: string | undefined;
  try {
    await publishPilotDraft(id, inputHash);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "The guide could not be approved.";
  }
  revalidateGuides();
  redirect(error ? `/admin/guides?error=${encodeURIComponent(error)}` : "/admin/guides?published=1");
}
