"use client";

import { useActionState } from "react";

import { createManualJob, type JobIntakeActionState } from "@/app/admin/jobs/new/actions";
import { SubmitButton } from "@/components/submit-button";
import type { VacancyFieldEvidence } from "@/lib/admin/vacancy-detail-extraction";

type VacancySource = { id: number; name: string };

type ManualJobDefaults = {
  applicationUrl?: string;
  canonicalUrl?: string;
  closesAt?: string;
  contractType?: string;
  countryCode?: string;
  description?: string;
  engagementType?: string;
  employerName?: string;
  employerWebsiteUrl?: string;
  experienceLevel?: string;
  fieldEvidence?: VacancyFieldEvidence[];
  hoursType?: string;
  locationText?: string;
  postedAt?: string;
  salaryText?: string;
  sourceId?: number;
  summary?: string;
  title?: string;
  workplaceType?: string;
};

const initialState: JobIntakeActionState = { error: null };
const evidenceLabels: Record<VacancyFieldEvidence["fieldName"], string> = {
  contract_type: "Contract",
  application_url: "Application address",
  closes_at: "Closing date",
  employer_name: "Employer",
  employer_website_url: "Employer website",
  engagement_type: "Paid or volunteer",
  experience_level: "Experience",
  hours_type: "Hours",
  location_text: "Location",
  salary_text: "Salary",
  workplace_type: "Workplace",
};

function readableValue(value: string) {
  return value.replaceAll("_", " ");
}

