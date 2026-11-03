import { expect, it, vi, afterEach } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import {
  guideCatalog,
  pilotGuides,
  sectorGuides,
  guideJobsPath,
  guidePath,
  validateGuideContent,
} from "../lib/guide-content";
import {
  guideSectorLabels,
  sectorGuideSlugs,
  guideSectorMatchSlug,
  relatedGuideSlugs,
} from "../lib/guide-sectors";
import { guideName } from "../lib/guide-seo";
import { generateStaticParams } from "../app/guide-images/[slug]/route";
vi.mock("server-only", () => ({}));
vi.mock("../lib/public-guides", () => ({
  getGuideData: vi.fn(async (slug: string) => ({
    guide: guideCatalog.find((g) => g.slug === slug),
    isDraft: true,
  })),
}));
import { generateMetadata } from "../app/(templates)/conservation-sector/[slug]/page";
afterEach(() => vi.unstubAllEnvs());

it("has one guide for every sector, with distinct URLs and no extra career families", () => {
  expect(sectorGuides.map((g) => g.slug).toSorted()).toEqual([...sectorGuideSlugs].toSorted());
  expect(new Set(guideCatalog.map(guidePath)).size).toBe(12);
  expect(guideCatalog.filter((g) => g.kind === "career")).toEqual([pilotGuides[1]]);
  expect(
    generateStaticParams()
      .map((g) => g.slug)
      .toSorted(),
  ).toEqual([...guideCatalog.map((g) => g.slug), "guides"].toSorted());
});
it.each(sectorGuides)("connects $slug to the right jobs, sources, image and review gate", async (guide) => {
  expect(validateGuideContent(guide)).toEqual(guide);
  if (guide.slug === "ecologist") throw new Error("Unexpected career");
  expect(guide.matchSlug).toBe(guideSectorMatchSlug(guide.slug));
  const query = new URL(guideJobsPath(guide), "https://example.test").searchParams;
  expect(query.get("sector")).toBe(guideSectorLabels[guide.slug]);
  expect(guideName(guide)).toBe(guideSectorLabels[guide.slug]);
  expect(guide.sources.length).toBeGreaterThanOrEqual(2);
  expect(guide.sections.some((s) => s.module === "market")).toBe(true);
  expect(guide.sections.some((s) => s.module === "jobs")).toBe(true);
  expect(existsSync(`public${guide.image}`)).toBe(true);
  for (const slug of relatedGuideSlugs[guide.slug])
    expect(guideCatalog.some((g) => g.slug === slug && g.slug !== guide.slug)).toBe(true);
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: guide.slug }) });
  expect(metadata.robots).toEqual({ index: false, follow: true });
  expect(metadata.alternates?.canonical).toBe(`/conservation-sector/${guide.slug}`);
});
it("allows exactly the application catalogue in the revision constraint", () => {
  const migration = readFileSync("supabase/migrations/20261103145359_remaining_sector_guides.sql", "utf8");
  const allowed = [...migration.matchAll(/'([a-z][a-z-]+)'/g)].map((m) => m[1]);
  expect(allowed.toSorted()).toEqual(guideCatalog.map((g) => g.slug).toSorted());
});
