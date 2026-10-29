import "server-only";

import { cache } from "react";

import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

function submissionReadError(context: string, error: { code?: string; message: string }) {
  console.error(`Unable to ${context} employer submissions`, {
    code: error.code,
    message: error.message,
  });

  return new Error("Employer submissions could not be loaded.");
}

export const getEmployerSubmissionQueue = cache(async () => {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employer_submissions")
    .select("id, status, role_title, organisation_name, completeness_score, received_at")
    .order("received_at", { ascending: false })
    .limit(100);

  if (error) throw submissionReadError("load", error);
  return data;
});

export const getEmployerSubmission = cache(async (id: number) => {
  await requireStaff();
  const supabase = await createClient();
  const [submissionResult, eventsResult] = await Promise.all([
    supabase
      .from("employer_submissions")
      .select(
        `
          id,
          status,
          contact_name,
          contact_email,
          organisation_name,
          role_title,
          salary_text,
          closing_date,
          location_text,
          workplace_type,
          role_summary,
          application_url,
          authority_confirmed_at,
          completeness_score,
          received_at,
          resolved_at,
          matched_employer:employers!employer_submissions_matched_employer_id_fkey(id, name),
          resulting_job:jobs!employer_submissions_resulting_job_id_fkey(id, title, status, slug)
        `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("moderation_events")
      .select("id, action, previous_status, next_status, review_note, created_at")
      .eq("employer_submission_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const error = submissionResult.error ?? eventsResult.error;
  if (error) throw submissionReadError("load", error);

  return {
    events: eventsResult.data ?? [],
    submission: submissionResult.data,
  };
});
