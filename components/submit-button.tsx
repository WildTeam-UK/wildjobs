"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  idleAriaLabel,
  className = "action",
  idleLabel,
  pendingAriaLabel,
  pendingLabel,
}: {
  className?: string;
  idleAriaLabel?: string;
  idleLabel: ReactNode;
  pendingAriaLabel?: string;
  pendingLabel: ReactNode;
}) {
  const { pending } = useFormStatus();
  const currentLabel = pending ? pendingLabel : idleLabel;
  const accessibleLabel = pending
    ? (pendingAriaLabel ?? (typeof pendingLabel === "string" ? pendingLabel : undefined))
    : (idleAriaLabel ?? (typeof idleLabel === "string" ? idleLabel : undefined));

  return (
    <button aria-label={accessibleLabel} className={className} disabled={pending} type="submit">
      {currentLabel}
    </button>
  );
}
