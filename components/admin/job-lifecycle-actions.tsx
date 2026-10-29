"use client";

import { useActionState, type FormEvent } from "react";

import {
  expirePublishedJob,
  type JobLifecycleActionState,
  withdrawPublishedJob,
} from "@/app/admin/jobs/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: JobLifecycleActionState = { error: null };

function confirmLifecycleChange(event: FormEvent<HTMLFormElement>, message: string) {
  if (!window.confirm(message)) event.preventDefault();
}

export function JobLifecycleActions({ jobId }: { jobId: number }) {
  const expire = expirePublishedJob.bind(null, jobId);
  const withdraw = withdrawPublishedJob.bind(null, jobId);
  const [expireState, expireAction] = useActionState(expire, initialState);
  const [withdrawState, withdrawAction] = useActionState(withdraw, initialState);

  return (
    <div className="job-lifecycle-actions">
      <section>
        <strong>Closing date passed</strong>
        <p>Mark the vacancy expired after its advertised closing date.</p>
        <form
          action={expireAction}
          onSubmit={(event) =>
            confirmLifecycleChange(event, "Mark this vacancy expired and remove it from public discovery?")
          }
        >
          <label htmlFor={`expire-note-${jobId}`}>Audit note</label>
          <textarea
            id={`expire-note-${jobId}`}
            maxLength={2000}
            minLength={10}
            name="reviewNote"
            placeholder="For example: advertised closing date has passed."
            required
            rows={3}
          />
          {expireState.error ? (
            <p className="staff-form-message staff-form-message--error" role="alert">
              {expireState.error}
            </p>
          ) : null}
          <SubmitButton idleLabel="Mark as expired" pendingLabel="Closing vacancy…" />
        </form>
      </section>

      <section className="job-lifecycle-actions__withdraw">
        <strong>Withdraw before closing</strong>
        <p>Use this when the employer removes the role or confirms it has closed early.</p>
        <form
          action={withdrawAction}
          onSubmit={(event) =>
            confirmLifecycleChange(event, "Withdraw this vacancy and remove it from public discovery?")
          }
        >
          <label htmlFor={`withdraw-note-${jobId}`}>Reason for withdrawal</label>
          <textarea
            id={`withdraw-note-${jobId}`}
            maxLength={2000}
            minLength={10}
            name="reviewNote"
            placeholder="Record the employer or source evidence for this decision."
            required
            rows={3}
          />
          {withdrawState.error ? (
            <p className="staff-form-message staff-form-message--error" role="alert">
              {withdrawState.error}
            </p>
          ) : null}
          <SubmitButton
            className="staff-danger-action"
            idleLabel="Withdraw vacancy"
            pendingLabel="Withdrawing…"
          />
        </form>
      </section>
    </div>
  );
}
