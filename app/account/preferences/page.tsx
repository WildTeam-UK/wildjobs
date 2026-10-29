import type { Metadata } from "next";

import { updateCandidatePreferences } from "@/app/account/preferences/actions";
import { JobCard } from "@/components/job-card";
import { SubmitButton } from "@/components/submit-button";
import {
  contractOptions,
  experienceOptions,
  hoursOptions,
  workplaceOptions,
} from "@/lib/candidate-preference-validation";
import { getCandidatePreferenceData } from "@/lib/candidate-preferences";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import { matchJobsToPreferences } from "@/lib/job-preference-matching";
import { getPublicJobs } from "@/lib/public-jobs";

export const metadata: Metadata = { title: "Job preferences" };

type PreferenceStatus = "cleared" | "error" | "saved";

const statusMessages: Record<PreferenceStatus, string> = {
  cleared: "Your job preferences have been cleared.",
  error: "Your preferences could not be updated. Check your choices and try again.",
  saved: "Your job preferences have been saved.",
};

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ save?: string; status?: string }>;
}) {
  const [{ careerAreas, preferences }, jobs, candidateSaveState, query] = await Promise.all([
    getCandidatePreferenceData(),
    getPublicJobs(),
    getCandidateSaveState(),
    searchParams,
  ]);
  const selectedCareerAreas = new Set(preferences.careerAreaIds);
  const selectedWorkplaces = new Set(preferences.workplaceTypes);
  const selectedHours = new Set(preferences.hoursTypes);
  const selectedContracts = new Set(preferences.contractTypes);
  const savedJobIds = new Set(candidateSaveState.savedJobIds);
  const matchingJobs = matchJobsToPreferences(jobs, preferences).slice(0, 3);
  const status = ["cleared", "error", "saved"].includes(query.status ?? "")
    ? (query.status as PreferenceStatus)
    : undefined;
  const saveStatus = ["error", "removed", "saved"].includes(query.save ?? "") ? query.save : undefined;
  const feedback = status
    ? { error: status === "error", message: statusMessages[status] }
    : saveStatus
      ? {
          error: saveStatus === "error",
          message:
            saveStatus === "saved"
              ? "Job saved to your private shortlist."
              : saveStatus === "removed"
                ? "Job removed from your shortlist."
                : "Your saved jobs could not be updated. Please try again.",
        }
      : undefined;

  return (
    <main>
      <section className="account-hero account-hero--compact">
        <div className="shell account-hero__layout">
          <div>
            <p className="eyebrow">Job preferences</p>
            <h1>Tell us what useful looks like.</h1>
          </div>
          <p>
            You can inspect, change or remove these choices at any time. They guide discovery—not eligibility.
          </p>
        </div>
      </section>

      <section className="content-section">
        {feedback ? (
          <p
            className={`staff-form-message shell${feedback.error ? " staff-form-message--error" : ""}`}
            role={feedback.error ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        ) : null}
        <form action={updateCandidatePreferences} className="preferences-form shell">
          <fieldset>
            <legend>Career areas</legend>
            <p>Select every area you would genuinely consider.</p>
            <div className="choice-grid">
              {careerAreas.map((area) => (
                <label key={area.id}>
                  <input
                    defaultChecked={selectedCareerAreas.has(area.id)}
                    name="careerAreaIds"
                    type="checkbox"
                    value={area.id}
                  />
                  <span>{area.title}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Working arrangements</legend>
            <p>Choose every location pattern that works for you.</p>
            <div className="choice-grid choice-grid--compact">
              {workplaceOptions.map((option) => (
                <label key={option.value}>
                  <input
                    defaultChecked={selectedWorkplaces.has(option.value)}
                    name="workplaceTypes"
                    type="checkbox"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Working hours</legend>
            <p>Choose every hours pattern you would consider.</p>
            <div className="choice-grid choice-grid--compact">
              {hoursOptions.map((option) => (
                <label key={option.value}>
                  <input
                    defaultChecked={selectedHours.has(option.value)}
                    name="hoursTypes"
                    type="checkbox"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Contract types</legend>
            <p>Select the kinds of opportunity you would consider.</p>
            <div className="choice-grid choice-grid--contracts">
              {contractOptions.map((option) => (
                <label key={option.value}>
                  <input
                    defaultChecked={selectedContracts.has(option.value)}
                    name="contractTypes"
                    type="checkbox"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="preference-fields">
            <legend>Location and experience</legend>
            <p>Use broad information that improves results without over-filtering.</p>
            <div>
              <label htmlFor="preferred-location">Preferred location</label>
              <input
                defaultValue={preferences.preferredLocation}
                id="preferred-location"
                maxLength={120}
                name="preferredLocation"
                placeholder="Town, region or United Kingdom"
              />
            </div>
            <div>
              <label htmlFor="experience-level">Experience level</label>
              <select defaultValue={preferences.experienceLevel} id="experience-level" name="experienceLevel">
                {experienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <div className="preferences-actions">
            <SubmitButton
              className="action"
              idleLabel="Save and preview matches"
              pendingLabel="Saving preferences…"
            />
            {preferences.hasPreferences ? (
              <button className="preferences-clear" name="intent" type="submit" value="clear">
                Clear all preferences
              </button>
            ) : null}
            <p>Only choices you save here are used—WildJobs does not build a hidden profile.</p>
          </div>
        </form>
      </section>

      {preferences.hasPreferences ? (
        <section className="content-section preference-preview">
          <div className="shell">
            <div className="section-heading">
              <p className="eyebrow">Preference preview</p>
              <h2>
                {matchingJobs.length ? "Current roles that share your choices." : "No current matches yet."}
              </h2>
              <p>
                This preview uses only the choices shown above. A role can appear when any saved preference
                matches, with stronger matches shown first.
              </p>
            </div>
            {matchingJobs.length ? (
              <div className="job-list">
                {matchingJobs.map((job) => (
                  <JobCard
                    job={job}
                    key={job.slug}
                    saveReturnTo="/account/preferences"
                    saveState={job.id && savedJobIds.has(job.id) ? "saved" : "available"}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Your preferences are saved.</h3>
                <p>New roles will be checked against them as they are published.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
