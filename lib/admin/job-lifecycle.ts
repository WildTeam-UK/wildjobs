export type JobLifecycleAction = "expired" | "withdrawn";

export type JobLifecycleReviewNote =
  | { data: { reviewNote: string }; error?: never }
  | { data?: never; error: string };

export function validateJobLifecycleReviewNote(formData: FormData): JobLifecycleReviewNote {
  const value = formData.get("reviewNote");
  const reviewNote = typeof value === "string" ? value.trim() : "";

  if (reviewNote.length < 10 || reviewNote.length > 2000) {
    return { error: "Add a clear review note between 10 and 2,000 characters." };
  }

  return { data: { reviewNote } };
}
