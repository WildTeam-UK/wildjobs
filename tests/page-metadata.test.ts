import type { Metadata } from "next";
import { afterEach, expect, it, vi } from "vitest";
import { pageMetadata, siteShareImage } from "../lib/page-metadata";
import { SITE_URL } from "../lib/site-indexing";

const mocks = vi.hoisted(() => ({ area: vi.fn(), employer: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/public-career-areas", () => ({
  getPublicCareerAreaBySlug: mocks.area,
  getPublicCareerAreas: vi.fn(),
}));
vi.mock("../lib/public-employer-profiles", () => ({
  getPublicEmployerPage: mocks.employer,
  getPublishedEmployerIndex: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

const pages = [
  ["/", () => import("../app/page")],
  ["/careers", () => import("../app/careers/page")],
  ["/employers", () => import("../app/employers/page")],
  ["/for-employers", () => import("../app/for-employers/page")],
  ["/how-we-use-ai", () => import("../app/how-we-use-ai/page")],
  ["/course-recommendations", () => import("../app/(templates)/course-recommendations/page")],
  [
    "/employers/wildmere-nature-trust",
    () => import("../app/(templates)/employers/wildmere-nature-trust/page"),
  ],
  ["/style-guide", () => import("../app/style-guide/page")],
  ["/saved-jobs", () => import("../app/saved-jobs/page")],
  ["/sign-in", () => import("../app/sign-in/page")],
  ["/create-account", () => import("../app/create-account/page")],
  ["/check-email", () => import("../app/check-email/page")],
  ["/account", () => import("../app/account/page")],
  ["/account/saved", () => import("../app/account/saved/page")],
  ["/account/preferences", () => import("../app/account/preferences/page")],
  ["/admin", () => import("../app/admin/page")],
  ["/admin/jobs", () => import("../app/admin/jobs/page")],
  ["/admin/sources", () => import("../app/admin/sources/page")],
  ["/admin/courses", () => import("../app/admin/courses/page")],
  ["/admin/organisations", () => import("../app/admin/organisations/page")],
  ["/admin/quality", () => import("../app/admin/quality/page")],
  ["/admin/guides", () => import("../app/admin/guides/page")],
] as const;

it.each(pages)("gives %s matching page and sharing metadata", async (path, load) => {
  const { metadata } = await load();
  expect(metadata.title).toEqual({ absolute: expect.any(String) });
  expect(metadata.description).toBeTruthy();
  expect(metadata.alternates?.canonical).toBe(path);
  const title = (metadata.title as { absolute: string }).absolute;
  expect(title).toMatch(path.startsWith("/admin") ? /\| WildJobs staff$/ : /\| WildJobs$/);
  expect(metadata.openGraph).toMatchObject({
    title,
    description: metadata.description,
    url: new URL(path, SITE_URL).toString(),
    siteName: "WildJobs",
    images: [siteShareImage],
  });
  expect(metadata.twitter).toMatchObject({
    card: "summary_large_image",
    title,
    description: metadata.description,
    images: [{ url: siteShareImage.url }],
  });
});

it("keeps the homepage preview about the site instead of an individual job", async () => {
  const { metadata } = await import("../app/page");
  expect(metadata.title).toEqual({ absolute: "Find conservation jobs | WildJobs" });
  expect(metadata.description).toContain("Search conservation jobs");
  expect(metadata.openGraph).toMatchObject({ url: `${SITE_URL}/`, type: "website" });
});

it("does not give inherited site defaults a homepage canonical or sharing URL", () => {
  const metadata = pageMetadata({ title: "Conservation careers", description: "WildJobs by WildTeam" });
  expect(metadata.alternates).toBeUndefined();
  expect(metadata.openGraph).not.toHaveProperty("url");
});

it("uses the requested career area in all preview fields", async () => {
  mocks.area.mockResolvedValue({ slug: "ecology", title: "Ecology", description: "Explore ecology roles." });
  const { generateMetadata } = await import("../app/careers/[slug]/page");
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: "ecology" }) });
  expect(metadata.alternates?.canonical).toBe("/careers/ecology");
  expect(metadata.openGraph).toMatchObject({
    title: "Ecology careers | WildJobs",
    description: "Explore ecology roles.",
    url: `${SITE_URL}/careers/ecology`,
  });
  mocks.area.mockResolvedValue(undefined);
  await expect(generateMetadata({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow();
});

it.each([true, false])(
  "uses the employer's canonical profile and preserves indexing (reviewed=%s)",
  async (reviewed) => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("SITE_INDEXING_ENABLED", "true");
    mocks.employer.mockResolvedValue({
      slug: "example-trust",
      name: "Example Trust",
      content: reviewed
        ? { claims: [{ kind: "overview", text: "Restoring habitats across the UK." }] }
        : null,
    });
    const { generateMetadata } = await import("../app/(templates)/employers/[slug]/page");
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "organisation-old-alias" }) });
    expect(metadata.alternates?.canonical).toBe("/employers/example-trust");
    expect(metadata.openGraph).toMatchObject({
      title: "Example Trust employer profile | WildJobs",
      description: reviewed
        ? "Restoring habitats across the UK."
        : "Explore current jobs at Example Trust on WildJobs",
      url: `${SITE_URL}/employers/example-trust`,
    });
    expect(metadata.robots).toMatchObject({ index: reviewed, follow: true });
    mocks.employer.mockResolvedValue(null);
    await expect(generateMetadata({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow();
  },
);

it("keeps auth, saved jobs and example pages out of search results", async () => {
  for (const [path, load] of pages) {
    if (
      !/^\/(?:sign-in|create-account|check-email|saved-jobs|account|style-guide|employers\/wildmere)/.test(
        path,
      )
    )
      continue;
    const { metadata } = await load();
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  }
});

it.each(["jobs", "news"])("describes the %s navigation experiment", async (site) => {
  const { generateMetadata } = await import("../app/experiments/navigation/[site]/page");
  const metadata: Metadata = await generateMetadata({ params: Promise.resolve({ site }) });
  expect(metadata.title).toEqual({
    absolute: `${site === "jobs" ? "WildJobs" : "WildNews"} navigation preview | WildJobs`,
  });
  expect(metadata.robots).toMatchObject({ index: false, follow: false });
  expect(metadata.openGraph).toMatchObject({ url: `${SITE_URL}/experiments/navigation/${site}` });
});
