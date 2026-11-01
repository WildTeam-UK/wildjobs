import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import type { PublicEmployer } from "@/lib/public-employer-mapper";

function EmployerFactIcon({ type }: { type: "location" | "roles" }) {
  if (type === "location") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect height="13" rx="2" width="18" x="3" y="7" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}

function employerLocation(locations: readonly string[]) {
  if (!locations.length) return "Location not stated";
  if (locations.length === 1) return locations[0];
  return `${locations[0]} + ${locations.length - 1} more`;
}

export function EmployerCard({ employer }: { employer: PublicEmployer }) {
  const openRoles = employer.openRoles.length;
  const topics = [
    employer.focus,
    ...employer.openRoles.flatMap((job) => [job.category, ...(job.careerAreas ?? [])]),
  ].filter((topic, index, values) => topic && values.indexOf(topic) === index);
  const description = employer.overview[0] ?? employer.mission;

  return (
    <Link
      aria-label={`View ${employer.name}`}
      className="employer-directory-card"
      href={`/employers/${employer.slug}`}
    >
      <article>
        <header className="employer-directory-card__header">
          <EmployerLogo
            imageClassName="employer-logo"
            logoUrl={employer.logoUrl}
            monogramClassName="employer-monogram"
            name={employer.name}
          />
          {openRoles ? (
            <span className="employer-directory-card__status">
              <span>Hiring now!</span>
            </span>
          ) : null}
        </header>
        <div className="employer-directory-card__body">
          <h3>{employer.name}</h3>
          <p className="employer-directory-card__summary">{description}</p>
          {employer.profileStatus === "ai-assisted" ? (
            <p className="employer-directory-card__provenance">AI-assisted profile</p>
          ) : employer.profileStatus === "reviewed" ? (
            <p className="employer-directory-card__provenance employer-directory-card__provenance--reviewed">
              WildJobs reviewed
            </p>
          ) : null}
        </div>
        <ul className="employer-directory-card__facts">
          <li>
            <EmployerFactIcon type="location" />
            <span>{employerLocation(employer.locations)}</span>
          </li>
          <li>
            <EmployerFactIcon type="roles" />
            <span>
              {openRoles} live {openRoles === 1 ? "role" : "roles"}
            </span>
          </li>
        </ul>
        <div className="employer-directory-card__topics" aria-label="Organisation topics">
          {topics.map((topic) => (
            <span key={topic}>{topic}</span>
          ))}
        </div>
      </article>
    </Link>
  );
}
