"use client";

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
  idleLabel: string;
  pendingAriaLabel?: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={pending ? (pendingAriaLabel ?? pendingLabel) : (idleAriaLabel ?? idleLabel)}
      className={className}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
