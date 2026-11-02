"use client";

import { toggleBrowserSavedJob, useBrowserSavedJobs } from "@/lib/browser-saved-jobs";

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
}: {
  className?: string;
  iconOnly?: boolean;
  jobId?: number;
  jobSlug: string;
  returnTo?: string;
  state: JobSaveState;
}) {
  const { ids, persistent } = useBrowserSavedJobs();
  if (!jobId) return null;
  const saved = ids.includes(jobId);

  return (
    <button
      aria-label={iconOnly ? (saved ? "Remove saved job" : "Save job") : undefined}
      aria-pressed={saved}
      className={`${className}${saved ? " save-action--saved" : ""}`}
      onClick={() => toggleBrowserSavedJob(jobId)}
      title={
        persistent
          ? "Saved on this browser only"
          : "Browser storage is unavailable; saved for this visit only"
      }
      type="button"
    >
      {iconOnly ? <HeartIcon filled={saved} /> : saved ? "♥ Saved · remove" : "♡ Save job"}
    </button>
  );
}
