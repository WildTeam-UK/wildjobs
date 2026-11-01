import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobCard } from "@/components/job-card";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import { getPublicCareerAreaBySlug, getPublicCareerAreas } from "@/lib/public-career-areas";
import { getPublicJobs } from "@/lib/public-jobs";

type CareerAreaPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CareerAreaPageProps): Promise<Metadata> {
  const area = await getPublicCareerAreaBySlug((await params).slug);
  if (!area) return {};

  return {
    title: `${area.title} careers`,
    description: area.description,
  };
}

export default async function CareerAreaPage({ params }: CareerAreaPageProps) {
  const { slug } = await params;
  const [careerAreas, jobs, candidateSaveState] = await Promise.all([
    getPublicCareerAreas(),
    getPublicJobs(),
    getCandidateSaveState(),
  ]);
  const area = careerAreas.find((careerArea) => careerArea.slug === slug);
  if (!area) notFound();

  const relatedJobs = jobs.filter((job) => job.careerAreas?.includes(area.title));
  const otherAreas = careerAreas.filter((careerArea) => careerArea.id !== area.id);
  const savedJobIds = new Set(candidateSaveState.savedJobIds);

  return (
    <main>
      <div className="shell career-area-back">
        <Link className="back-link" href="/careers">
          <span aria-hidden="true">←</span> All career areas
        </Link>
      </div>

      <section className="interior-hero career-area-hero">
        <div className="shell interior-hero__layout">
          <div>
            <p className="eyebrow">Career area</p>
            <h1>{area.title}</h1>
          </div>
          <p>{area.description}</p>
        </div>
      </section>

      <section className="content-section career-area-intro">
        <div className="shell career-area-intro__layout">
          <div className="section-heading">
            <p className="eyebrow">Explore the work</p>
            <h2>Use real vacancies to understand this field.</h2>
          </div>
          <div>
            <p>
              Compare current role titles, employers, locations, working patterns and pay information. Save
              useful roles to build a clearer picture of what interests you and what employers ask for.
            </p>
            <Link className="text-link" href={`/?category=${encodeURIComponent(area.title)}`}>
              Search this career area <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="career-area-jobs">
        <div className="shell">
          <div className="job-results__heading">
            <h2>Current opportunities</h2>
            <p>
              {relatedJobs.length} current {relatedJobs.length === 1 ? "role" : "roles"}
            </p>
          </div>
          {relatedJobs.length ? (
            <div className="job-list">
              {relatedJobs.map((job) => (
                <JobCard
                  job={job}
                  key={job.slug}
                  saveState={
                    candidateSaveState.isSignedIn && job.id && savedJobIds.has(job.id)
                      ? "saved"
                      : candidateSaveState.isSignedIn
                        ? "available"
                        : "signed-out"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="staff-empty-state">
              <p className="eyebrow">No live matches today</p>
              <h2>There are no current vacancies in this area yet.</h2>
              <p>New roles appear here automatically from the feed.</p>
              <Link className="action action--outline" href="/">
                Browse all jobs
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="content-section career-area-more">
        <div className="shell">
          <div className="section-heading section-heading--with-link">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h2>Other conservation career areas.</h2>
            </div>
            <Link className="text-link" href="/careers">
              View all areas <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="career-area-list">
            {otherAreas.map((careerArea, index) => (
              <Link href={`/careers/${careerArea.slug}`} key={careerArea.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{careerArea.title}</h3>
                  <p>{careerArea.description}</p>
                </div>
                <strong aria-hidden="true">↗</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="training-callout">
        <div className="shell training-callout__inner">
          <div>
            <p className="eyebrow">Build useful skills</p>
            <h2>Learn with real conservation work in mind.</h2>
            <p>Explore WildTeam training connected to practical conservation work.</p>
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
