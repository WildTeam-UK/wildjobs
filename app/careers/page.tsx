import type { Metadata } from "next";
import Link from "next/link";
import { getPublicCareerAreas } from "@/lib/public-career-areas";
import { getPublicJobs } from "@/lib/public-jobs";

export const metadata: Metadata = { title: "Explore conservation careers" };

export default async function CareersPage() {
  const [careerAreas, jobs] = await Promise.all([getPublicCareerAreas(), getPublicJobs()]);
  const jobCounts = new Map<string, number>();

  for (const job of jobs) {
    for (const careerArea of job.careerAreas ?? []) {
      jobCounts.set(careerArea, (jobCounts.get(careerArea) ?? 0) + 1);
    }
  }

  return (
    <main>
      <section className="interior-hero">
        <div className="shell interior-hero__layout">
          <div>
            <p className="eyebrow">Explore careers</p>
            <h1>Find your place in conservation.</h1>
          </div>
          <p>Understand the work, the skills and the many routes into a career that helps nature recover.</p>
        </div>
      </section>
      <section className="content-section">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Career areas</p>
              <h2>Start with what draws you in.</h2>
            </div>
            <p>
              Explore the main areas of work and see current roles connected to each one. More practical
              guidance will be added as it is reviewed.
            </p>
          </div>
          <div className="pathway-grid">
            {careerAreas.map((area, index) => {
              const jobCount = jobCounts.get(area.title) ?? 0;

              return (
                <Link href={`/careers/${area.slug}`} key={area.id}>
                  <span>0{index + 1}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                  <strong>
                    {jobCount} current {jobCount === 1 ? "role" : "roles"} →
                  </strong>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="training-callout">
        <div className="shell training-callout__inner">
          <div>
            <p className="eyebrow">Build useful skills</p>
            <h2>Learn with real conservation work in mind.</h2>
            <p>WildTeam training is designed around practical tools and challenges from the sector.</p>
          </div>
          <a
            className="action action--white"
            href="https://training.wildteam.org.uk/courses"
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore training <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  );
}
