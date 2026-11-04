import Image from "next/image";
import { guidePhotography } from "@/lib/guide-photography";
import Link from "next/link";
import {
  CourseTiles,
  GuideContents,
  GuideSection,
  TrainingBanner,
  careerCourseUrl,
} from "@/components/templates/template-parts";
import { getGuideData } from "@/lib/public-guides";
import { guideJobsPath, guidePath, guideCatalog } from "@/lib/guide-content";
import { relatedGuideSlugs } from "@/lib/guide-sectors";
import { EditorialImageCredit } from "@/components/editorial-image-credit";
import { GuideOpportunities } from "./guide-opportunities";
import { GuideBreadcrumbs } from "./guide-breadcrumbs";
import { guideName, guideStructuredData, serializeStructuredData } from "@/lib/guide-seo";

type GuideData = Awaited<ReturnType<typeof getGuideData>>;
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const money = (value: number | null) =>
  value === null
    ? "More data needed"
    : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
        value,
      );
const levels: Record<string, string> = {
  "early-career": "Assistant and early career",
  senior: "Senior and leadership",
  unspecified: "Level not specified",
  experienced: "Experienced",
};

function MarketSnapshot({ data, detailed = false }: { data: GuideData; detailed?: boolean }) {
  const { guide, market } = data;
  if (detailed)
    return (
      <div className="guide-methodology">
        <h3>How we calculate the salary figures</h3>
        <p>
          Vacancy and employer counts cover all countries in the matching directory sample. The salary sample
          below is UK-only.
        </p>
        <p>
          UK vacancies posted between {date(market.start)} and {date(market.asOf)}, using the lowest annual
          GBP amount in each paid, full-time advert. We exclude pro rata pay, mixed-grade roles, hourly or
          other pay periods, and salaries without a confirmed currency. No currency conversion or
          annualisation is applied.
        </p>
        <p>
          These are advertised starting salaries, not employees’ earnings. Each vacancy counts once, even when
          it appears in multiple feeds. We only show a median when at least five comparable salaries are
          available. A full-time default on a job card is insufficient: we also require explicit full-time
          evidence in the feed or retained original advert. Check the source for the exact hours.
        </p>
        {guide.kind === "career" ? (
          <p>
            The headline median combines all qualifying adverts across career levels. The breakdown below
            separates those levels, with a median shown only when a band has at least five comparable
            salaries.
          </p>
        ) : null}
        {guide.kind === "career" ? (
          <table className="guide-salary-table">
            <caption>Advertised starting salaries by career level</caption>
            <thead>
              <tr>
                <th scope="col">Career level</th>
                <th scope="col">Salaries</th>
                <th scope="col">Median</th>
              </tr>
            </thead>
            <tbody>
              {market.salaryGroups.length ? (
                market.salaryGroups.map((group) => (
                  <tr key={group.level}>
                    <th scope="row">{levels[group.level]}</th>
                    <td>{group.count}</td>
                    <td>{money(group.median)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No comparable annual salaries recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <p>
            <strong>{money(market.salaryMedian)}</strong> from {market.salaryCount} comparable salaries across
            occupations and levels. This broad sector sample should not be used as the expected pay for one
            career.
          </p>
        )}
        <p>
          Directory collection began on 1 November 2026.{" "}
          {market.observedFrom
            ? `Matching adverts have been observed since ${date(market.observedFrom)}. `
            : ""}
          The twelve-month lookback is not twelve months of complete market coverage. These figures describe
          our collected sample and cannot establish demand, growth or a trend.
        </p>
        <p>Data checked {date(market.asOf)}. Live vacancies refresh independently of the written guide.</p>
        <a href="#guide-advert-sources">See the original adverts used</a>
      </div>
    );
  const items = [
    {
      label: "Median advertised starting salary",
      value: money(market.salaryMedian),
      detail: `${market.salaryCount} comparable UK annual salaries`,
    },
    {
      label: "Adverts in the past 12 months",
      value: String(market.history.length),
      detail: "Collected vacancies, not the whole market",
    },
    {
      label: "Opportunities open now",
      value: String(market.current.length),
      detail: "Current directory listings",
    },
    {
      label: "Employers in the sample",
      value: String(market.employers),
      detail: "Across the collected adverts",
    },
  ];
  return (
    <section className="tpl-stats" aria-label="Job-market snapshot">
      <div className="tpl-stats__caption">
        <span className="eyebrow">A snapshot of the opportunities</span>
        <span>Directory sample · Updated {date(market.asOf)}</span>
      </div>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className="tpl-stats__value">{item.value}</dd>
            <dd className="tpl-stats__detail">{item.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function GuidePage({ data }: { data: GuideData }) {
  const { guide, market } = data;
  const photo = guidePhotography[guide.slug];
  const related = relatedGuideSlugs[guide.slug].map((slug) => guideCatalog.find((g) => g.slug === slug)!);
  const seen = new Set<string>();
  const roleExamples = market.history
    .toSorted((a, b) => b.posted_at.localeCompare(a.posted_at))
    .filter((job) => {
      const title = job.title.trim().toLocaleLowerCase("en-GB");
      if (seen.has(title) || job.organisation_name === "Organisation not stated") return false;
      seen.add(title);
      return true;
    })
    .slice(0, 6);
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeStructuredData(guideStructuredData(data)) }}
      />
      <div className="shell">
        <GuideBreadcrumbs guide={guide} />
      </div>
      <section className="tpl-hero shell">
        <div className="tpl-hero__grid">
          <div>
            <p className="eyebrow">
              {guide.kind === "sector" ? "Conservation sector guide" : "Conservation career guide"}
            </p>
            <h1>
              {guide.title} <span className="tpl-gradient">{guide.accent}</span>
            </h1>
            <p className="tpl-hero__lead">{guide.description}</p>
            <div className="tpl-actions">
              <a className="action" href={`#${guide.sections[0].id}`}>
                Find your route in
              </a>
              <Link className="action action--outline" href={guideJobsPath(guide)}>
                Explore current jobs
              </Link>
            </div>
            {data.isDraft ? (
              <p className="guide-review-note">Guide preview · Awaiting editorial review</p>
            ) : (
              <p className="guide-review-note">
                Editorial review: <time dateTime={data.reviewedAt!}>{date(data.reviewedAt!)}</time> ·{" "}
                <a href="#guide-sources">Sources and methodology</a>
              </p>
            )}
          </div>
          <figure className="tpl-photo">
            <Image
              src={photo.image}
              alt={photo.imageAlt}
              width={1800}
              height={1200}
              sizes="(max-width: 800px) calc(100vw - 30px), (max-width: 1000px) 50vw, (max-width: 1288px) calc((100vw - 108px) * 0.5122), 605px"
              fetchPriority="high"
              preload
            />
            <EditorialImageCredit creatorName={photo.creatorName} sourceUrl={photo.sourceUrl} />
          </figure>
        </div>
      </section>
      <div className="shell">
        <MarketSnapshot data={data} />
      </div>
      <div className="shell tpl-editorial">
        <GuideContents
          items={[
            ...guide.sections.map((s) => ({ id: s.id, label: s.label })),
            { id: "guide-sources", label: "Sources and methodology" },
          ]}
        />
        <article className="tpl-article">
          {guide.sections.map((section, index) => (
            <GuideSection
              id={section.id}
              key={section.id}
              number={`${String(index + 1).padStart(2, "0")} · ${section.label}`}
              title={section.title}
            >
              {section.paragraphs.map((p, paragraphIndex) => (
                <p key={p.text}>
                  {p.text}
                  {p.sources.length ? (
                    <span className="guide-citations">
                      {" "}
                      {p.sources.map((id) => (
                        <a
                          key={id}
                          href={`#source-${id}`}
                          aria-label={`Source: ${guide.sources.find((s) => s.id === id)?.title}`}
                        >
                          [{guide.sources.findIndex((s) => s.id === id) + 1}]
                        </a>
                      ))}
                    </span>
                  ) : null}
                  {section.module === "jobs" && paragraphIndex === section.paragraphs.length - 1 ? (
                    <>
                      {" "}
                      <Link href={guideJobsPath(guide)}>Browse all matching jobs</Link>.
                    </>
                  ) : null}
                </p>
              ))}
              {section.cards ? (
                <div className="tpl-feature-grid">
                  {section.cards.map((card) => (
                    <div className="tpl-feature-card" key={card.title}>
                      <h3>{card.title}</h3>
                      <p>{card.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {section.bullets ? (
                <ul className="guide-practical-list">
                  {section.bullets.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <p>{item.text}</p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.faqs ? (
                <div className="tpl-faq">
                  {section.faqs.map((item) => (
                    <details key={item.title}>
                      <summary>{item.title}</summary>
                      <p>{item.text}</p>
                      {item.title === "Where should I start?" ? (
                        <p>
                          We believe our free{" "}
                          <a href={careerCourseUrl} target="_blank" rel="noopener noreferrer">
                            Launching Your Career in Conservation course
                          </a>{" "}
                          is a great place to start learning how to land your dream job in conservation.
                        </p>
                      ) : null}
                    </details>
                  ))}
                </div>
              ) : null}
              {section.module === "market" ? <MarketSnapshot data={data} detailed /> : null}
              {section.module === "roles" ? (
                roleExamples.length ? (
                  <ul className="guide-role-examples">
                    {roleExamples.map((job) => (
                      <li key={job.id}>
                        <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                          {job.title} · {job.organisation_name}
                        </a>
                        <p>Advert posted {date(job.posted_at)} · May now be closed</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No named-employer advert examples are available in this sample yet.</p>
                )
              ) : null}
              {section.module === "courses" ? (
                <>
                  <CourseTiles />
                  <p>
                    <Link href="/course-recommendations">Why we recommend these courses</Link>
                  </p>
                </>
              ) : null}
              {section.module === "career-course" ? (
                <TrainingBanner courseTheme={guide.kind === "sector" ? "green" : "brand"} />
              ) : null}
              {section.module === "jobs" ? <GuideOpportunities jobs={market.current} /> : null}
            </GuideSection>
          ))}
          <GuideSection
            id="guide-sources"
            number="Sources and methodology"
            title="What this guide is based on"
          >
            <p>
              Professional and careers guidance supports the factual descriptions linked in the text.
              Suggestions labelled as our approach are WildTeam guidance. Job adverts describe individual
              employers’ requirements, not universal rules for a career.
            </p>
            <p>
              The education and professional guidance in these guides is UK-focused. Routes and requirements
              can differ elsewhere; check local professional bodies, training providers and employers.
            </p>
            <ol className="tpl-source-list">
              {guide.sources.map((source) => (
                <li id={`source-${source.id}`} key={source.id}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title}
                  </a>
                  <p>
                    {source.supports}. Checked {date(source.checkedAt)}.
                  </p>
                </li>
              ))}
            </ol>
            <details id="guide-advert-sources" className="guide-advert-sources">
              <summary>Original job adverts in this sample ({market.history.length})</summary>
              <p>
                Links may expire after recruitment closes. Their inclusion records the sample; it does not
                mean they are still open.
              </p>
              <ul>
                {market.history.map((job) => (
                  <li key={job.id}>
                    <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                      {job.title} · {job.organisation_name}
                    </a>{" "}
                    · Posted {date(job.posted_at)}
                  </li>
                ))}
              </ul>
            </details>
            <p>
              Written guidance is versioned and reviewed separately from live figures.{" "}
              {data.reviewedAt
                ? `Last editorial review: ${date(data.reviewedAt)}.`
                : "This guide is awaiting editorial approval."}{" "}
              Sources are due for review within 90 days of their checked date, or sooner if relevant
              information changes.
            </p>
            <p>
              AI assists draft preparation and the organisation of advert evidence. WildTeam reviews sources
              and approves written guidance before publication. Preview guides have not yet completed that
              editorial approval. Live job counts and salary samples update independently of the written
              advice.
            </p>
            <p>
              <a href="https://training.wildteam.org.uk/contact-us" target="_blank" rel="noopener noreferrer">
                Suggest a correction
              </a>
            </p>
          </GuideSection>
        </article>
      </div>
      <div className="shell">
        <TrainingBanner membership />
        <div className="tpl-footer-links">
          {related.map((other) => (
            <Link key={other.slug} href={guidePath(other)}>
              Explore the {guideName(other)} {other.kind} guide
            </Link>
          ))}
          <Link href="/conservation-career-guides">All conservation guides</Link>
        </div>
      </div>
    </main>
  );
}
