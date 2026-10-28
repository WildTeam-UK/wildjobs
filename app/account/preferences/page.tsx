import type { Metadata } from "next";

export const metadata: Metadata = { title: "Job preferences" };

const careerAreas = [
  "Community conservation",
  "Marine conservation",
  "Science and research",
  "Programme management",
  "Communications",
  "Early careers",
];
const workingPatterns = ["Remote", "Hybrid", "On-site", "Full time", "Part time"];

export default function PreferencesPage() {
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
        <form className="preferences-form shell">
          <fieldset>
            <legend>Career areas</legend>
            <p>Select every area you would genuinely consider.</p>
            <div className="choice-grid">
              {careerAreas.map((area, index) => (
                <label key={area}>
                  <input defaultChecked={index === 0 || index === 3} name="career-area" type="checkbox" />
                  <span>{area}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Working arrangements</legend>
            <p>Choose the patterns that work for you.</p>
            <div className="choice-grid choice-grid--compact">
              {workingPatterns.map((pattern, index) => (
                <label key={pattern}>
                  <input defaultChecked={index === 0 || index === 1} name="working-pattern" type="checkbox" />
                  <span>{pattern}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="preference-fields">
            <legend>Location and experience</legend>
            <p>Use broad information that helps improve results without over-filtering.</p>
            <div>
              <label htmlFor="preferred-location">Preferred location</label>
              <input
                id="preferred-location"
                name="preferred-location"
                placeholder="Town, region or United Kingdom"
              />
            </div>
            <div>
              <label htmlFor="experience-level">Experience level</label>
              <select defaultValue="open" id="experience-level" name="experience-level">
                <option value="open">Open to different levels</option>
                <option value="entry">Entry level</option>
                <option value="developing">Developing career</option>
                <option value="experienced">Experienced professional</option>
                <option value="leadership">Leadership</option>
              </select>
            </div>
          </fieldset>

          <div className="preferences-actions">
            <button className="action" type="button">
              Preview updated matches
            </button>
            <p>Prototype only—these choices are not currently saved.</p>
          </div>
        </form>
      </section>
    </main>
  );
}
