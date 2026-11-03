"use client";

import { cloneElement, type ReactElement, useEffect, useId, useRef, useState } from "react";

// One shared pair of listeners distinguishes real keyboard focus from focus
// restored after a mouse click or a native share/clipboard prompt.
let tooltipUsers = 0;
let keyboardInput = true;
function pointerInput() {
  keyboardInput = false;
}
function keyInput(event: KeyboardEvent) {
  if (!event.altKey && !event.ctrlKey && !event.metaKey) keyboardInput = true;
}
function trackInput() {
  if (tooltipUsers++ === 0) {
    document.addEventListener("pointerdown", pointerInput, true);
    document.addEventListener("keydown", keyInput, true);
  }
  return () => {
    if (--tooltipUsers === 0) {
      document.removeEventListener("pointerdown", pointerInput, true);
      document.removeEventListener("keydown", keyInput, true);
    }
  };
}

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
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hovered = useRef(false);
  const keyboardFocus = useRef(false);

  function clearHoverTimer() {
    clearTimeout(hoverTimer.current);
  }
  function dismiss() {
    clearHoverTimer();
    setOpen(false);
    setSuppressed(true);
  }
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  useEffect(trackInput, []);
  // Sharing feedback is a short-lived status message, independent of hover state.
  useEffect(() => {
    if (feedback) setSuppressed(false);
  }, [feedback]);

  return (
    <span
      className="job-action-tooltip"
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        hovered.current = true;
        setSuppressed(false);
        clearHoverTimer();
        hoverTimer.current = setTimeout(() => setOpen(true), 1000);
      }}
      onPointerLeave={() => {
        hovered.current = false;
        clearHoverTimer();
        if (!keyboardFocus.current) setOpen(false);
      }}
      onPointerDownCapture={() => {
        keyboardFocus.current = false;
        dismiss();
      }}
      onClickCapture={dismiss}
      onFocus={(event) => {
        // Mouse/touch focus must not reopen a tooltip after the pointer has left.
        keyboardFocus.current = keyboardInput && event.target.matches(":focus-visible");
        if (keyboardFocus.current) {
          setOpen(true);
          setSuppressed(false);
        }
      }}
      onBlur={() => {
        keyboardFocus.current = false;
        if (!hovered.current) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          dismiss();
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
