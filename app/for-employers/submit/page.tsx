import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Submit a conservation job" };

export default function SubmitJobPage() {
  return (
    <main className="submission-page">
      <header className="submission-hero shell">
        <div>
          <p className="eyebrow">Controlled beta submission</p>
          <h1>Share a complete conservation opportunity.</h1>
        </div>
        <div>
          <p>Submission starts a review. It never publishes a vacancy automatically.</p>
          <Link className="text-link" href="/for-employers">
            How WildJobs reviews roles →
          </Link>
        </div>
      </header>

      <aside className="fixture-notice">
        <div className="shell">
          <strong>Design preview:</strong> Do not enter real contact or vacancy information. Nothing is sent
          or saved.
        </div>
      </aside>

      <div className="shell submission-layout">
        <form className="submission-form">
          <fieldset>
            <legend>Contact and organisation</legend>
            <p>We ask only for enough information to confirm the source and discuss corrections.</p>
            <div className="form-grid">
              <div>
                <label htmlFor="contact-name">Your name</label>
                <input autoComplete="name" id="contact-name" name="contact-name" required />
              </div>
              <div>
                <label htmlFor="work-email">Work email</label>
                <input autoComplete="email" id="work-email" name="work-email" required type="email" />
              </div>
              <div className="form-grid__wide">
                <label htmlFor="organisation-name">Organisation name</label>
                <input id="organisation-name" name="organisation-name" required />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Vacancy essentials</legend>
            <p>These details will be visible to candidates and must be confirmed before publication.</p>
            <div className="form-grid">
              <div className="form-grid__wide">
                <label htmlFor="role-title">Role title</label>
                <input id="role-title" name="role-title" required />
              </div>
              <div>
                <label htmlFor="salary">Salary or range</label>
                <input id="salary" name="salary" required />
              </div>
              <div>
                <label htmlFor="closing-date">Closing date</label>
                <input id="closing-date" name="closing-date" required type="date" />
              </div>
              <div>
                <label htmlFor="location">Location</label>
                <input id="location" name="location" required />
              </div>
              <div>
                <label htmlFor="working-pattern">Working pattern</label>
                <select defaultValue="" id="working-pattern" name="working-pattern" required>
                  <option disabled value="">
                    Choose one
                  </option>
                  <option>Remote</option>
                  <option>Hybrid</option>
                  <option>On-site</option>
                </select>
              </div>
              <div className="form-grid__wide">
                <label htmlFor="role-summary">Short role summary</label>
                <textarea id="role-summary" name="role-summary" required rows={5} />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Application route</legend>
            <p>
              Candidates apply through your authoritative system. WildJobs does not host applications in the
              beta.
            </p>
            <div className="form-grid">
              <div className="form-grid__wide">
                <label htmlFor="application-url">Application page URL</label>
                <input id="application-url" name="application-url" required type="url" />
              </div>
              <label className="consent-choice form-grid__wide">
                <input name="authority" required type="checkbox" />
                <span>
                  I confirm that I am authorised to share this vacancy and that the visible information is
                  accurate.
                </span>
              </label>
            </div>
          </fieldset>

          <div className="submission-actions">
            <button className="action" type="button">
              Review submission
            </button>
            <p>Prototype only—this button does not transmit or store the form.</p>
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
            WildTeam may request corrections, reject incomplete records or withdraw listings that are no
            longer current.
          </p>
        </aside>
      </div>
    </main>
  );
}
