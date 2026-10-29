"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createJobDraft } from "@/lib/admin/create-job-draft";
import { validateJobIntake } from "@/lib/admin/job-intake-validation";
import { requireAdministrator } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type JobIntakeActionState = { error: string | null };

export async function createManualJob(
  _previousState: JobIntakeActionState,
  formData: FormData,
): Promise<JobIntakeActionState> {
  await requireAdministrator();
  const result = validateJobIntake(formData);
  if (!result.data) return { error: result.error };

  const input = result.data;
  const supabase = await createClient();
  const { data: jobId, error } = await createJobDraft(supabase, input);

  if (error || !jobId) {
    if (error?.code === "23505") {
      return { error: "That vacancy is already registered or has the same identity as an existing record." };
    }
    if (error?.code === "23503") return { error: "Choose an active approved vacancy source." };
    return {
      error: "The vacancy could not be saved. Nothing was added; please review the details and try again.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  redirect(`/admin/jobs/${jobId}?status=created`);
}
