import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JobCard } from "@/components/job-card";
import { RelatedGuides } from "@/components/guides/related-guides";
import { EmployerProfileHero } from "@/components/templates/employer-profile-hero";
import { ExampleStats, TrainingBanner } from "@/components/templates/template-parts";
import { guidePhotography } from "@/lib/guide-photography";
import { guideName } from "@/lib/guide-seo";
import { getEmployerProfileMarket } from "@/lib/employer-profile-market";
import { formatDate } from "@/lib/jobs";
import { getPublicEmployerPage } from "@/lib/public-employer-profiles";
import { getPublicJobs } from "@/lib/public-jobs";
import { SITE_URL, siteIndexingEnabled } from "@/lib/site-indexing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicEmployerPage((await params).slug);
  if (!profile) return { robots: { index: false, follow: false } };
  const index = siteIndexingEnabled();
  return {
    title: `${profile.name} employer profile`,
    description:
      profile.content?.claims.find((item) => item.kind === "overview")?.text ??
      `Explore current jobs at ${profile.name} on WildJobs`,
    alternates: { canonical: `${SITE_URL}/employers/${profile.slug}` },
    robots: { index: index && Boolean(profile.content), follow: index },
  };
}

export default async function EmployerPage({ params }: Props) {
  const requestedSlug = (await params).slug;
  const profile = await getPublicEmployerPage(requestedSlug);
  if (!profile) notFound();
  if (profile.slug !== requestedSlug) permanentRedirect(`/employers/${profile.slug}`);
  const jobs = await getPublicJobs(profile.name);
  const market = await getEmployerProfileMarket(profile.name, jobs);
  const photo = market.sectors[0] ? guidePhotography[market.sectors[0]] : undefined;
  const overview = profile.content?.claims.filter((claim) => claim.kind !== "careers") ?? [];
  const careers = profile.content?.claims.filter((claim) => claim.kind === "careers") ?? [];
  const stats: { value: string; label: string; detail?: string }[] = [
    { value: String(jobs.length), label: "Current vacancies", detail: "Live on WildJobs" },
    {
      value: String(market.adverts),
      label: "Vacancies observed in the past year",
      detail: "Unique adverts seen by WildJobs",
    },
  ];
  if (market.salary?.median != null) {
    stats.push({
      value: new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      }).format(market.salary.median),
      label: "Median advertised annual salary minimum",
      detail: `${market.salary.count} comparable UK full-time adverts · ${guideName(market.salary.role)} · ${market.salary.level}`,
    });
  }

  const showClaims = (claims: typeof overview) =>
    claims.map((claim) => (
      <p key={claim.text}>
        {claim.text}{" "}
        <a
          className="tpl-text-link tpl-employer-source"
          href={claim.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {claim.sourceTitle}
        </a>
      </p>
    ));

  return (
    <main>
      <EmployerProfileHero
        name={profile.name}
        website={profile.website_url}
        logo={profile.logo_url}
        roles={jobs.length}
        categories={market.sectors}
        photo={photo}
      />
      <div className="shell">
        <nav className="tpl-profile-nav" aria-label="Employer profile sections">
          <a href="#about">About the organisation</a>
          {careers.length ? <a href="#working-here">Before you apply</a> : null}
          <a href="#hiring-history">Hiring snapshot</a>
          <a href="#jobs">Current jobs</a>
        </nav>
      </div>
      <section className="shell tpl-employer-grid" id="about">
        <div>
          <p className="eyebrow">The organisation</p>
          <h2>About {profile.name}</h2>
          {showClaims(overview)}
          {!profile.content ? (
            <p>
              Explore vacancies advertised by {profile.name}. Role details and application instructions are
              linked from each job below.
            </p>
          ) : null}
        </div>
        <aside className="tpl-employer-facts">
          <h3>About this profile</h3>
          {profile.content ? (
            <p>
              WildJobs used AI to summarise the employer’s official sources. Source links accompany each
              claim.
            </p>
          ) : (
            <p>This page brings together this employer’s vacancies and hiring observations on WildJobs.</p>
          )}
          {profile.researchedAt ? (
            <p>
              Sources checked on{" "}
              <time dateTime={profile.researchedAt}>{formatDate(profile.researchedAt)}</time>.
            </p>
          ) : null}
          <Link className="tpl-text-link" href="/employers">
            Browse employers
          </Link>
        </aside>
      </section>
      {careers.length ? (
        <section className="tpl-wide-section tpl-wide-section--white" id="working-here">
          <div className="shell">
            <div className="tpl-section-heading">
              <h2>What to know before applying</h2>
            </div>
            <div className="tpl-employer-claims">{showClaims(careers)}</div>
          </div>
        </section>
      ) : null}
      <section className="shell tpl-wide-section" id="hiring-history">
        <div className="tpl-section-heading">
          <h2>Hiring snapshot</h2>
        </div>
        <ExampleStats
          items={stats}
          note={
            market.coverageFrom
              ? `WildJobs observations since ${formatDate(market.coverageFrom)}`
              : "WildJobs observations"
          }
        />
        <p className="tpl-small">
          These figures describe adverts WildJobs has seen. The employer may also advertise elsewhere.
        </p>
      </section>
      <section className="tpl-wide-section tpl-wide-section--white" id="jobs">
        <div className="shell">
          <div className="tpl-section-heading">
            <div>
              <p className="eyebrow">Make your next move</p>
              <h2>Current jobs at {profile.name}</h2>
            </div>
            {jobs.length ? (
              <span className="tpl-hiring-pill">
                {jobs.length} {jobs.length === 1 ? "opportunity" : "opportunities"}
              </span>
            ) : null}
          </div>
          {jobs.length ? (
            <div className="job-list">
              {jobs.map((job) => (
                <JobCard compact headingLevel={3} job={job} key={job.slug} />
              ))}
            </div>
          ) : (
            <p>
              No current vacancies on WildJobs.{" "}
              <Link className="tpl-text-link" href="/">
                Browse all current jobs
              </Link>
            </p>
          )}
        </div>
      </section>
      <div className="shell">
        <TrainingBanner />
        <RelatedGuides guides={market.guides} />
      </div>
    </main>
  );
}
