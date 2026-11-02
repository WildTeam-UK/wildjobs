"use client";

export function DismissJobControl({
  dismissed = false,
  onClick,
  title,
}: {
  dismissed?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      aria-label={`${dismissed ? "Restore" : "Dismiss"} ${title}`}
      className="dismiss-job-action"
      onClick={onClick}
      title={dismissed ? "Restore this job" : "Not for me · dismiss on this browser"}
      type="button"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        {dismissed ? (
          <path d="M4 10a8 8 0 1 1 0 6M4 4v6h6" />
        ) : (
          <>
            <path d="M17 4H7a2 2 0 0 0-2 1.6l-2 8A2 2 0 0 0 5 16h5l-1 4a2 2 0 0 0 3.5 1.3L17 15Z" />
            <path d="M17 4h4v11h-4" />
          </>
        )}
      </svg>
    </button>
  );
}
