"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type EmployerSubmissionFormProps = Readonly<{
  invitation: Readonly<{ inviteeEmail: string; organisationName: string }>;
  minimumClosingDate: string;
  token: string;
}>;

type SubmissionResponse = Readonly<{ message?: string; ok?: boolean }>;

export function EmployerSubmissionForm({
  invitation,
  minimumClosingDate,
  token,
}: EmployerSubmissionFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      applicationUrl: formData.get("applicationUrl"),
      authorityConfirmed: formData.get("authorityConfirmed") === "on",
      closingDate: formData.get("closingDate"),
      contactEmail: invitation.inviteeEmail,
      contactName: formData.get("contactName"),
      locationText: formData.get("locationText"),
      organisationName: formData.get("organisationName"),
      roleSummary: formData.get("roleSummary"),
      roleTitle: formData.get("roleTitle"),
      salaryText: formData.get("salaryText"),
      token,
      website: formData.get("website"),
      workplaceType: formData.get("workplaceType"),
    };

    try {
      const response = await fetch("/api/employer-submissions", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as SubmissionResponse;

      if (!response.ok) {
        setError(result.message ?? "Your submission could not be saved. Please try again.");
        return;
      }

      router.replace("/for-employers/submit?received=1");
    } catch {
      setError("Your submission could not be sent. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell submission-layout">
      <form className="submission-form" onSubmit={submit}>
        {error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            {error}
          </p>
        ) : null}

        <div aria-hidden="true" className="submission-form__honeypot">
          <label htmlFor="employer-website">Leave this field empty</label>
          <input autoComplete="off" id="employer-website" name="website" tabIndex={-1} />
        </div>

        <fieldset disabled={pending}>
          <legend>Contact and organisation</legend>
          <p>We ask only for enough information to confirm the source and discuss corrections.</p>
          <div className="form-grid">
            <div>
              <label htmlFor="contact-name">Your name</label>
              <input autoComplete="name" id="contact-name" maxLength={120} name="contactName" required />
            </div>
            <div>
              <label htmlFor="work-email">Work email</label>
              <input
                aria-describedby="work-email-note"
                autoComplete="email"
                id="work-email"
                readOnly
                type="email"
                value={invitation.inviteeEmail}
              />
              <small id="work-email-note">This is fixed by the secure invitation.</small>
            </div>
            <div className="form-grid__wide">
              <label htmlFor="organisation-name">Organisation name</label>
              <input
                autoComplete="organization"
                defaultValue={invitation.organisationName}
                id="organisation-name"
                maxLength={200}
                name="organisationName"
                required
              />
            </div>
          </div>
        </fieldset>

        <fieldset disabled={pending}>
          <legend>Vacancy essentials</legend>
          <p>These details will be visible to candidates and must be confirmed before publication.</p>
          <div className="form-grid">
            <div className="form-grid__wide">
              <label htmlFor="role-title">Role title</label>
              <input id="role-title" maxLength={200} name="roleTitle" required />
            </div>
            <div>
              <label htmlFor="salary">Salary or range</label>
              <input id="salary" maxLength={200} name="salaryText" required />
            </div>
            <div>
              <label htmlFor="closing-date">Closing date</label>
              <input id="closing-date" min={minimumClosingDate} name="closingDate" required type="date" />
            </div>
            <div>
              <label htmlFor="location">Location</label>
              <input id="location" maxLength={200} name="locationText" required />
            </div>
            <div>
              <label htmlFor="working-pattern">Working pattern</label>
              <select defaultValue="" id="working-pattern" name="workplaceType" required>
                <option disabled value="">
                  Choose one
                </option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on_site">On-site</option>
              </select>
            </div>
            <div className="form-grid__wide">
              <label htmlFor="role-summary">Short role summary</label>
              <textarea id="role-summary" maxLength={5000} name="roleSummary" required rows={5} />
            </div>
          </div>
        </fieldset>

        <fieldset disabled={pending}>
          <legend>Application route</legend>
          <p>
            Candidates apply through your authoritative system. WildJobs does not host applications in the
            beta.
          </p>
          <div className="form-grid">
            <div className="form-grid__wide">
              <label htmlFor="application-url">Application page URL</label>
              <input
                id="application-url"
                maxLength={2048}
                name="applicationUrl"
                pattern="https://.*"
                required
                type="url"
              />
            </div>
            <label className="consent-choice form-grid__wide">
              <input name="authorityConfirmed" required type="checkbox" />
              <span>
                I confirm that I am authorised to share this vacancy and that the visible information is
                accurate.
              </span>
            </label>
          </div>
        </fieldset>

        <div className="submission-actions">
          <button className="action" disabled={pending} type="submit">
            {pending ? "Sending…" : "Send for review"}
          </button>
          <p>The invitation is used only after the complete submission is saved.</p>
        </div>
      </form>

      <aside className="submission-guidance">
        <p className="eyebrow">Before you start</p>
        <h2>A transparent listing needs:</h2>
        <ul>
          <li>A genuine salary or salary range</li>
          <li>A clear location and working pattern</li>
          <li>An accurate closing date</li>
          <li>An accessible application process</li>
          <li>An authoritative application destination</li>
        </ul>
        <p>
          WildTeam may request corrections, reject incomplete records or withdraw listings that are no longer
          current.
        </p>
      </aside>
    </div>
  );
}