export function ManualJobForm({
  defaults,
  sources,
  today,
}: {
  defaults?: ManualJobDefaults;
  sources: readonly VacancySource[];
  today: string;
}) {
  const [state, action] = useActionState(createManualJob, initialState);

  return (
    <form action={action} className="staff-job-form">
      {state.error ? (
        <p aria-live="polite" className="staff-form-message staff-form-message--error" role="alert">
          {state.error}
        </p>
      ) : null}

      {defaults ? (
        <div className="staff-form-message" role="status">
          <strong>Imported details added.</strong> Check every field against the original vacancy before you
          create the private review draft.
        </div>
      ) : null}

      {defaults?.fieldEvidence ? (
        <div className="staff-form-message">
          <strong>What the feed actually told us</strong>
          <ul>
            {defaults.fieldEvidence.map((item) => (
              <li key={item.fieldName}>
                <strong>{evidenceLabels[item.fieldName]}:</strong>{" "}
                {item.resolutionStatus === "extracted" ? (
                  <>
                    {readableValue(item.value ?? "")} ({item.confidence}% confidence; evidence: “
                    {item.evidenceText}”)
                  </>
                ) : (
                  "Not specified in the feed — no assumption made"
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <fieldset>
        <legend>Source and employer</legend>
        <p>Start with the authoritative vacancy page. WildJobs keeps this link as provenance.</p>
        <div className="staff-job-form__grid">
          <div>
            <label htmlFor="source-id">Approved source</label>
            <select defaultValue={defaults?.sourceId ?? ""} id="source-id" name="sourceId" required>
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
            <input
              defaultValue={defaults?.canonicalUrl}
              id="canonical-url"
              name="canonicalUrl"
              placeholder="https://…"
              required
              type="url"
            />
          </div>
          <div>
            <label htmlFor="employer-name">Employer name</label>
            <input
              defaultValue={defaults?.employerName}
              id="employer-name"
              maxLength={160}
              name="employerName"
              required
            />
          </div>
          <div>
            <label htmlFor="employer-website-url">
              Employer website <span>(optional)</span>
            </label>
            <input
              defaultValue={defaults?.employerWebsiteUrl}
              id="employer-website-url"
              name="employerWebsiteUrl"
              placeholder="https://…"
              type="url"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Vacancy essentials</legend>
        <p>Copy the employer’s meaning accurately. You can refine presentation during review.</p>
        <div className="staff-job-form__grid">
          <div className="staff-job-form__wide">
            <label htmlFor="title">Job title</label>
            <input defaultValue={defaults?.title} id="title" maxLength={180} name="title" required />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="summary">Short summary</label>
            <textarea
              defaultValue={defaults?.summary}
              id="summary"
              maxLength={500}
              name="summary"
              required
              rows={3}
            />
            <small>20–500 characters explaining the role clearly.</small>
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="description">Description</label>
            <textarea
              defaultValue={defaults?.description}
              id="description"
              maxLength={20000}
              name="description"
              required
              rows={8}
            />
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
            <input
              defaultValue={defaults?.locationText}
              id="location-text"
              maxLength={240}
              name="locationText"
              required
            />
          </div>
          <div>
            <label htmlFor="country-code">Country code</label>
            <input
              defaultValue={defaults?.countryCode}
              id="country-code"
              maxLength={2}
              name="countryCode"
              placeholder="GB"
              required
            />
          </div>
          <div>
            <label htmlFor="workplace-type">Workplace</label>
            <select
              defaultValue={defaults ? (defaults.workplaceType ?? "not_specified") : ""}
              id="workplace-type"
              name="workplaceType"
              required
            >
              <option value="">Choose one</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label htmlFor="engagement-type">Opportunity</label>
            <select
              defaultValue={defaults ? (defaults.engagementType ?? "not_specified") : ""}
              id="engagement-type"
              name="engagementType"
              required
            >
              <option value="">Choose one</option>
              <option value="paid">Paid</option>
              <option value="volunteer">Volunteer</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label htmlFor="contract-type">Contract</label>
            <select
              defaultValue={defaults ? (defaults.contractType ?? "not_specified") : ""}
              id="contract-type"
              name="contractType"
              required
            >
              <option value="">Choose one</option>
              <option value="permanent">Permanent</option>
              <option value="fixed_term">Fixed term</option>
              <option value="temporary">Temporary</option>
              <option value="internship">Internship</option>
              <option value="apprenticeship">Apprenticeship</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label htmlFor="hours-type">Hours</label>
            <select
              defaultValue={defaults ? (defaults.hoursType ?? "not_specified") : ""}
              id="hours-type"
              name="hoursType"
              required
            >
              <option value="">Choose one</option>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="flexible">Flexible</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label htmlFor="experience-level">Experience level</label>
            <select
              defaultValue={defaults ? (defaults.experienceLevel ?? "not_specified") : ""}
              id="experience-level"
              name="experienceLevel"
              required
            >
              <option value="">Choose one</option>
              <option value="entry">Entry</option>
              <option value="developing">Developing</option>
              <option value="experienced">Experienced</option>
              <option value="leadership">Leadership</option>
              <option value="open">Open</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Salary, dates and application</legend>
        <div className="staff-job-form__grid">
          <div className="staff-job-form__wide">
            <label htmlFor="salary-text">Salary as advertised</label>
            <input defaultValue={defaults?.salaryText} id="salary-text" maxLength={240} name="salaryText" />
            <label>
              <input
                defaultChecked={Boolean(defaults && !defaults.salaryText)}
                name="salaryNotStated"
                type="checkbox"
              />{" "}
              Salary not stated by the employer
            </label>
          </div>
          <div>
            <label htmlFor="posted-at">
              Published by employer <span>(optional)</span>
            </label>
            <input defaultValue={defaults?.postedAt} id="posted-at" name="postedAt" type="date" />
          </div>
          <div>
            <label htmlFor="closes-at">Closing date</label>
            <input
              defaultValue={defaults?.closesAt}
              id="closes-at"
              min={today}
              name="closesAt"
              required
              type="date"
            />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="application-url">Application URL</label>
            <input
              defaultValue={defaults?.applicationUrl}
              id="application-url"
              name="applicationUrl"
              placeholder="https://…"
              required
              type="url"
            />
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
