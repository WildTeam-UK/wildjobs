"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCandidate } from "@/lib/auth/candidate";
import { ensureCandidateProfile } from "@/lib/auth/candidate-profile";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { addSaveStatus } from "@/lib/auth/save-intent";

type SaveOperation = "remove" | "save";

export async function updateSavedJob(
  jobId: number,
  operation: SaveOperation,
  returnTo: string,
  _formData: FormData,
) {
  const next = getSafeNextPath(returnTo, "/");
  if (!Number.isSafeInteger(jobId) || jobId < 1 || !["remove", "save"].includes(operation)) {
    redirect(addSaveStatus(next, "error"));
  }

  const { supabase, userId } = await requireCandidate(next);
  const profileError = await ensureCandidateProfile(supabase, userId);
  if (profileError) redirect(addSaveStatus(next, "error"));

  const { error } =
    operation === "save"
      ? await supabase.from("saved_jobs").insert({ job_id: jobId, user_id: userId })
      : await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);

  if (error && !(operation === "save" && error.code === "23505")) {
    redirect(addSaveStatus(next, "error"));
  }

  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/account/saved");
  redirect(addSaveStatus(next, operation === "save" ? "saved" : "removed"));
}
