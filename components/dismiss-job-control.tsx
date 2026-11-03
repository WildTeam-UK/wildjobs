"use client";

import { JobActionTooltip } from "@/components/job-action-tooltip";

export function DismissJobControl({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <JobActionTooltip label="Dismiss this job">
      <button aria-label={`Dismiss ${title}`} className="dismiss-job-action" onClick={onClick} type="button">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M17 4H7a2 2 0 0 0-2 1.6l-2 8A2 2 0 0 0 5 16h5l-1 4a2 2 0 0 0 3.5 1.3L17 15Z" />
          <path d="M17 4h4v11h-4" />
        </svg>
      </button>
    </JobActionTooltip>
  );
}
