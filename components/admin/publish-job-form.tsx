"use client";

import type { FormEvent } from "react";

import { SubmitButton } from "@/components/submit-button";

export function PublishJobForm({ action }: { action: () => Promise<void> }) {
  function confirmPublication(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Publish this vacancy and its employer to the live catalogue?")) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmPublication}>
      <SubmitButton idleLabel="Publish vacancy" pendingLabel="Publishing…" />
    </form>
  );
}
