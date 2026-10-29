export type SubmissionInviteInput = Readonly<{
  employerId: number | null;
  inviteeEmail: string;
}>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSubmissionInvite(
  formData: FormData,
): { data: SubmissionInviteInput; error?: never } | { data?: never; error: string } {
  const rawEmail = formData.get("inviteeEmail");
  const rawEmployerId = formData.get("employerId");

  if (typeof rawEmail !== "string") return { error: "Enter the employer’s work email address." };

  const inviteeEmail = rawEmail.trim().toLocaleLowerCase("en-GB");
  if (!inviteeEmail || inviteeEmail.length > 254 || !emailPattern.test(inviteeEmail)) {
    return { error: "Enter a valid work email address." };
  }

  let employerId: number | null = null;
  if (typeof rawEmployerId === "string" && rawEmployerId) {
    if (!/^\d+$/.test(rawEmployerId)) return { error: "Choose a valid employer record." };
    employerId = Number(rawEmployerId);
    if (!Number.isSafeInteger(employerId) || employerId < 1) {
      return { error: "Choose a valid employer record." };
    }
  }

  return { data: { employerId, inviteeEmail } };
}
