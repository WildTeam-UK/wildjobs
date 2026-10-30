import Link from "next/link";
import { EmployerLogo } from "@/components/employer-logo";
import type { PublicEmployer } from "@/lib/public-employer-mapper";

function Logo({ employer }: { employer: PublicEmployer }) {
  return (
    <EmployerLogo
      imageClassName="employer-logo-carousel__logo"
      logoUrl={employer.logoUrl}
      monogramClassName="employer-logo-carousel__monogram"
      name={employer.name}
    />
  );
}

export function EmployerLogoCarousel({ employers }: { employers: readonly PublicEmployer[] }) {
  const hiringEmployers = employers.filter((employer) => employer.openRoles.length > 0);
  if (!hiringEmployers.length) return null;

  const openRoleCount = hiringEmployers.reduce((total, employer) => total + employer.openRoles.length, 0);
  const organisationLabel = hiringEmployers.length === 1 ? "organisation is" : "organisations are";
  const conservationistLabel = openRoleCount === 1 ? "conservationist" : "conservationists";

  return (
    <section className="employer-logo-carousel" aria-labelledby="employer-logo-carousel-heading">
      <h2 className="wt-visually-hidden" id="employer-logo-carousel-heading">
        Organisations hiring conservationists
      </h2>
      <div className="employer-logo-carousel__viewport">
        <div className="employer-logo-carousel__track">
          <ul className="employer-logo-carousel__group">
            {hiringEmployers.map((employer) => (
              <li key={employer.slug}>
                <Link aria-label={`View jobs at ${employer.name}`} href={`/employers/${employer.slug}`}>
                  <Logo employer={employer} />
                </Link>
              </li>
            ))}
          </ul>
          <ul className="employer-logo-carousel__group" aria-hidden="true">
            {hiringEmployers.map((employer) => (
              <li key={employer.slug}>
                <Logo employer={employer} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="employer-logo-carousel__summary">
        <span>{hiringEmployers.length}</span> {organisationLabel} building their teams and hiring{" "}
        <span>{openRoleCount}</span> {conservationistLabel}
      </p>
    </section>
  );
}
