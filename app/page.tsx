import { JobBrowser } from "@/components/job-browser";
import { jobs } from "@/lib/jobs";

export default function HomePage() {
  return (
    <main>
      <section className="jobs-hero">
        <div className="shell jobs-hero__grid">
          <div>
            <p className="eyebrow">Conservation careers</p>
            <h1>Find work that moves nature forward.</h1>
          </div>
          <div className="jobs-hero__intro">
            <p>
              Explore clearly presented opportunities across conservation, ecology, restoration and
              environmental practice.
            </p>
            <a href="#available-jobs-heading">
              Browse demonstration jobs <span aria-hidden="true">↓</span>
            </a>
          </div>
        </div>
      </section>

      <aside className="fixture-notice">
        <div className="shell">
          <strong>Prototype content:</strong> These roles are fictional and cannot be applied for. They are
          included to test the WildJobs experience safely.
        </div>
      </aside>

      <JobBrowser jobs={jobs} />

      <section className="training-callout">
        <div className="shell training-callout__inner">
          <div>
            <p className="eyebrow">Build your conservation career</p>
            <h2>Turn your ambition into practical skills.</h2>
            <p>
              Explore accessible WildTeam training designed for people delivering conservation work around the
              world.
            </p>
          </div>
          <a href="https://training.wildteam.org.uk/courses" target="_blank" rel="noopener noreferrer">
            Explore WildTeam training <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    </main>
  );
}
