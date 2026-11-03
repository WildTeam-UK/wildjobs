import type { Metadata } from "next";
import type { GuideContent } from "./guide-content";
import { guidePath } from "./guide-content";
import { guideSectorLabels } from "./guide-sectors";
import { guideRobots } from "./guide-indexing";
import { SITE_URL } from "./site-indexing";
import { careerRoleLabels, isCareerRoleSlug } from "./career-role-catalog";

export const guideHubPath = "/conservation-career-guides";
export const guideImageSize = { width: 1200, height: 630 };
export const guidePublisher = { name: "WildTeam", url: "https://www.wildteam.org.uk/" };
const copy = {
  "wildlife-conservation": {
    title: "Wildlife conservation careers: jobs, skills & salaries",
    description:
      "Explore wildlife conservation careers, roles, entry routes and skills. Compare UK advertised salaries, find current jobs and plan your next step.",
    imageTitle: "Wildlife conservation careers",
    imageSubtitle: "Jobs, skills, routes in and salary insights",
  },
  ecologist: {
    title: "How to become an ecologist: salary, skills & routes",
    description:
      "Explore how to become an ecologist in the UK: qualifications, practical skills, career routes and advertised salaries, with current ecology jobs.",
    imageTitle: "Become an ecologist",
    imageSubtitle: "Salary, skills, qualifications and routes in",
  },
} as const;

export function guideSeoCopy(guide: Pick<GuideContent, "slug">) {
  if (guide.slug === "ecologist" || guide.slug === "wildlife-conservation") return copy[guide.slug];
  if (isCareerRoleSlug(guide.slug)) {
    const name = careerRoleLabels[guide.slug].toLowerCase();
    const article = /^[aeiou]/.test(name) ? "an" : "a";
    return {
      title: `How to become ${article} ${name}: skills & salary`,
      description: `Explore ${name} careers in conservation: duties, skills, entry routes and advertised UK salaries. Compare the evidence and find current jobs.`,
      imageTitle: `Become ${article} ${name}`,
      imageSubtitle: "Salary, skills, experience and routes in",
    };
  }
  const name = guideSectorLabels[guide.slug];
  return {
    title: `${name} careers: jobs & skills`,
    description: `Explore ${name.toLowerCase()} careers, entry routes and skills. Compare advertised UK salaries and browse current jobs.`,
    imageTitle: `${name} careers`,
    imageSubtitle: "Jobs, skills, routes in and salary insights",
  };
}
export function guideImagePath(slug: GuideContent["slug"] | "guides") {
  return `/guide-images/${slug}`;
}
export function guideName(guide: GuideContent) {
  return guide.kind === "career"
    ? guide.accent.charAt(0).toUpperCase() + guide.accent.slice(1)
    : isCareerRoleSlug(guide.slug)
      ? `${guide.title} ${guide.accent}`
      : guideSectorLabels[guide.slug];
}
export function guideBreadcrumbs(guide?: GuideContent) {
  return [
    { name: "Jobs", path: "/" },
    { name: "Conservation career guides", path: guideHubPath },
    ...(guide ? [{ name: guideName(guide), path: guidePath(guide) }] : []),
  ];
}

export function guideMetadata({
  guide,
  isDraft,
  reviewedAt,
}: {
  guide: GuideContent;
  isDraft: boolean;
  reviewedAt?: string | null;
}): Metadata {
  const seo = guideSeoCopy(guide),
    url = `${SITE_URL}${guidePath(guide)}`;
  const image = {
    url: `${SITE_URL}${guideImagePath(guide.slug)}`,
    ...guideImageSize,
    alt: `${guideName(guide)} · WildJobs ${guide.kind} guide`,
  };
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: guidePath(guide) },
    robots: guideRobots(isDraft),
    openGraph: {
      type: "article",
      siteName: "WildJobs",
      locale: "en_GB",
      url,
      title: `${seo.title} | WildJobs`,
      description: seo.description,
      images: [image],
      authors: [guidePublisher.url],
      ...(reviewedAt && !isDraft ? { modifiedTime: new Date(reviewedAt).toISOString() } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${seo.title} | WildJobs`,
      description: seo.description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

export function guideHubMetadata(isDraft: boolean): Metadata {
  const title = "Conservation sector and career guides",
    description =
      "Explore conservation sectors and careers, compare roles, skills and advertised salaries, and find practical routes into conservation work.";
  const image = {
    url: `${SITE_URL}${guideImagePath("guides")}`,
    ...guideImageSize,
    alt: "Conservation career guides · WildJobs",
  };
  return {
    title,
    description,
    alternates: { canonical: guideHubPath },
    robots: guideRobots(isDraft),
    openGraph: {
      type: "website",
      title: `${title} | WildJobs`,
      description,
      siteName: "WildJobs",
      locale: "en_GB",
      url: `${SITE_URL}${guideHubPath}`,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | WildJobs`,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

function breadcrumbSchema(guide?: GuideContent) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${guide ? guidePath(guide) : guideHubPath}#breadcrumbs`,
    itemListElement: guideBreadcrumbs(guide).map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

export function guideStructuredData({
  guide,
  isDraft,
  reviewedAt,
}: {
  guide: GuideContent;
  isDraft: boolean;
  reviewedAt?: string | null;
}) {
  const url = `${SITE_URL}${guidePath(guide)}`;
  const organization = {
    "@type": "Organization",
    "@id": `${guidePublisher.url}#organization`,
    ...guidePublisher,
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: `${guide.title} ${guide.accent}`,
        description: guide.description,
        inLanguage: "en-GB",
        articleSection: guide.kind === "career" ? "Conservation careers" : "Conservation sectors",
        image: [`${SITE_URL}${guide.image}`],
        author: organization,
        publisher: { ...organization, logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` } },
        creativeWorkStatus: isDraft ? "Draft" : "Published",
        ...(reviewedAt && !isDraft ? { dateModified: new Date(reviewedAt).toISOString() } : {}),
        citation: guide.sources.map((source) => ({
          "@type": "CreativeWork",
          name: source.title,
          url: source.url,
        })),
      },
      breadcrumbSchema(guide),
    ],
  };
}

export function guideHubStructuredData(published: readonly GuideContent[]) {
  const url = `${SITE_URL}${guideHubPath}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: "Conservation sector and career guides",
        inLanguage: "en-GB",
        ...(published.length
          ? {
              mainEntity: {
                "@type": "ItemList",
                itemListElement: published.map((guide, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: guideName(guide),
                  url: `${SITE_URL}${guidePath(guide)}`,
                })),
              },
            }
          : {}),
      },
      breadcrumbSchema(),
    ],
  };
}

export function serializeStructuredData(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
