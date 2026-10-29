"use client";

import { useActionState, useRef, useState } from "react";

import {
  createSubmissionInvite,
  type SubmissionInviteActionState,
} from "@/app/admin/submissions/invitations/actions";
import { SubmitButton } from "@/components/submit-button";
import { formatSubmissionTimestamp } from "@/lib/admin/employer-submission-display";

type EmployerOption = Readonly<{ id: number; name: string }>;

const initialState: SubmissionInviteActionState = { error: null, invitation: null };

export function SubmissionInviteForm({ employers }: { employers: readonly EmployerOption[] }) {
  const [state, action] = useActionState(createSubmissionInvite, initialState);
  const [copyMessage, setCopyMessage] = useState("");
  const invitationInput = useRef<HTMLInputElement>(null);

  async function copyInvitation() {
    if (!state.invitation) return;

    try {
      await navigator.clipboard.writeText(state.invitation.url);
      setCopyMessage("Invitation link copied.");
    } catch {
      invitationInput.current?.select();
      setCopyMessage("Select and copy the highlighted link.");
    }
  }

  return (
    <div className="submission-invite-workspace">
      <form action={action} className="staff-job-form submission-invite-form">
        {state.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            {state.error}
          </p>
        ) : null}

        <fieldset>
          <legend>Create a seven-day invitation</legend>
          <p>
            Enter the employer contact’s work email. WildJobs stores the invitation securely but does not send
            an email in this beta stage.
          </p>
          <div className="staff-job-form__grid">
            <div>
              <label htmlFor="invitee-email">Employer work email</label>
              <input
                autoComplete="email"
                id="invitee-email"
                maxLength={254}
                name="inviteeEmail"
                required
                type="email"
              />
            </div>
            <div>
              <label htmlFor="invite-employer">Match an existing employer (optional)</label>
              <select defaultValue="" id="invite-employer" name="employerId">
                <option value="">No employer match yet</option>
                {employers.map((employer) => (
                  <option key={employer.id} value={employer.id}>
                    {employer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <div className="staff-job-form__actions">
          <SubmitButton idleLabel="Create secure invitation" pendingLabel="Creating invitation…" />
          <p>The plain invitation token is shown once and is never stored in the database.</p>
        </div>
      </form>

      {state.invitation ? (
        <section className="submission-invite-result" aria-labelledby="invitation-created-heading">
          <p className="eyebrow">Invitation created</p>
          <h2 id="invitation-created-heading">Copy this link now.</h2>
          <p>
            It is for <strong>{state.invitation.inviteeEmail}</strong> and expires on{" "}
            {formatSubmissionTimestamp(state.invitation.expiresAt)}.
          </p>
          <label htmlFor="created-invitation-url">Single-use invitation link</label>
          <input
            id="created-invitation-url"
            readOnly
            ref={invitationInput}
            type="url"
            value={state.invitation.url}
          />
          <button className="action action--white" onClick={copyInvitation} type="button">
            Copy invitation link
          </button>
          <p aria-live="polite" className="submission-invite-result__status">
            {copyMessage}
          </p>
          <p className="submission-invite-result__warning">
            Send this link only to the intended employer contact. Anyone who has it can use it once before it
            expires.
          </p>
        </section>
      ) : null}
    </div>
  );
}
