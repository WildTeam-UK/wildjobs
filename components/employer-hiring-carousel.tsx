import { EmployerCard } from "@/components/employer-card";
import type { PublicEmployer } from "@/lib/public-employer-mapper";

export function EmployerHiringCarousel({ employers }: { employers: readonly PublicEmployer[] }) {
  const hiringEmployers = employers.filter((employer) => employer.openRoles.length > 0);
  if (!hiringEmployers.length) return null;

  return (
    <section className="employer-hiring-carousel" aria-labelledby="employer-hiring-heading">
      <div className="shell">
        <h2 id="employer-hiring-heading">Organisations hiring now</h2>
        <div className="employer-hiring-carousel__track" aria-label="Organisations currently hiring">
          {hiringEmployers.map((employer) => (
            <EmployerCard employer={employer} key={employer.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
