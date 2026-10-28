import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Explore conservation careers" };

const paths = [
  [
    "Science and evidence",
    "Ecology, research, data and monitoring roles that turn observation into better decisions.",
    "Science and research",
  ],
  [
    "Projects and programmes",
    "Roles that transform conservation ambition into organised, funded and measurable action.",
    "Programme management",
  ],
  [
    "People and partnerships",
    "Community, stakeholder and engagement roles built around durable relationships.",
    "Community conservation",
  ],
  [
    "Stories and support",
    "Communications and fundraising work that helps conservation reach more people.",
    "Communications",
  ],
] as const;

export default function CareersPage() {
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
              This is the first design pass for practical career guidance. Rich pathway pages will follow.
            </p>
          </div>
          <div className="pathway-grid">
            {paths.map(([title, description, category], index) => (
              <Link href={`/jobs?category=${encodeURIComponent(category)}`} key={title}>
                <span>0{index + 1}</span>
                <h2>{title}</h2>
                <p>{description}</p>
                <strong>See related roles →</strong>
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
