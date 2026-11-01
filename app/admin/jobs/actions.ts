"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type JobLifecycleAction, validateJobLifecycleReviewNote } from "@/lib/admin/job-lifecycle";
import { validateJobReview } from "@/lib/admin/job-review-validation";
import { requireAdministrator, requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type JobReviewActionState = { error: string | null };
export type JobLifecycleActionState = { error: string | null };

function validJobId(jobId: number) {
  return Number.isSafeInteger(jobId) && jobId > 0;
}

export async function updateJobReview(
  jobId: number,
  _previousState: JobReviewActionState,
  formData: FormData,
): Promise<JobReviewActionState> {
  await requireStaff();
  if (!validJobId(jobId)) return { error: "The vacancy record is invalid." };

  const result = validateJobReview(formData);
  if (!result.data) return { error: result.error };

  const supabase = await createClient();
  const { data: currentJob, error: currentJobError } = await supabase
    .from("jobs")
    .select("slug")
    .eq("id", jobId)
    .maybeSingle();

  if (currentJobError || !currentJob) return { error: "The vacancy could not be found." };

  const input = result.data;
  const { error } = await supabase.rpc("save_pipeline_review", {
    p_job_id: jobId,
    p_patch: {
      title: input.title,
      summary: input.summary,
      description: input.description,
      responsibilities: input.responsibilities,
      requirements: input.requirements,
      application_url: input.applicationUrl,
      source_url: input.canonicalUrl,
      closes_at: input.closesAt,
      country_code: input.countryCode,
      engagement_type: input.engagementType,
      workplace_type: input.workplaceType,
      contract_type: input.contractType,
      hours_type: input.hoursType,
      experience_level: input.experienceLevel,
      salary_text: input.salaryText,
      location_text: input.locationText,
      locality: input.locationLocality,
      region: input.locationRegion,
      postal_code: input.postalCode,
      posted_at: input.postedAt,
    },
  });

  if (error) {
    if (error.code === "23505") return { error: "Another vacancy already uses this identity." };
    if (error.code === "23514") return { error: "Review the required fields before saving." };
    return { error: "The review could not be saved. Nothing was changed; please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/jobs/${jobId}?status=updated`);
}

export async function publishJobReview(jobId: number) {
  await requireAdministrator();
  if (!validJobId(jobId)) redirect("/admin/jobs?error=invalid-record");

  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_reviewed_brief", { p_job_id: jobId });

  if (error) {
    redirect(`/admin/jobs/${jobId}?error=publication-check`);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/jobs/${jobId}?status=published`);
}

async function changePublishedJobLifecycle(
  jobId: number,
  action: JobLifecycleAction,
  formData: FormData,
): Promise<JobLifecycleActionState> {
  await requireAdministrator();
  if (!validJobId(jobId)) return { error: "The vacancy record is invalid." };

  const result = validateJobLifecycleReviewNote(formData);
  if (!result.data) return { error: result.error };

  const supabase = await createClient();
  const { data: jobSlug, error } = await supabase.rpc("change_job_lifecycle", {
    p_action: action,
    p_job_id: jobId,
    p_review_note: result.data.reviewNote,
  });

  if (error || !jobSlug) {
    if (error?.code === "23514") {
      return {
        error:
          action === "expired"
            ? "This vacancy can be marked expired only after its closing date."
            : "Only a published vacancy can be withdrawn.",
      };
    }
    return { error: "The vacancy status could not be changed. Nothing was removed from public view." };
  }

  revalidatePath("/");
  revalidatePath(`/jobs/${jobSlug}`);
  revalidatePath("/account");
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/jobs/${jobId}?status=${action}`);
}

export async function expirePublishedJob(
  jobId: number,
  _previousState: JobLifecycleActionState,
  formData: FormData,
) {
  return changePublishedJobLifecycle(jobId, "expired", formData);
}

export async function withdrawPublishedJob(
  jobId: number,
  _previousState: JobLifecycleActionState,
  formData: FormData,
) {
  return changePublishedJobLifecycle(jobId, "withdrawn", formData);
}
