import { renderToStaticMarkup } from "react-dom/server";
import { parseHTML } from "linkedom";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ data: vi.fn(), index: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/public-guides", () => ({ getGuideData: mocks.data, getReviewedGuideIndex: mocks.index }));
vi.mock("../components/guides/guide-page", () => ({ GuidePage: () => null }));
import { generateMetadata as careerMetadata } from "../app/(templates)/conservation-career-guides/[slug]/page";
import { generateMetadata as sectorMetadata } from "../app/(templates)/conservation-sector/[slug]/page";
import CareerGuidesPage, {
  generateMetadata as hubMetadata,
} from "../app/(templates)/conservation-career-guides/page";
import { guideCatalog, guidePath, pilotGuides } from "../lib/guide-content";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it.each([
  { draft: true, environment: "production", enabled: "true", index: false },
  { draft: false, environment: "production", enabled: "true", index: true },
  { draft: false, environment: "preview", enabled: "true", index: false },
  { draft: false, environment: "production", enabled: "false", index: false },
])(
  "explicitly sets guide indexing for $environment, draft=$draft and indexing=$enabled",
  async ({ draft, environment, enabled, index }) => {
    vi.stubEnv("VERCEL_ENV", environment);
    vi.stubEnv("SITE_INDEXING_ENABLED", enabled);
    mocks.data.mockImplementation(async (slug: string) => ({
      guide: pilotGuides.find((g) => g.slug === slug),
      isDraft: draft,
    }));
    mocks.index.mockResolvedValue(
      draft ? [] : [{ guide: pilotGuides[0], reviewedAt: "2026-11-03T12:00:00Z" }],
    );
    for (const [generate, slug, path] of [
      [careerMetadata, "ecologist", "/conservation-career-guides/ecologist"],
      [sectorMetadata, "wildlife-conservation", "/conservation-sector/wildlife-conservation"],
    ] as const) {
      const metadata = await generate({ params: Promise.resolve({ slug }) });
      expect(metadata.robots).toEqual({ index, follow: true });
      expect(metadata.alternates?.canonical).toBe(path);
    }
    expect((await hubMetadata()).robots).toEqual({ index, follow: true });
  },
);
it("makes the guide hub indexable when its first reviewed guide is published", async () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  mocks.data.mockImplementation(async (slug: string) => ({
    guide: pilotGuides.find((g) => g.slug === slug),
    isDraft: slug !== "ecologist",
  }));
  mocks.index.mockResolvedValue([{ guide: pilotGuides[1], reviewedAt: "2026-11-03T12:00:00Z" }]);
  expect((await hubMetadata()).robots).toEqual({ index: true, follow: true });
});

it("lists only published guides and includes a newly published guide on the next request", async () => {
  const published = guideCatalog.filter((guide) =>
    ["ecologist", "wildlife-conservation"].includes(guide.slug),
  );
  mocks.index.mockResolvedValue(published.map((guide) => ({ guide, reviewedAt: "2026-11-10T12:00:00Z" })));
  const initial = renderToStaticMarkup(await CareerGuidesPage());
  const initialDocument = parseHTML(initial).document;
  expect(initialDocument.getElementById("sector-guides-title")?.textContent).toBe(
    "Explore our conservation sector guides 1",
  );
  expect(initialDocument.getElementById("career-guides-title")?.textContent).toBe(
    "Explore our conservation career guides 1",
  );
  expect(initial).not.toContain("published guides:");
  for (const guide of published) expect(initial).toContain(`href="${guidePath(guide)}"`);
  for (const guide of guideCatalog.filter((guide) => !published.includes(guide))) {
    expect(initial).not.toContain(`href="${guidePath(guide)}"`);
  }
  expect(initial).not.toMatch(/GUIDE COMING SOON|GUIDE PREVIEW/);
  mocks.index.mockResolvedValue(guideCatalog.map((guide) => ({ guide, reviewedAt: "2026-11-10T12:00:00Z" })));
  const updated = renderToStaticMarkup(await CareerGuidesPage());
  const updatedDocument = parseHTML(updated).document;
  expect(updatedDocument.getElementById("sector-guides-title")?.textContent).toBe(
    "Explore our conservation sector guides 11",
  );
  expect(updatedDocument.getElementById("career-guides-title")?.textContent).toBe(
    "Explore our conservation career guides 6",
  );
  for (const guide of guideCatalog) expect(updated).toContain(`href="${guidePath(guide)}"`);
});
