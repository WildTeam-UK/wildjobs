import Image from "next/image";
import Link from "next/link";

const trainingBenefits = [
  {
    title: "Find opportunities made for you.",
    description: "Discover jobs matched to the training courses you’ve completed.",
  },
  {
    title: "Stand out from the crowd.",
    description: "Build practical skills and feel better prepared to land the role you really want.",
  },
  {
    title: "Turn your passion into progress.",
    description: "Take meaningful steps towards a career protecting the natural world.",
  },
] as const;

function TickIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.6 2.6L16.5 9" />
    </svg>
  );
}

export function JobTrainingPromo({ position }: { position: number }) {
  const headingId = `job-training-promo-title-${position}`;

  return (
    <aside className="job-training-promo" aria-labelledby={headingId}>
      <div className="job-training-promo__media">
        <Image
          alt="Conservation explorers overlooking wildlife in a pastel mountain landscape"
          fill
          sizes="(max-width: 720px) calc(100vw - 32px), 390px"
          src="/images/job-training-cta-pastel.jpg"
        />
      </div>
      <div className="job-training-promo__content">
        <div className="job-training-promo__intro">
          <h2 id={headingId}>Your dream job starts with the right skills.</h2>
          <p>
            Build your confidence, develop practical conservation skills and discover where your training
            could take you.
          </p>
        </div>
        <ul className="job-training-promo__benefits">
          {trainingBenefits.map((benefit) => (
            <li key={benefit.title}>
              <TickIcon />
              <div>
                <strong>{benefit.title}</strong>
                <span>{benefit.description}</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="job-training-promo__actions">
          <a
            className="action"
            href="https://training.wildteam.org.uk/courses"
            rel="noopener noreferrer"
            target="_blank"
          >
            Explore WildTeam Training
          </a>
          <Link className="action action--outline" href="/account">
            Connect your WildTeam Account
          </Link>
        </div>
      </div>
    </aside>
  );
}
