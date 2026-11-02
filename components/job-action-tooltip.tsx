"use client";

import { cloneElement, type ReactElement, useId, useState } from "react";

export function JobActionTooltip({
  children,
  label,
  feedback,
}: {
  children: ReactElement<{ "aria-describedby"?: string }>;
  label: string;
  feedback?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [suppressed, setSuppressed] = useState(false);
  return (
    <span
      className="job-action-tooltip"
      onMouseEnter={() => {
        setOpen(true);
        setSuppressed(false);
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        setOpen(true);
        setSuppressed(false);
      }}
      onBlur={() => setOpen(false)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setSuppressed(true);
          event.stopPropagation();
        }
      }}
    >
      {cloneElement(children, {
        "aria-describedby": [children.props["aria-describedby"], id].filter(Boolean).join(" "),
      })}
      <span
        className="job-action-tooltip__bubble"
        id={id}
        role={feedback ? "status" : "tooltip"}
        hidden={suppressed || (!open && !feedback)}
      >
        {feedback || label}
      </span>
    </span>
  );
}
