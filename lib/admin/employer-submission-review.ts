import { toSlug } from "./job-intake-validation";

const reviewNoteMinimum = 10;
const reviewNoteMaximum = 2000;

export type EmployerSubmissionReviewNote =
  | { data: { reviewNote: string }; error?: never }
  | { data?: never; error: string };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function validateEmployerSubmissionReviewNote(formData: FormData): EmployerSubmissionReviewNote {
  const reviewNote = textValue(formData, "reviewNote");

  if (reviewNote.length < reviewNoteMinimum || reviewNote.length > reviewNoteMaximum) {
    return { error: "Add a clear review note between 10 and 2,000 characters." };
  }

  return { data: { reviewNote } };
}

export function buildEmployerSubmissionDraftSlugs({
  closingDate,
  organisationName,
  roleTitle,
  submissionId,
}: {
  closingDate: string;
  organisationName: string;
  roleTitle: string;
  submissionId: number;
}) {
  return {
    employerSlug: toSlug(organisationName),
    jobSlug: toSlug(`${roleTitle}-${organisationName}-${closingDate}-${submissionId}`),
  };
}
