import "server-only";

import type { EmployerSubmissionInput } from "@/lib/employer-submissions/validation";
import { createTrustedClient } from "@/lib/supabase/trusted";

import { hashSubmissionInviteToken, submissionInviteTokenPattern } from "./token";

export type ActiveSubmissionInvite = Readonly<{
  inviteeEmail: string;
  organisationName: string;
}>;

export async function getActiveSubmissionInvite(token: string): Promise<ActiveSubmissionInvite | null> {
  if (!submissionInviteTokenPattern.test(token)) return null;

  let supabase: ReturnType<typeof createTrustedClient>;
  try {
    supabase = createTrustedClient();
  } catch {
    console.error("Unable to validate employer submission invitation: trusted client unavailable.");
    return null;
  }
  const { data, error } = await supabase
    .from("submission_invites")
    .select("invitee_email, employers(name)")
    .eq("token_hash", hashSubmissionInviteToken(token))
    .is("used_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error("Unable to validate employer submission invitation.", { code: error.code });
    return null;
  }
  if (!data) return null;

  return {
    inviteeEmail: data.invitee_email,
    organisationName: data.employers?.name ?? "",
  };
}

export async function redeemSubmissionInvite(input: EmployerSubmissionInput) {
  let supabase: ReturnType<typeof createTrustedClient>;
  try {
    supabase = createTrustedClient();
  } catch {
    console.error("Unable to create employer submission: trusted client unavailable.");
    return { status: "failed" as const };
  }
  const { data, error } = await supabase.rpc("redeem_employer_submission_invite", {
    p_application_url: input.applicationUrl,
    p_closing_date: input.closingDate,
    p_contact_email: input.contactEmail,
    p_contact_name: input.contactName,
    p_location_text: input.locationText,
    p_organisation_name: input.organisationName,
    p_role_summary: input.roleSummary,
    p_role_title: input.roleTitle,
    p_salary_text: input.salaryText,
    p_token_hash: hashSubmissionInviteToken(input.token),
    p_workplace_type: input.workplaceType,
  });

  if (error) {
    console.error("Unable to create employer submission.", { code: error.code });
    return { status: "failed" as const };
  }
  return data ? { status: "created" as const } : { status: "unavailable" as const };
}
