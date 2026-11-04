import type { Metadata } from "next";
import Image from "next/image";
import { FittedCareerGrid } from "@/components/fitted-career-grid";
import Link from "next/link";
import styles from "./page.module.css";
import { getReviewedGuideIndex } from "@/lib/public-guides";
import { guideHubMetadata, guideHubStructuredData, serializeStructuredData } from "@/lib/guide-seo";
import { guideSectorLabels, sectorGuideSlugs } from "@/lib/guide-sectors";
import { GuideBreadcrumbs } from "@/components/guides/guide-breadcrumbs";
import { careerGuides, guidePath } from "@/lib/guide-content";
import { guideName } from "@/lib/guide-seo";

export async function generateMetadata(): Promise<Metadata> {
  return guideHubMetadata(!(await getReviewedGuideIndex()).length);
}

const sectors = sectorGuideSlugs.map((slug) => ({
  title: guideSectorLabels[slug],
  slug,
  href: `/conservation-sector/${slug}`,
}));

const careers: readonly { title: string; description: string; href?: string }[] = [
  ...careerGuides.map((guide) => ({
    title: guideName(guide),
    description: guide.description,
    href: guidePath(guide),
  })),
  {
    title: "Conservation Officer",
    description: "Turn plans for wildlife and habitats into practical conservation action.",
  },
  { title: "Ranger", description: "Care for wild places and help people connect with nature." },
  { title: "Marine Biologist", description: "Understand ocean life and help protect our marine ecosystems." },
  {
    title: "Fundraising Officer",
    description: "Build support and secure funding to make conservation work possible.",
  },
  {
    title: "Sustainability Consultant",
    description: "Help organisations reduce their impact and make more sustainable choices.",
  },
];

export default async function CareerGuidesPage() {
  const reviewed = await getReviewedGuideIndex();
  const reviewedPaths = new Set(reviewed.map(({ guide }) => guidePath(guide)));
  return (
    <main className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeStructuredData(guideHubStructuredData(reviewed.map(({ guide }) => guide))),
        }}
      />
      <div className="shell">
        <GuideBreadcrumbs />
      </div>
      <section className={"shell " + styles.section} aria-labelledby="sector-guides-title">
        <div className={styles.intro}>
          <h1 id="sector-guides-title">
            Explore our <span className="tpl-gradient">conservation sector guides</span>
          </h1>
          <p>
            Start with the bigger picture. Our sector guides bring together the purpose of each area of
            conservation, the work happening within it and the people and skills it needs. Explore the roles,
            routes into the sector and useful training, so you can understand where your interests and
            experience could make a difference before deciding on your next step.
          </p>
        </div>
        <div className={styles.sectorGrid}>
          {sectors.map((sector, index) => {
            return (
              <article className={styles.sectorTile} key={sector.slug}>
                <figure className={styles.imageFrame}>
                  <Link href={sector.href} aria-label={`${sector.title} sector guide`}>
                    <Image
                      className={styles.sectorImage}
                      src={`/images/sectors/${sector.slug}.png`}
                      alt=""
                      width={500}
                      height={500}
                      sizes="(max-width: 1000px) 50vw, 25vw"
                      preload={index < 4}
                    />
                  </Link>
                </figure>
                <h2>
                  <Link href={sector.href}>{sector.title}</Link>
                </h2>
              </article>
            );
          })}
        </div>
      </section>
      <section
        className={"shell " + styles.section + " " + styles.careerSection}
        aria-labelledby="career-guides-title"
      >
        <div className={styles.intro}>
          <h2 id="career-guides-title">
            Explore our <span className="tpl-gradient">conservation career guides</span>
          </h2>
          <p>
            Get to know the career behind the job title. Our career guides explain what the work looks like
            day to day, the skills and experience employers look for, and the different ways to get started.
            With practical advice on qualifications, gaining experience, salaries and progression, they help
            you compare your options, spot the gaps you want to work on and build a clearer plan for the
            career you want.
          </p>
        </div>
        <FittedCareerGrid className={styles.careerGrid}>
          {careers.map((career) => {
            const content = (
              <>
                <div className={styles.cardBody}>
                  <span className={styles.cardLabel}>CAREER GUIDE</span>
                  <h3>{career.title}</h3>
                  <div className={styles.descriptionFrame} data-career-description-frame>
                    <p data-career-description>{career.description}</p>
                  </div>
                </div>
                <span className={styles.cardFooter}>
                  {career.href
                    ? reviewedPaths.has(career.href)
                      ? "READ THE GUIDE"
                      : "GUIDE PREVIEW"
                    : "GUIDE COMING SOON"}
                </span>
              </>
            );
            return career.href ? (
              <Link
                className={styles.careerCard + " " + styles.linkedCareer}
                href={career.href}
                key={career.title}
              >
                {content}
              </Link>
            ) : (
              <article className={styles.careerCard} key={career.title}>
                {content}
              </article>
            );
          })}
        </FittedCareerGrid>
      </section>
    </main>
  );
}
