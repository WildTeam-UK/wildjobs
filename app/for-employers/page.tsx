import type { Metadata } from "next";
export const metadata: Metadata = { title: "For conservation employers" };
export default function ForEmployers() {
  return (
    <main>
      <section className="interior-hero interior-hero--pink">
        <div className="shell interior-hero__layout">
          <div>
            <p className="eyebrow">For employers</p>
            <h1>Help people find your conservation roles.</h1>
          </div>
          <p>
            WildJobs brings opportunities from the EnvironmentJob feed into a simple, searchable directory.
          </p>
        </div>
      </section>
      <section className="content-section">
        <div className="shell employer-proposition">
          <div className="section-heading">
            <h2>Your original advert stays the source.</h2>
            <p>
              Our job cards show a concise summary, salary, location and relevant WildTeam training.
              Candidates follow the card to your original advert on EnvironmentJob.
            </p>
            <a
              className="action"
              href="https://environmentjob.co.uk/advertise"
              target="_blank"
              rel="noopener noreferrer"
            >
              Advertise with EnvironmentJob →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
