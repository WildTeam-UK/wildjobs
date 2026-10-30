"use client";

import Link from "next/link";

import { updateSavedJob } from "@/app/account/saved/actions";
import { SubmitButton } from "@/components/submit-button";

export type JobSaveState = "available" | "saved" | "signed-out";

export function SaveJobControl({
  className = "save-action",
  iconOnly = false,
  jobId,
  jobSlug,
  returnTo = `/jobs/${jobSlug}`,
  state,
}: {
  className?: string;
  iconOnly?: boolean;
  jobId?: number;
  jobSlug: string;
  returnTo?: string;
  state: JobSaveState;
}) {
  if (state === "signed-out" || !jobId) {
    return (
      <Link
        aria-label={iconOnly ? "Save job" : undefined}
        className={className}
        href={{
          pathname: "/sign-in",
          query: { intent: "save", job: jobSlug, next: `/jobs/${jobSlug}` },
        }}
      >
        <span aria-hidden="true">♡</span>
        {iconOnly ? null : " Save job"}
      </Link>
    );
  }

  const operation = state === "saved" ? "remove" : "save";
  const action = updateSavedJob.bind(null, jobId, operation, returnTo);

  return (
    <form action={action}>
      <SubmitButton
        className={className}
        idleAriaLabel={iconOnly ? (state === "saved" ? "Remove saved job" : "Save job") : undefined}
        idleLabel={
          iconOnly ? (state === "saved" ? "♥" : "♡") : state === "saved" ? "♥ Saved · remove" : "♡ Save job"
        }
        pendingAriaLabel={iconOnly ? (state === "saved" ? "Removing saved job" : "Saving job") : undefined}
        pendingLabel={iconOnly ? "…" : state === "saved" ? "Removing…" : "Saving…"}
      />
    </form>
  );
}
