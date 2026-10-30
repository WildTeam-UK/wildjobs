"use client";

import Link from "next/link";

import { updateSavedJob } from "@/app/account/saved/actions";
import { SubmitButton } from "@/components/submit-button";

export type JobSaveState = "available" | "saved" | "signed-out";

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="save-action__heart"
      fill={filled ? "currentColor" : "none"}
      viewBox="0 0 24 24"
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

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
        {iconOnly ? <HeartIcon /> : <span aria-hidden="true">♡</span>}
        {iconOnly ? null : " Save job"}
      </Link>
    );
  }

  const operation = state === "saved" ? "remove" : "save";
  const action = updateSavedJob.bind(null, jobId, operation, returnTo);

  return (
    <form action={action}>
      <SubmitButton
        className={`${className}${iconOnly && state === "saved" ? " save-action--saved" : ""}`}
        idleAriaLabel={iconOnly ? (state === "saved" ? "Remove saved job" : "Save job") : undefined}
        idleLabel={
          iconOnly ? (
            <HeartIcon filled={state === "saved"} />
          ) : state === "saved" ? (
            "♥ Saved · remove"
          ) : (
            "♡ Save job"
          )
        }
        pendingAriaLabel={iconOnly ? (state === "saved" ? "Removing saved job" : "Saving job") : undefined}
        pendingLabel={iconOnly ? "…" : state === "saved" ? "Removing…" : "Saving…"}
      />
    </form>
  );
}
