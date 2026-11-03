import { EmployerLogo } from "@/components/employer-logo";
import { JobFactIcon } from "@/components/job-card";
import { compactJobLocation, postedAgoLabel } from "@/lib/jobs";
import { formatSalaryLabel } from "@/lib/job-salary";
import { getPublicJobsByIds } from "@/lib/public-jobs";
import type { GuideJob } from "@/lib/guide-market";

export async function GuideOpportunities({ jobs }: { jobs: readonly GuideJob[] }) {
  const ids = jobs
    .toSorted((a, b) => b.posted_at.localeCompare(a.posted_at) || a.id - b.id)
    .slice(0, 3)
    .map((job) => job.id);
  const opportunities = await getPublicJobsByIds(ids);

  if (!opportunities.length)
    return <p>No matching roles are open in the directory right now. Check back for new opportunities.</p>;

  return (
    <div className="guide-opportunities">
      {opportunities.map((job) => (
        <article className="guide-job" key={job.id}>
          <header className="guide-job__header">
            <EmployerLogo
              imageClassName="guide-job__logo"
              monogramClassName="guide-job__monogram"
              logoUrl={job.employerLogoUrl}
              name={job.organisation}
            />
            <div>
              <h3>{job.title}</h3>
              <p className="guide-job__organisation">{job.organisation}</p>
            </div>
          </header>
          <dl className="guide-job__facts">
            {(
              [
                { icon: "salary", label: "Salary", value: formatSalaryLabel(job.salary) },
                { icon: "location", label: "Location", value: compactJobLocation(job) },
              ] as const
            ).map((fact) => (
              <div key={fact.icon}>
                <dt>
                  <JobFactIcon type={fact.icon} />
                  <span className="wt-visually-hidden">{fact.label}</span>
                </dt>
                <dd className="icon-label">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <footer className="guide-job__footer">
            <a
              className="action"
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Apply via ${job.sourceName}: ${job.title}`}
            >
              Apply via {job.sourceName}
            </a>
            <p>{postedAgoLabel(job.publishedAt ?? job.postedAt)}</p>
          </footer>
        </article>
      ))}
    </div>
  );
}
