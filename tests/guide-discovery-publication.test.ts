import { renderToStaticMarkup } from "react-dom/server";
import { parseHTML } from "linkedom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  jobs: [] as Record<string, unknown>[],
  revisions: [] as Record<string, unknown>[],
  cache: new Map<string, unknown>(),
  client: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("server-only", () => ({}));
// Each invocation represents a new server request, while the Data Cache persists.
vi.mock("react", async (original) => ({ ...(await original<object>()), cache: (load: unknown) => load }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/cache", () => ({
  revalidateTag: (tag: string, profile: unknown) => {
    state.revalidate(tag, profile);
    state.cache.clear();
  },
  unstable_cache:
    (load: (...args: unknown[]) => Promise<unknown>, keys: string[]) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify([keys, args]);
      if (!state.cache.has(key)) state.cache.set(key, await load(...args));
      return state.cache.get(key);
    },
}));
vi.mock("../lib/supabase/public", () => ({ createPublicClient: state.client }));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: state.client }));
vi.mock("../lib/public-employer-profiles", () => ({ getPublishedEmployerIndex: async () => [] }));

import { autoPublishEligibleGuides } from "../lib/guide-workflow";
import { getReviewedGuideIndex } from "../lib/public-guides";
import { PUBLIC_DATA_TAG } from "../lib/public-data-cache";
import { guideCatalog, guidePath } from "../lib/guide-content";
import CareerGuidesPage, { generateMetadata } from "../app/(templates)/conservation-career-guides/page";
import sitemap from "../app/sitemap";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T12:00:00Z"));
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("SITE_INDEXING_ENABLED", "true");
  state.cache.clear();
  state.revisions = [];
  state.jobs = Array.from({ length: 9 }, (_, id) => ({
    id,
    title: "Ecologist",
    organisation_name: `Fixture employer ${id % 2}`,
    source_url: `https://example.test/jobs/${id}`,
    source_name: "Fixture board",
    sector_slugs: ["conservation-wildlife"],
    feed_text: "Full time. Survey habitats, analyse ecological evidence and prepare reports. ".repeat(4),
    salary_text: "Not stated",
    country_code: "GB",
    hours_type: "Full time",
    engagement_type: "Paid",
    posted_at: "2026-11-01T12:00:00Z",
    first_seen_at: "2026-11-01T12:00:00Z",
    closes_at: "2026-12-01T12:00:00Z",
    is_active: true,
    merged_into: null,
  }));
  const from = (table: string) => {
    let update: Record<string, unknown> | undefined;
    const filters: ((row: Record<string, unknown>) => boolean)[] = [];
    let start = 0,
      end = 999;
    const query = {
      select: () => query,
      order: () => query,
      or: () => query,
      range: (first: number, last: number) => {
        start = first;
        end = last;
        return query;
      },
      is: (key: string, value: unknown) => query.eq(key, value),
      eq: (key: string, value: unknown) => {
        filters.push((row) => row[key] === value);
        return query;
      },
      in: (key: string, values: unknown[]) => {
        filters.push((row) => values.includes(row[key]));
        return query;
      },
      update: (value: Record<string, unknown>) => {
        update = value;
        return query;
      },
      upsert: (value: Record<string, unknown>) => {
        if (table !== "career_guide_revisions") throw new Error("Unexpected write");
        if (
          !state.revisions.some(
            (row) => row.guide_slug === value.guide_slug && row.input_hash === value.input_hash,
          )
        ) {
          state.revisions.push({
            ...value,
            id: state.revisions.length + 1,
            created_at: new Date().toISOString(),
          });
        }
        return query;
      },
      // oxlint-disable-next-line unicorn/no-thenable -- Models the database query boundary.
      then: (resolve: (result: unknown) => unknown) => {
        const rows =
          table === "directory_jobs" ? state.jobs : table === "career_guide_revisions" ? state.revisions : [];
        const selected = rows.filter((row) => filters.every((filter) => filter(row)));
        if (update) for (const row of selected) Object.assign(row, update);
        return Promise.resolve({ data: structuredClone(selected.slice(start, end + 1)), error: null }).then(
          resolve,
        );
      },
    };
    return query;
  };
  state.client.mockReturnValue({
    from,
    rpc: async (name: string, args: { p_id: number; p_input_hash: string }) => {
      if (name !== "publish_career_guide") throw new Error("Unexpected RPC");
      const candidate = state.revisions.find(
        (row) => row.id === args.p_id && row.input_hash === args.p_input_hash && row.status === "draft",
      );
      if (!candidate) return { data: false, error: null };
      for (const row of state.revisions) {
        if (row.guide_slug === candidate.guide_slug && row.status === "published") row.status = "archived";
      }
      Object.assign(candidate, { status: "published", reviewed_at: new Date().toISOString() });
      return { data: true, error: null };
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("adds a newly eligible guide to a warm directory, schema and sitemap on the next request", async () => {
  expect(await getReviewedGuideIndex()).toEqual([]);
  expect((await generateMetadata()).robots).toMatchObject({ index: false });
  expect(renderToStaticMarkup(await CareerGuidesPage())).not.toContain(
    'href="/conservation-career-guides/ecologist"',
  );
  expect((await sitemap()).some(({ url }) => url.endsWith("/ecologist"))).toBe(false);
  expect((await autoPublishEligibleGuides()).published).toBe(0);

  // The tenth distinct detailed advert crosses the threshold with two employers.
  state.jobs.push({ ...state.jobs[0], id: 10, source_url: "https://example.test/jobs/10" });
  expect((await autoPublishEligibleGuides()).published).toBe(2);
  expect(state.revalidate).toHaveBeenCalledWith(PUBLIC_DATA_TAG, { expire: 0 });

  const published = await getReviewedGuideIndex();
  expect(published.map(({ guide }) => guide.slug)).toEqual(["wildlife-conservation", "ecologist"]);
  expect((await generateMetadata()).robots).toMatchObject({ index: true });
  const { document } = parseHTML(renderToStaticMarkup(await CareerGuidesPage()));
  for (const { guide } of published) {
    expect(document.querySelector(`a[href="${guidePath(guide)}"]`)).not.toBeNull();
    expect((await sitemap()).some(({ url }) => url.endsWith(guidePath(guide)))).toBe(true);
  }
  expect(document.getElementById("sector-guides-title")?.textContent).toBe(
    "Explore our conservation sector guides 1",
  );
  expect(document.getElementById("career-guides-title")?.textContent).toBe(
    "Explore our conservation career guides 1",
  );
  const schema = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!);
  expect(schema["@graph"][0].mainEntity.itemListElement).toHaveLength(2);
  expect((await autoPublishEligibleGuides()).published).toBe(0);
});

it("keeps the discovery index in catalogue order regardless of database row order", async () => {
  state.revisions = [...guideCatalog]
    .reverse()
    .map((guide) => ({ guide_slug: guide.slug, status: "published", reviewed_at: "2026-11-12T12:00:00Z" }));
  expect((await getReviewedGuideIndex()).map(({ guide }) => guide.slug)).toEqual(
    guideCatalog.map(({ slug }) => slug),
  );
});
