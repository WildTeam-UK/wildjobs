import Link from "next/link";
import { JobCard } from "@/components/job-card";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import { courses } from "@/lib/courses";
import { getPublicJobs } from "@/lib/public-jobs";

const collections = [
  [
    "01",
    "Early-career roles",
    "Internships and accessible first steps for building practical conservation experience.",
    "/jobs?category=Early+careers",
  ],
  [
    "02",
    "Remote and hybrid",
    "Flexible roles that make conservation careers possible from more places.",
    "/jobs?location=Remote",
  ],
  ["03", "Closing soon", "A timely shortlist for opportunities that deserve your attention now.", "/jobs"],
] as const;

const careerAreas = [
  ["Project delivery", "Plan, coordinate and strengthen conservation programmes.", "Programme management"],
  ["Science and evidence", "Use fieldwork, monitoring and data to guide action.", "Science and research"],
  [
    "People and communities",
    "Build participation, partnerships and lasting local change.",
    "Community conservation",
  ],
  ["Communications", "Turn conservation evidence into stories that move people.", "Communications"],
] as const;

export default async function HomePage() {
  const [jobs, candidateSaveState] = await Promise.all([getPublicJobs(), getCandidateSaveState()]);
  const savedJobIds = new Set(candidateSaveState.savedJobIds);

  return (
    <main>
      <section className="home-hero">
        <div className="shell home-hero__grid">
          <div>
            <p className="eyebrow">Conservation careers, made clearer</p>
            <h1>Find the work that nature needs.</h1>
          </div>
          <div className="home-hero__search">
            <p>
              Discover credible roles, understand where you could fit and turn your experience into impact.
            </p>
            <form action="/jobs" className="hero-search">
              <label htmlFor="home-job-search">Search jobs</label>
              <div>
                <input
                  id="home-job-search"
                  name="q"
                  placeholder="Role, skill or organisation"
                  type="search"
                />
                <button type="submit" aria-label="Search jobs">
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </form>
            <Link className="home-hero__all-link" href="/jobs">
              Browse all opportunities <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Start somewhere useful</p>
              <h2>Explore opportunities your way.</h2>
            </div>
            <p>
              You do not need the perfect job title in mind. Begin with the kind of opportunity that fits now.
            </p>
          </div>
          <div className="collection-grid">
            {collections.map(([number, title, description, href]) => (
              <Link className="collection-card" href={href} key={title}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <strong aria-hidden="true">→</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section--cream">
        <div className="shell">
          <div className="section-heading section-heading--with-link">
            <div>
              <p className="eyebrow">Recently added</p>
              <h2>Opportunities worth a closer look.</h2>
            </div>
            <Link className="text-link" href="/jobs">
              View all jobs <span aria-hidden="true">→</span>
            </Link>
          </div>
          {jobs.length ? (
            <div className="featured-jobs">
              {jobs.slice(0, 3).map((job) => (
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
            <div className="empty-state">
              <h3>No current vacancies yet.</h3>
              <p>New conservation opportunities will appear here as soon as they are published.</p>
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="shell career-area-layout">
          <div className="section-heading">
            <p className="eyebrow">Explore careers</p>
            <h2>There is more than one way to make a difference.</h2>
            <p>See where your skills could take you across conservation.</p>
            <Link className="action" href="/careers">
              Explore career paths <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="career-area-list">
            {careerAreas.map(([title, description, category], index) => (
              <Link href={`/jobs?category=${encodeURIComponent(category)}`} key={title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <strong aria-hidden="true">↗</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="course-discovery">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Turn learning into possibilities</p>
              <h2>Find roles related to your WildTeam training.</h2>
            </div>
            <p>
              Explore jobs connected to the capabilities each course covers. No training account connection is
              needed.
            </p>
          </div>
          <div className="course-grid">
            {courses.slice(0, 3).map((course) => (
              <Link className="course-card" href={`/jobs?course=${course.slug}`} key={course.slug}>
                <p className="eyebrow">Related opportunities</p>
                <h3>{course.title}</h3>
                <p>{course.summary}</p>
                <span>See matching roles →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="employer-callout">
        <div className="shell employer-callout__inner">
          <div>
            <p className="eyebrow">Recruiting for conservation?</p>
            <h2>Help the right people understand why your role matters.</h2>
          </div>
          <div>
            <p>
              WildJobs is being built around transparent listings, useful context and a carefully reviewed
              process.
            </p>
            <Link className="action action--white" href="/for-employers">
              For employers <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
