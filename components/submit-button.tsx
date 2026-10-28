"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="action" disabled={pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
