"use client";

import { useActionState } from "react";

import { createManualJob, type JobIntakeActionState } from "@/app/admin/jobs/new/actions";
import { SubmitButton } from "@/components/submit-button";

type VacancySource = { id: number; name: string };

const initialState: JobIntakeActionState = { error: null };

export function ManualJobForm({ sources, today }: { sources: readonly VacancySource[]; today: string }) {
  const [state, action] = useActionState(createManualJob, initialState);

  return (
    <form action={action} className="staff-job-form">
      {state.error ? (
        <p aria-live="polite" className="staff-form-message staff-form-message--error" role="alert">
          {state.error}
        </p>
      ) : null}

      <fieldset>
        <legend>Source and employer</legend>
        <p>Start with the authoritative vacancy page. WildJobs keeps this link as provenance.</p>
        <div className="staff-job-form__grid">
          <div>
            <label htmlFor="source-id">Approved source</label>
            <select id="source-id" name="sourceId" required>
              <option value="">Choose a source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="canonical-url">Original vacancy URL</label>
            <input id="canonical-url" name="canonicalUrl" placeholder="https://…" required type="url" />
          </div>
          <div>
            <label htmlFor="employer-name">Employer name</label>
            <input id="employer-name" maxLength={160} name="employerName" required />
          </div>
          <div>
            <label htmlFor="employer-website-url">
              Employer website <span>(optional)</span>
            </label>
            <input id="employer-website-url" name="employerWebsiteUrl" placeholder="https://…" type="url" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Vacancy essentials</legend>
        <p>Copy the employer’s meaning accurately. You can refine presentation during review.</p>
        <div className="staff-job-form__grid">
          <div className="staff-job-form__wide">
            <label htmlFor="title">Job title</label>
            <input id="title" maxLength={180} name="title" required />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="summary">Short summary</label>
            <textarea id="summary" maxLength={500} name="summary" required rows={3} />
            <small>20–500 characters explaining the role clearly.</small>
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="description">Description</label>
            <textarea id="description" maxLength={20000} name="description" required rows={8} />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="responsibilities">
              Responsibilities <span>(optional)</span>
            </label>
            <textarea id="responsibilities" maxLength={12000} name="responsibilities" rows={5} />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="requirements">
              Requirements <span>(optional)</span>
            </label>
            <textarea id="requirements" maxLength={12000} name="requirements" rows={5} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Place and working pattern</legend>
        <div className="staff-job-form__grid">
          <div>
            <label htmlFor="location-text">Location as advertised</label>
            <input id="location-text" maxLength={240} name="locationText" required />
          </div>
          <div>
            <label htmlFor="country-code">Country code</label>
            <input id="country-code" maxLength={2} name="countryCode" placeholder="GB" required />
          </div>
          <div>
            <label htmlFor="workplace-type">Workplace</label>
            <select id="workplace-type" name="workplaceType" required>
              <option value="">Choose one</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
            </select>
          </div>
          <div>
            <label htmlFor="contract-type">Contract</label>
            <select id="contract-type" name="contractType" required>
              <option value="">Choose one</option>
              <option value="permanent">Permanent</option>
              <option value="fixed_term">Fixed term</option>
              <option value="temporary">Temporary</option>
              <option value="internship">Internship</option>
              <option value="apprenticeship">Apprenticeship</option>
            </select>
          </div>
          <div>
            <label htmlFor="hours-type">Hours</label>
            <select id="hours-type" name="hoursType" required>
              <option value="">Choose one</option>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div>
            <label htmlFor="experience-level">Experience level</label>
            <select id="experience-level" name="experienceLevel" required>
              <option value="">Choose one</option>
              <option value="entry">Entry</option>
              <option value="developing">Developing</option>
              <option value="experienced">Experienced</option>
              <option value="leadership">Leadership</option>
              <option value="open">Open</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Salary, dates and application</legend>
        <div className="staff-job-form__grid">
          <div className="staff-job-form__wide">
            <label htmlFor="salary-text">Salary as advertised</label>
            <input id="salary-text" maxLength={240} name="salaryText" required />
          </div>
          <div>
            <label htmlFor="posted-at">
              Published by employer <span>(optional)</span>
            </label>
            <input id="posted-at" name="postedAt" type="date" />
          </div>
          <div>
            <label htmlFor="closes-at">Closing date</label>
            <input id="closes-at" min={today} name="closesAt" required type="date" />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="application-url">Application URL</label>
            <input id="application-url" name="applicationUrl" placeholder="https://…" required type="url" />
          </div>
        </div>
      </fieldset>

      <div className="staff-job-form__actions">
        <div>
          <strong>This does not publish the vacancy.</strong>
          <p>It creates a private review record with source attribution and an audit entry.</p>
        </div>
        <SubmitButton idleLabel="Create review draft" pendingLabel="Creating draft…" />
      </div>
    </form>
  );
}
