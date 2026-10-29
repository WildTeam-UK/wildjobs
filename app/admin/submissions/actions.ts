"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  buildEmployerSubmissionDraftSlugs,
  validateEmployerSubmissionReviewNote,
} from "@/lib/admin/employer-submission-review";
import { requireAdministrator, requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type SubmissionReviewActionState = { error: string | null };

type ReviewDecision = "changes_requested" | "rejected";

function validSubmissionId(submissionId: number) {
  return Number.isSafeInteger(submissionId) && submissionId > 0;
}

async function recordSubmissionDecision(
  submissionId: number,
  decision: ReviewDecision,
  formData: FormData,
): Promise<SubmissionReviewActionState> {
  await requireStaff();
  if (!validSubmissionId(submissionId)) return { error: "The employer submission is invalid." };

  const result = validateEmployerSubmissionReviewNote(formData);
  if (!result.data) return { error: result.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_employer_submission", {
    p_decision: decision,
    p_review_note: result.data.reviewNote,
    p_submission_id: submissionId,
  });

  if (error) {
    if (error.code === "23514") {
      return { error: "That decision is no longer available for this submission. Refresh and try again." };
    }
    return { error: "The review decision could not be saved. Nothing was changed; please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${submissionId}`);
  redirect(`/admin/submissions/${submissionId}?status=${decision.replaceAll("_", "-")}`);
}

export async function requestSubmissionChanges(
  submissionId: number,
  _previousState: SubmissionReviewActionState,
  formData: FormData,
) {
  return recordSubmissionDecision(submissionId, "changes_requested", formData);
}

export async function rejectSubmission(
  submissionId: number,
  _previousState: SubmissionReviewActionState,
  formData: FormData,
) {
  return recordSubmissionDecision(submissionId, "rejected", formData);
}

export async function createSubmissionJobReview(
  submissionId: number,
  _previousState: SubmissionReviewActionState,
  _formData: FormData,
): Promise<SubmissionReviewActionState> {
  await requireAdministrator();
  if (!validSubmissionId(submissionId)) return { error: "The employer submission is invalid." };

  const supabase = await createClient();
  const { data: submission, error: submissionError } = await supabase
    .from("employer_submissions")
    .select("id, organisation_name, role_title, closing_date")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) return { error: "The employer submission could not be found." };

  const { employerSlug, jobSlug } = buildEmployerSubmissionDraftSlugs({
    closingDate: submission.closing_date,
    organisationName: submission.organisation_name,
    roleTitle: submission.role_title,
    submissionId: submission.id,
  });

  if (!employerSlug || !jobSlug) {
    return { error: "The employer and role title need letters or numbers before a draft can be created." };
  }

  const { data: jobId, error } = await supabase.rpc("create_job_review_from_submission", {
    p_employer_slug: employerSlug,
    p_job_slug: jobSlug,
    p_submission_id: submissionId,
  });

  if (error || !jobId) {
    if (error?.code === "23505") {
      return { error: "A matching employer or vacancy draft already exists. Check the review queues first." };
    }
    if (error?.code === "23514") {
      return { error: "This submission is already resolved or its closing date has passed." };
    }
    if (error?.code === "23503") {
      return { error: "The matched employer or employer-submission source is unavailable." };
    }
    return { error: "The private job-review draft could not be created. Nothing was published." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/employers");
  revalidatePath("/admin/jobs");
  revalidatePath("/admin/sources");
  revalidatePath("/admin/submissions");
  revalidatePath(`/admin/submissions/${submissionId}`);
  redirect(`/admin/jobs/${jobId}?status=created`);
}
