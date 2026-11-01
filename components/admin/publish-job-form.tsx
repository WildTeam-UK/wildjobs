"use client";

import type { FormEvent } from "react";

import { SubmitButton } from "@/components/submit-button";

export function PublishJobForm({ action }: { action: () => Promise<void> }) {
  function confirmPublication(event: FormEvent<HTMLFormElement>) {
    if (
      !window.confirm(
        "Publish this reviewed vacancy brief to the live catalogue? Employer profiles are maintained separately.",
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmPublication}>
      <SubmitButton idleLabel="Publish vacancy" pendingLabel="Publishing…" />
    </form>
  );
}
