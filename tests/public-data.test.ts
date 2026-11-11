import { afterEach, beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  entries: new Map<string, unknown>(),
  rows: [] as Record<string, unknown>[],
  reads: 0,
  selects: [] as string[],
  fail: false,
  inCache: false,
}));
vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: (load: unknown) => load }));
vi.mock("next/server", () => ({
  connection: async () => {
    if (state.inCache) throw new Error("Request context read inside persistent cache");
  },
}));
// Exercise the application's boundaries while the integration script checks the
// actual Next.js cache across HTTP requests and an automation mutation.
vi.mock("next/cache", () => ({
  revalidateTag: () => state.entries.clear(),
  unstable_cache:
    (load: (...args: unknown[]) => Promise<unknown>, keys: string[]) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify([keys, args]);
      if (state.entries.has(key)) return state.entries.get(key);
      state.inCache = true;
      try {
        const value = await load(...args);
        state.entries.set(key, value);
        return value;
      } finally {
        state.inCache = false;
      }
    },
}));
vi.mock("../lib/public-courses", () => ({ getPublicCourses: async () => [] }));
vi.mock("../lib/public-career-areas", () => ({ getPublicCareerAreas: async () => [] }));
vi.mock("../lib/public-employer-profiles", () => ({ getPublishedEmployerIndex: async () => [] }));
vi.mock("../lib/public-organisations", () => ({ getPublicOrganisations: async () => [] }));
vi.mock("../lib/supabase/public", () => ({
  createPublicClient: () => ({
    from: (table: string) => {
      let start = 0,
        end = 999;
      const query = {
        select: (fields: string) => {
          state.selects.push(fields);
          return query;
        },
        eq: () => query,
        in: () => query,
        is: () => query,
        or: () => query,
        order: () => query,
        range: (from: number, to: number) => {
          start = from;
          end = to;
          return query;
        },
        // oxlint-disable-next-line unicorn/no-thenable -- Supabase boundary fixture.
        then: (resolve: (result: unknown) => unknown) => {
          state.reads++;
          return Promise.resolve({
            data: table === "directory_jobs" ? structuredClone(state.rows.slice(start, end + 1)) : [],
            error: state.fail ? { code: "57014" } : null,
          }).then(resolve);
        },
      };
      return query;
    },
  }),
}));

import { getPublicJobs, getPublicJobsByIds } from "../lib/public-jobs";
import { getFreshGuideJobs, getGuideJobs } from "../lib/public-guides";
import { invalidatePublicData } from "../lib/public-data-cache";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
  state.entries.clear();
  state.reads = 0;
  state.selects = [];
  state.fail = false;
  state.rows = [
    {
      id: 1,
      title: "Ecologist",
      organisation_name: "Fixture Trust",
      slug: "fixture",
      summary: "Restore habitats",
      summary_source: "source",
      location_text: "Exeter",
      workplace: "On-site",
      hours_type: "Full time",
      contract_type: "Permanent",
      salary_text: "£30,000 per year",
      sector_slugs: [],
      course_slugs: [],
      feed_text: "Full time ecologist",
      skill_slugs: [],
      benefit_slugs: [],
      posted_at: "2026-11-10T12:00:00Z",
      updated_at: "2026-11-11T11:00:00Z",
      closes_at: "2026-11-11T12:01:00Z",
      is_active: true,
      merged_into: null,
    },
  ];
});
afterEach(() => vi.useRealTimers());

it("reuses narrow public rows across requests but removes a job at its deadline", async () => {
  expect(await getPublicJobs()).toHaveLength(1);
  const reads = state.reads;
  expect(await getPublicJobs()).toHaveLength(1);
  expect(state.reads).toBe(reads);
  vi.advanceTimersByTime(60_000);
  expect(await getPublicJobs()).toHaveLength(0);
  expect(state.reads).toBe(reads);
  expect(state.selects).not.toContain("*");
  expect(state.selects[0]).toContain("feed_text");
  expect(state.selects[0]).toContain("skill_slugs,benefit_slugs");
});

it("uses fresh guide evidence for approval while public readers reuse their snapshot", async () => {
  expect((await getGuideJobs())[0].title).toBe("Ecologist");
  state.rows[0].title = "Changed evidence";
  expect((await getGuideJobs())[0].title).toBe("Ecologist");
  expect((await getFreshGuideJobs())[0].title).toBe("Changed evidence");
  invalidatePublicData();
  expect((await getGuideJobs())[0].title).toBe("Changed evidence");
});

it("reuses guide opportunity reads across ID orderings and checks expiry on every request", async () => {
  expect(await getPublicJobsByIds([1, 2])).toHaveLength(1);
  const reads = state.reads;
  expect(await getPublicJobsByIds([2, 1, 1])).toHaveLength(1);
  expect(state.reads).toBe(reads);
  vi.advanceTimersByTime(60_000);
  expect(await getPublicJobsByIds([1, 2])).toHaveLength(0);
  expect(state.reads).toBe(reads);
});

it("does not cache failed reads and recovers on the next request", async () => {
  state.fail = true;
  await expect(getPublicJobs()).rejects.toThrow("Jobs could not be loaded");
  state.fail = false;
  expect(await getPublicJobs()).toHaveLength(1);
});

it("reads and caches every page when the directory grows beyond one cache item", async () => {
  const row = state.rows[0];
  state.rows = Array.from({ length: 401 }, (_, id) => ({ ...row, id: id + 1 }));
  expect(await getPublicJobs()).toHaveLength(401);
  const reads = state.reads;
  expect(reads).toBe(4); // Three job pages plus the role-alias read.
  expect(await getPublicJobs()).toHaveLength(401);
  expect(state.reads).toBe(reads);
});
