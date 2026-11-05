import { expect, it } from "vitest";
import { pilotGuides, guideCatalog, guidePath } from "../lib/guide-content";
import { SITE_URL } from "../lib/site-indexing";
import {
  guideBreadcrumbs,
  guideMetadata,
  guideStructuredData,
  guideHubMetadata,
  guideHubStructuredData,
  serializeStructuredData,
} from "../lib/guide-seo";
import sitemap from "../app/sitemap";
import { vi, afterEach } from "vitest";
const mocks = vi.hoisted(() => ({ index: vi.fn(), employers: vi.fn() }));
vi.mock("../lib/public-guides", () => ({ getReviewedGuideIndex: mocks.index }));
vi.mock("../lib/public-employer-profiles", () => ({ getPublishedEmployerIndex: mocks.employers }));
afterEach(() => vi.unstubAllEnvs());

it.each(guideCatalog)("gives $slug complete canonical sharing metadata", (guide) => {
  const metadata = guideMetadata({ guide, isDraft: true });
  expect(metadata.alternates?.canonical).toBe(guidePath(guide));
  expect(metadata.openGraph).toMatchObject({
    type: "article",
    url: SITE_URL + guidePath(guide),
    images: [{ url: `${SITE_URL}/guide-images/${guide.slug}`, width: 1200, height: 630 }],
  });
  expect(metadata.twitter).toMatchObject({
    card: "summary_large_image",
    images: [{ url: `${SITE_URL}/guide-images/${guide.slug}` }],
  });
  expect(metadata.description!.length).toBeLessThanOrEqual(160);
});

it.each(guideCatalog)(
  "keeps $slug structured data consistent with visible content and breadcrumbs",
  (guide) => {
    const graph = guideStructuredData({ guide, isDraft: true })["@graph"];
    expect(graph[0]).toMatchObject({
      "@type": "Article",
      headline: `${guide.title} ${guide.accent}`,
      description: guide.description,
      author: { "@type": "Organization", name: "WildTeam" },
      creativeWorkStatus: "Draft",
    });
    expect(graph[0]).not.toHaveProperty("datePublished");
    expect(graph[0]).not.toHaveProperty("dateModified");
    expect(graph[1]).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: guideBreadcrumbs(guide).map((crumb, i) => ({
        position: i + 1,
        name: crumb.name,
        item: SITE_URL + crumb.path,
      })),
    });
    expect(JSON.stringify(graph)).not.toContain('"@type":"JobPosting"');
  },
);

it("only describes a genuine editorial review date on a reviewed article", () => {
  const data = { guide: pilotGuides[0], isDraft: false, reviewedAt: "2026-11-03T12:00:00Z" };
  expect(guideStructuredData(data)["@graph"][0]).toMatchObject({
    dateModified: "2026-11-03T12:00:00.000Z",
    creativeWorkStatus: "Published",
  });
  expect(guideMetadata(data).openGraph).toMatchObject({ modifiedTime: "2026-11-03T12:00:00.000Z" });
  expect(guideStructuredData({ ...data, isDraft: true })["@graph"][0]).not.toHaveProperty("dateModified");
});

it("escapes script delimiters without changing the parsed structured data", () => {
  const data = { headline: '</script><script>alert("unsafe")</script>' };
  const json = serializeStructuredData(data);
  expect(json).not.toContain("<");
  expect(JSON.parse(json)).toEqual(data);
});

it("gives the hub sharing metadata and lists only reviewed guides in its schema", () => {
  expect(guideHubMetadata(false).openGraph).toMatchObject({
    type: "website",
    url: SITE_URL + "/conservation-career-guides",
  });
  expect(guideHubStructuredData([])["@graph"][0]).not.toHaveProperty("mainEntity");
  expect(guideHubStructuredData([pilotGuides[0]])["@graph"][0]).toMatchObject({
    mainEntity: {
      itemListElement: [{ name: "Wildlife Conservation", url: SITE_URL + guidePath(pilotGuides[0]) }],
    },
  });
});

it("exposes only reviewed guide routes in the production sitemap", async () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  mocks.index.mockResolvedValue([{ guide: pilotGuides[0], reviewedAt: "2026-11-03T12:00:00Z" }]);
  mocks.employers.mockResolvedValue([{ slug: "example-employer", researched_at: "2026-11-05T12:00:00Z" }]);
  const entries = await sitemap();
  expect(entries).toContainEqual({
    url: SITE_URL + guidePath(pilotGuides[0]),
    lastModified: "2026-11-03T12:00:00Z",
  });
  expect(entries.some(({ url }) => url.endsWith("/ecologist"))).toBe(false);
  expect(entries.some(({ url }) => url.endsWith("/conservation-career-guides"))).toBe(true);
  expect(entries).toContainEqual({
    url: SITE_URL + "/employers/example-employer",
    lastModified: "2026-11-05T12:00:00Z",
  });
  expect(entries.some(({ url }) => url.endsWith("/wildmere-nature-trust"))).toBe(false);
  mocks.index.mockResolvedValue([]);
  expect((await sitemap()).some(({ url }) => url.includes("/conservation-"))).toBe(false);
});
