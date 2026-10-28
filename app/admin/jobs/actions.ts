"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { validateJobReview } from "@/lib/admin/job-review-validation";
import { requireAdministrator, requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type JobReviewActionState = { error: string | null };

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
  const { error } = await supabase.rpc("update_job_review_draft", {
    p_application_url: input.applicationUrl,
    p_canonical_url: input.canonicalUrl,
    p_closes_at: input.closesAt,
    p_contract_type: input.contractType,
    p_country_code: input.countryCode,
    p_description: input.description,
    p_employer_mission: input.employerMission,
    p_employer_overview: input.employerOverview,
    p_employer_website_url: input.employerWebsiteUrl,
    p_experience_level: input.experienceLevel,
    p_hours_type: input.hoursType,
    p_job_id: jobId,
    p_job_slug: currentJob.slug,
    p_location_text: input.locationText,
    p_posted_at: input.postedAt,
    p_requirements: input.requirements,
    p_responsibilities: input.responsibilities,
    p_salary_text: input.salaryText,
    p_summary: input.summary,
    p_title: input.title,
    p_workplace_type: input.workplaceType,
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
  const { error } = await supabase.rpc("publish_job_review_draft", { p_job_id: jobId });

  if (error) {
    redirect(`/admin/jobs/${jobId}?error=publication-check`);
  }

  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath("/admin");
  revalidatePath("/admin/jobs");
  revalidatePath(`/admin/jobs/${jobId}`);
  redirect(`/admin/jobs/${jobId}?status=published`);
}
