"use client";

import { useEffect, useRef, useState } from "react";
import { JobActionTooltip } from "@/components/job-action-tooltip";
import { shareJob } from "@/lib/job-sharing";

export function ShareJobControl({ title, url }: { title: string; url: string }) {
  const [feedback, setFeedback] = useState("");
  const [showLink, setShowLink] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sharing = useRef(false);
  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(""), 2500);
    return () => clearTimeout(timeout);
  }, [feedback]);
  useEffect(() => {
    if (showLink) {
      linkRef.current?.focus();
      linkRef.current?.select();
    }
  }, [showLink]);

  return (
    <span
      className="job-share-control"
      onKeyDown={(event) => {
        if (showLink && event.key === "Escape") {
          setShowLink(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <JobActionTooltip label="Share this job!" feedback={feedback}>
        <button
          ref={triggerRef}
          aria-label="Share this job!"
          className="share-job-action"
          type="button"
          onClick={async () => {
            if (sharing.current) return;
            sharing.current = true;
            try {
              const result = await shareJob(title, url);
              if (result === "copied") setFeedback("Link copied!");
              if (result === "shared") setFeedback("Shared!");
              if (result === "unavailable") setShowLink(true);
            } finally {
              sharing.current = false;
            }
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="m22 2-7 20-4-9-9-4L22 2Zm0 0L11 13" />
          </svg>
        </button>
      </JobActionTooltip>
      {showLink ? (
        <span className="job-share-link" role="group" aria-label="Copy this job link">
          <label>
            Copy this job link
            <input
              aria-label="Job link"
              ref={linkRef}
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setShowLink(false);
              triggerRef.current?.focus();
            }}
          >
            Close
          </button>
        </span>
      ) : null}
    </span>
  );
}
