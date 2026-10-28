"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  const { data: jobId, error } = await supabase.rpc("create_manual_job_draft", {
    p_application_url: input.applicationUrl,
    p_canonical_url: input.canonicalUrl,
    p_closes_at: input.closesAt,
    p_contract_type: input.contractType,
    p_country_code: input.countryCode,
    p_description: input.description,
    p_employer_name: input.employerName,
    p_employer_slug: input.employerSlug,
    p_employer_website_url: input.employerWebsiteUrl,
    p_experience_level: input.experienceLevel,
    p_hours_type: input.hoursType,
    p_job_slug: input.jobSlug,
    p_location_text: input.locationText,
    p_posted_at: input.postedAt,
    p_requirements: input.requirements,
    p_responsibilities: input.responsibilities,
    p_salary_text: input.salaryText,
    p_source_id: input.sourceId,
    p_summary: input.summary,
    p_title: input.title,
    p_workplace_type: input.workplaceType,
  });

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
