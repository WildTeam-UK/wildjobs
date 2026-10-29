"use client";

import { useActionState } from "react";

import { type EmployerProfileActionState, updateEmployerProfile } from "@/app/admin/employers/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: EmployerProfileActionState = { error: null };

export function EmployerProfileForm({
  employerId,
  values,
}: {
  employerId: number;
  values: { mission: string; overview: string; websiteUrl: string };
}) {
  const update = updateEmployerProfile.bind(null, employerId);
  const [state, action] = useActionState(update, initialState);

  return (
    <form action={action} className="staff-job-form">
      {state.error ? (
        <p aria-live="polite" className="staff-form-message staff-form-message--error" role="alert">
          {state.error}
        </p>
      ) : null}

      <fieldset>
        <legend>Reusable employer context</legend>
        <p>
          Verify these details against the organisation’s own website. Future vacancies matched to this
          employer will reuse them automatically.
        </p>
        <div className="staff-job-form__grid">
          <div className="staff-job-form__wide">
            <label htmlFor="website-url">Official website</label>
            <input
              defaultValue={values.websiteUrl}
              id="website-url"
              name="websiteUrl"
              placeholder="https://…"
              required
              type="url"
            />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="mission">Mission</label>
            <textarea
              defaultValue={values.mission}
              id="mission"
              maxLength={400}
              name="mission"
              required
              rows={3}
            />
            <small>20–400 characters summarising the organisation’s purpose factually.</small>
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="overview">Overview</label>
            <textarea
              defaultValue={values.overview}
              id="overview"
              maxLength={1200}
              name="overview"
              required
              rows={6}
            />
            <small>40–1,200 characters explaining what the organisation does.</small>
          </div>
        </div>
      </fieldset>

      <div className="staff-job-form__actions">
        <div>
          <strong>Save once, reuse on later vacancies.</strong>
          <p>This adds an audit event and does not publish any vacancy.</p>
        </div>
        <SubmitButton idleLabel="Save employer context" pendingLabel="Saving employer context…" />
      </div>
    </form>
  );
}
