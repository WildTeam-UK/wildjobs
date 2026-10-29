"use server";

import { revalidatePath } from "next/cache";

import { createSubmissionInviteToken } from "@/lib/admin/submission-invite-token";
import { validateSubmissionInvite } from "@/lib/admin/submission-invite-validation";
import { requireStaff } from "@/lib/auth/staff";
import { getRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export type SubmissionInviteActionState = Readonly<{
  error: string | null;
  invitation: Readonly<{
    expiresAt: string;
    inviteeEmail: string;
    url: string;
  }> | null;
}>;

export async function createSubmissionInvite(
  _previousState: SubmissionInviteActionState,
  formData: FormData,
): Promise<SubmissionInviteActionState> {
  const staff = await requireStaff();
  const result = validateSubmissionInvite(formData);
  if (!result.data) return { error: result.error, invitation: null };

  const { employerId, inviteeEmail } = result.data;
  const { token, tokenHash } = createSubmissionInviteToken();
  const expiresAt = new Date(Date.now() + invitationLifetimeMs).toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("submission_invites").insert({
    created_by_staff_user_id: staff.userId,
    employer_id: employerId,
    expires_at: expiresAt,
    invitee_email: inviteeEmail,
    token_hash: tokenHash,
  });

  if (error) {
    if (error.code === "23503") {
      return {
        error: "That employer record is no longer available. Choose another or leave it unmatched.",
        invitation: null,
      };
    }
    return {
      error: "The invitation could not be created. Nothing was saved; please try again.",
      invitation: null,
    };
  }

  const origin = await getRequestOrigin();
  const invitationUrl = new URL("/for-employers/submit", origin);
  invitationUrl.searchParams.set("token", token);

  revalidatePath("/admin/submissions/invitations");
  return {
    error: null,
    invitation: {
      expiresAt,
      inviteeEmail,
      url: invitationUrl.toString(),
    },
  };
}
