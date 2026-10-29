"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  className = "action",
  idleLabel,
  pendingLabel,
}: {
  className?: string;
  idleLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
