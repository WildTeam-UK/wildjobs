import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../lib/public-guides", () => ({ getReviewedGuideIndex: async () => [] }));
import { metadata } from "../app/experiments/project-management/page";
import config from "../next.config";
import sitemap from "../app/sitemap";
import { COURSE_EXPERIMENT_PATH, PMWC_COURSE_URL } from "../lib/course-experiment";

afterEach(() => vi.unstubAllEnvs());

it("keeps the course experiment unindexed even when production indexing is enabled", () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  expect(metadata.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false } });
  expect(metadata.alternates?.canonical).toBe(PMWC_COURSE_URL);
});

it("adds a crawler response directive to all experiment routes", async () => {
  const headers = await config.headers!();
  expect(headers.find((entry) => entry.source === "/experiments/:path*")?.headers).toContainEqual({
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  });
});

it("excludes the experiment from the production sitemap", async () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  const urls = (await sitemap()).map((entry) => entry.url);
  expect(urls.some((url) => new URL(url).pathname === "/")).toBe(true);
  expect(urls.some((url) => new URL(url).pathname === COURSE_EXPERIMENT_PATH)).toBe(false);
});
