"use client";

import { useActionState, type FormEvent } from "react";

import {
  createSubmissionJobReview,
  rejectSubmission,
  requestSubmissionChanges,
  type SubmissionReviewActionState,
} from "@/app/admin/submissions/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: SubmissionReviewActionState = { error: null };

function ActionError({ message }: { message: string | null }) {
  return message ? (
    <p className="staff-form-message staff-form-message--error" role="alert">
      {message}
    </p>
  ) : null;
}

export function EmployerSubmissionActions({
  canCreateDraft,
  submissionId,
}: {
  canCreateDraft: boolean;
  submissionId: number;
}) {
  const createDraft = createSubmissionJobReview.bind(null, submissionId);
  const requestChanges = requestSubmissionChanges.bind(null, submissionId);
  const reject = rejectSubmission.bind(null, submissionId);
  const [createState, createAction] = useActionState(createDraft, initialState);
  const [changesState, changesAction] = useActionState(requestChanges, initialState);
  const [rejectState, rejectAction] = useActionState(reject, initialState);

  function confirmDraft(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Create a private job-review draft from this employer submission?")) {
      event.preventDefault();
    }
  }

  function confirmRejection(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Reject this employer submission and close it in the review queue?")) {
      event.preventDefault();
    }
  }

  return (
    <div className="submission-review-actions">
      {canCreateDraft ? (
        <section>
          <p className="eyebrow">Approve for job review</p>
          <h3>Create a private vacancy draft</h3>
          <p>
            Copies the supplied facts into the job-review queue and preserves this submission as evidence.
            Publication remains a separate administrator decision.
          </p>
          <ActionError message={createState.error} />
          <form action={createAction} onSubmit={confirmDraft}>
            <SubmitButton idleLabel="Create job-review draft" pendingLabel="Creating draft…" />
          </form>
        </section>
      ) : (
        <section>
          <p className="eyebrow">Administrator decision</p>
          <h3>Draft creation needs an administrator.</h3>
          <p>Reviewers can record changes or rejection, but only an administrator can create the vacancy.</p>
        </section>
      )}

      <section>
        <p className="eyebrow">Needs clarification</p>
        <h3>Record changes needed</h3>
        <p>
          Add an actionable note to the audit history. WildJobs does not email the employer yet, so contact
          them separately using the work email on this record.
        </p>
        <ActionError message={changesState.error} />
        <form action={changesAction}>
          <label htmlFor="submission-changes-note">Review note</label>
          <textarea
            id="submission-changes-note"
            maxLength={2000}
            minLength={10}
            name="reviewNote"
            required
            rows={4}
          />
          <SubmitButton
            className="action action--outline"
            idleLabel="Record changes needed"
            pendingLabel="Recording decision…"
          />
        </form>
      </section>

      <section className="submission-review-actions__reject">
        <p className="eyebrow">Close submission</p>
        <h3>Reject with a recorded reason</h3>
        <p>The submission stays in the audit history but leaves the active review queue.</p>
        <ActionError message={rejectState.error} />
        <form action={rejectAction} onSubmit={confirmRejection}>
          <label htmlFor="submission-rejection-note">Reason for rejection</label>
          <textarea
            id="submission-rejection-note"
            maxLength={2000}
            minLength={10}
            name="reviewNote"
            required
            rows={4}
          />
          <SubmitButton
            className="action action--outline"
            idleLabel="Reject submission"
            pendingLabel="Rejecting submission…"
          />
        </form>
      </section>
    </div>
  );
}
