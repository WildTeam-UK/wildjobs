"use client";

import Link from "next/link";

import { updateSavedJob } from "@/app/account/saved/actions";
import { SubmitButton } from "@/components/submit-button";

export type JobSaveState = "available" | "saved" | "signed-out";

export function SaveJobControl({
  className = "save-action",
  jobId,
  jobSlug,
  returnTo = `/jobs/${jobSlug}`,
  state,
}: {
  className?: string;
  jobId?: number;
  jobSlug: string;
  returnTo?: string;
  state: JobSaveState;
}) {
  if (state === "signed-out" || !jobId) {
    return (
      <Link
        className={className}
        href={{ pathname: "/sign-in", query: { intent: "save", next: `/jobs/${jobSlug}` } }}
      >
        <span aria-hidden="true">♡</span> Save job
      </Link>
    );
  }

  const operation = state === "saved" ? "remove" : "save";
  const action = updateSavedJob.bind(null, jobId, operation, returnTo);

  return (
    <form action={action}>
      <SubmitButton
        className={className}
        idleLabel={state === "saved" ? "♥ Saved · remove" : "♡ Save job"}
        pendingLabel={state === "saved" ? "Removing…" : "Saving…"}
      />
    </form>
  );
}
