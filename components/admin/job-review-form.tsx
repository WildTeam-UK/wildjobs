"use client";

import { useActionState } from "react";

import { type JobReviewActionState, updateJobReview } from "@/app/admin/jobs/actions";
import { SubmitButton } from "@/components/submit-button";

export type ReviewFormValues = {
  applicationUrl: string;
  canonicalUrl: string;
  closesAt: string;
  contractType: string;
  countryCode: string;
  description: string;
  engagementType: string;
  employerMission: string;
  employerName: string;
  employerOverview: string;
  employerWebsiteUrl: string;
  experienceLevel: string;
  hoursType: string;
  locationLocality: string;
  locationRegion: string;
  locationText: string;
  postalCode: string;
  postedAt: string;
  requirements: string;
  responsibilities: string;
  salaryText: string;
  summary: string;
  title: string;
  workplaceType: string;
};

const initialState: JobReviewActionState = { error: null };

export function JobReviewForm({
  jobId,
  today,
  values,
}: {
  jobId: number;
  today: string;
  values: ReviewFormValues;
}) {
  const update = updateJobReview.bind(null, jobId);
  const [state, action] = useActionState(update, initialState);

  return (
    <form action={action} className="staff-job-form">
      {state.error ? (
        <p aria-live="polite" className="staff-form-message staff-form-message--error" role="alert">
          {state.error}
        </p>
      ) : null}

      <fieldset>
        <legend>Source and employer</legend>
        <p>
          Check the authoritative vacancy page. Employer profiles are maintained separately from this job
          review.
        </p>
        <div className="staff-job-form__grid">
          <div className="staff-job-form__wide">
            <label htmlFor="canonical-url">Original vacancy URL</label>
            <input
              defaultValue={values.canonicalUrl}
              id="canonical-url"
              name="canonicalUrl"
              required
              type="url"
            />
          </div>
          <div>
            <label htmlFor="employer-name">Employer</label>
            <input disabled id="employer-name" value={values.employerName} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Vacancy copy</legend>
        <div className="staff-job-form__grid">
          <div className="staff-job-form__wide">
            <label htmlFor="title">Job title</label>
            <input defaultValue={values.title} id="title" maxLength={180} name="title" required />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="summary">Short summary</label>
            <textarea
              defaultValue={values.summary}
              id="summary"
              maxLength={500}
              name="summary"
              required
              rows={3}
            />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="description">Description</label>
            <textarea
              defaultValue={values.description}
              id="description"
              maxLength={20000}
              name="description"
              required
              rows={9}
            />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="responsibilities">
              Responsibilities <span>(optional)</span>
            </label>
            <textarea
              defaultValue={values.responsibilities}
              id="responsibilities"
              maxLength={12000}
              name="responsibilities"
              rows={5}
            />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="requirements">
              Requirements <span>(optional)</span>
            </label>
            <textarea
              defaultValue={values.requirements}
              id="requirements"
              maxLength={12000}
              name="requirements"
              rows={5}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Place and working pattern</legend>
        <div className="staff-job-form__grid">
          <div>
            <label htmlFor="location-text">Location as advertised</label>
            <input
              defaultValue={values.locationText}
              id="location-text"
              maxLength={240}
              name="locationText"
              required
            />
          </div>
          <div>
            <label htmlFor="country-code">Country code</label>
            <input
              defaultValue={values.countryCode}
              id="country-code"
              maxLength={2}
              name="countryCode"
              required
            />
          </div>
          <div>
            <label htmlFor="location-locality">
              Town or city <span>(optional)</span>
            </label>
            <input
              defaultValue={values.locationLocality}
              id="location-locality"
              maxLength={120}
              name="locationLocality"
            />
          </div>
          <div>
            <label htmlFor="location-region">
              County or region <span>(optional)</span>
            </label>
            <input
              defaultValue={values.locationRegion}
              id="location-region"
              maxLength={120}
              name="locationRegion"
            />
          </div>
          <div>
            <label htmlFor="postal-code">
              Postcode <span>(optional)</span>
            </label>
            <input
              autoComplete="postal-code"
              defaultValue={values.postalCode}
              id="postal-code"
              maxLength={40}
              name="postalCode"
            />
          </div>
          <div>
            <label htmlFor="workplace-type">Workplace</label>
            <select
              defaultValue={values.workplaceType || "not_specified"}
              id="workplace-type"
              name="workplaceType"
              required
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label htmlFor="engagement-type">Opportunity</label>
            <select
              defaultValue={values.engagementType || "not_specified"}
              id="engagement-type"
              name="engagementType"
              required
            >
              <option value="paid">Paid</option>
              <option value="volunteer">Volunteer</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label htmlFor="contract-type">Contract</label>
            <select
              defaultValue={values.contractType || "not_specified"}
              id="contract-type"
              name="contractType"
              required
            >
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
              defaultValue={values.hoursType || "not_specified"}
              id="hours-type"
              name="hoursType"
              required
            >
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="flexible">Flexible</option>
              <option value="not_specified">Not specified</option>
            </select>
          </div>
          <div>
            <label htmlFor="experience-level">Experience level</label>
            <select
              defaultValue={values.experienceLevel || "not_specified"}
              id="experience-level"
              name="experienceLevel"
              required
            >
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
            <input defaultValue={values.salaryText} id="salary-text" maxLength={240} name="salaryText" />
            <label>
              <input defaultChecked={!values.salaryText} name="salaryNotStated" type="checkbox" /> Salary not
              stated by the employer
            </label>
          </div>
          <div>
            <label htmlFor="posted-at">
              Published by employer <span>(optional)</span>
            </label>
            <input defaultValue={values.postedAt} id="posted-at" name="postedAt" type="date" />
          </div>
          <div>
            <label htmlFor="closes-at">Closing date (leave blank if not advertised)</label>
            <input defaultValue={values.closesAt} id="closes-at" min={today} name="closesAt" type="date" />
          </div>
          <div className="staff-job-form__wide">
            <label htmlFor="application-url">Application URL</label>
            <input
              defaultValue={values.applicationUrl}
              id="application-url"
              name="applicationUrl"
              required
              type="url"
            />
          </div>
        </div>
      </fieldset>

      <div className="staff-job-form__actions">
        <div>
          <strong>Saving still does not publish the vacancy.</strong>
          <p>It rechecks the source, updates the private review record and appends an audit entry.</p>
        </div>
        <SubmitButton idleLabel="Save reviewed details" pendingLabel="Saving review…" />
      </div>
    </form>
  );
}
