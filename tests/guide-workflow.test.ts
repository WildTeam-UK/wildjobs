import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { GuideRevision } from "../lib/guide-database.types";
import type { GuideJob } from "../lib/guide-market";
const mocks = vi.hoisted(() => ({ client: vi.fn(), jobs: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: mocks.client }));
vi.mock("../lib/public-guides", () => ({ getFreshGuideJobs: mocks.jobs }));
vi.mock("../lib/public-data-cache", () => ({
  invalidatePublicData: vi.fn(),
  cachePublicData: (_key: string, load: unknown) => load,
}));
import {
  guideEvidence,
  guideSourcesCurrent,
  publishPilotDraft,
  refreshPilotDrafts,
  autoPublishEligibleGuides,
} from "../lib/guide-workflow";
import { pilotGuides, sectorGuides } from "../lib/guide-content";

const now = new Date("2026-11-03T12:00:00Z");
let revisions: GuideRevision[], jobs: GuideJob[];
let nextId: number;
let retained: { job_id: number; feed_hash: string; is_detailed: boolean }[];
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  revisions = [];
  nextId = 1;
  retained = [];
  jobs = Array.from({ length: 10 }, (_, id) => ({
    id,
    title: "Ecologist",
    organisation_name: `Employer ${id % 2}`,
    source_url: `https://example.test/jobs/${id}`,
    source_name: "Board",
    sector_slugs: ["conservation-wildlife"],
    feed_text:
      "Full time. Survey habitats, analyse ecological evidence and prepare reports. Work with colleagues to interpret results and recommend actions that address the needs of the project. Keep reliable records of methods, limitations and conclusions.",
    salary_text: "£30,000 per year",
    country_code: "GB",
    hours_type: "Full time",
    engagement_type: "Paid",
    posted_at: "2026-10-30T12:00:00Z",
    first_seen_at: "2026-11-01T12:00:00Z",
    closes_at: "2026-12-01T12:00:00Z",
    is_active: true,
    merged_into: null,
  }));
  mocks.jobs.mockImplementation(async () => jobs);
  const from = (table: string) => {
    let update: Record<string, unknown> | undefined, upsert: Record<string, unknown> | undefined;
    const filters: [string, unknown][] = [];
    const query = {
      select: () => query,
      order: () => query,
      range: () => query,
      in: () => query,
      eq: (key: string, value: unknown) => {
        filters.push([key, value]);
        return query;
      },
      update: (value: Record<string, unknown>) => {
        update = value;
        return query;
      },
      upsert: (value: Record<string, unknown>) => {
        upsert = value;
        return query;
      },
      // oxlint-disable-next-line unicorn/no-thenable -- Models the Supabase builder at the database boundary.
      then: (resolve: (result: unknown) => unknown) => {
        if (table === "directory_guide_evidence")
          return Promise.resolve({ data: retained.filter((r) => r.is_detailed), error: null }).then(resolve);
        if (table !== "career_guide_revisions")
          return Promise.resolve({ data: [], error: null }).then(resolve);
        if (update)
          for (const row of revisions.filter((r) =>
            filters.every(([key, value]) => r[key as keyof GuideRevision] === value),
          ))
            Object.assign(row, update);
        if (
          upsert &&
          !revisions.some((r) => r.guide_slug === upsert!.guide_slug && r.input_hash === upsert!.input_hash)
        )
          revisions.push({
            ...upsert,
            id: nextId++,
            created_at: now.toISOString(),
            reviewed_at: null,
          } as GuideRevision);
        return Promise.resolve({ data: [...revisions], error: null }).then(resolve);
      },
    };
    return query;
  };
  const rpc = vi.fn(async (_name: string, args: { p_id: number; p_input_hash: string }) => {
    const target = revisions.find(
      (r) => r.id === args.p_id && r.input_hash === args.p_input_hash && r.status === "draft",
    );
    if (!target) return { data: false, error: null };
    for (const row of revisions)
      if (row.guide_slug === target.guide_slug && row.status === "published") row.status = "archived";
    target.status = "published";
    target.reviewed_at = now.toISOString();
    return { data: true, error: null };
  });
  mocks.client.mockReturnValue({ from, rpc });
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("publishes a qualifying career guide automatically and does not republish unchanged prose", async () => {
  await refreshPilotDrafts();
  expect(await autoPublishEligibleGuides()).toMatchObject({ published: 2, deferred: [] });
  expect(revisions.find((r) => r.guide_slug === "ecologist" && r.status === "published")).toBeDefined();
  expect(await autoPublishEligibleGuides()).toMatchObject({ published: 0 });
  expect(revisions.filter((r) => r.guide_slug === "ecologist")).toHaveLength(1);
});

it("automatically refreshes stale generated evidence while preserving separately edited content", async () => {
  await refreshPilotDrafts();
  const old = revisions.find((r) => r.guide_slug === "ecologist")!;
  jobs = [...jobs, { ...jobs[0], id: 110, source_url: "https://example.test/new" }];
  expect(await autoPublishEligibleGuides()).toMatchObject({ published: 2 });
  expect(old.status).toBe("archived");
  const published = revisions.find((r) => r.guide_slug === "ecologist" && r.status === "published")!;
  published.status = "draft";
  published.content = { ...(published.content as object), description: "A separately edited introduction" };
  const result = await autoPublishEligibleGuides();
  expect(result.published).toBe(0);
  expect(result.deferred).toContain("ecologist: preserve separately edited content");
});

it("does not automatically publish a career guide below ten adverts or with overdue sources", async () => {
  jobs = jobs.slice(0, 9);
  expect((await autoPublishEligibleGuides()).published).toBe(0);
  jobs = [...jobs, { ...jobs[0], id: 12 }];
  vi.setSystemTime(new Date("2027-02-15T12:00:00Z"));
  const result = await autoPublishEligibleGuides();
  expect(result.published).toBe(0);
  expect(result.deferred).toContain("ecologist: research sources need refreshing");
});

it("queues eligible pilot drafts once and preserves pending editorial work as adverts change", async () => {
  await refreshPilotDrafts();
  expect(revisions.map((r) => r.guide_slug).toSorted()).toEqual(["ecologist", "wildlife-conservation"]);
  const first = revisions.find((r) => r.guide_slug === "ecologist")!;
  const originalHash = first.input_hash;
  jobs = [...jobs, { ...jobs[0], id: 100, source_url: "https://example.test/100" }];
  await refreshPilotDrafts();
  expect(revisions).toHaveLength(2);
  expect(first.input_hash).toBe(originalHash);
  await refreshPilotDrafts("ecologist");
  expect(first.status).toBe("archived");
  expect(revisions.filter((r) => r.guide_slug === "ecologist" && r.status === "draft")).toHaveLength(1);
});
it("rejects a stale evidence approval and publishes only the subsequently refreshed draft", async () => {
  await refreshPilotDrafts();
  const draft = revisions.find((r) => r.guide_slug === "ecologist")!;
  jobs[0] = { ...jobs[0], salary_text: "£35,000 per year" };
  await expect(publishPilotDraft(draft.id, draft.input_hash)).rejects.toThrow("evidence changed");
  expect(draft.status).toBe("draft");
  await refreshPilotDrafts("ecologist");
  const current = revisions.find((r) => r.guide_slug === "ecologist" && r.status === "draft")!;
  await publishPilotDraft(current.id, current.input_hash);
  expect(current.status).toBe("published");
  expect(draft.status).toBe("archived");
});
it("does not queue a career guide below threshold or rewrite a recently published version", async () => {
  jobs = jobs.slice(1);
  await refreshPilotDrafts();
  expect(revisions.map((r) => r.guide_slug)).toEqual(["wildlife-conservation"]);
  const sector = revisions[0];
  await publishPilotDraft(sector.id, sector.input_hash);
  jobs[0] = { ...jobs[0], salary_text: "£40,000 per year" };
  await refreshPilotDrafts();
  expect(revisions).toHaveLength(1);
  expect(sector.status).toBe("published");
});
it("keeps evidence fingerprints stable across requests and rejects stale research dates", () => {
  const guide = pilotGuides[1];
  expect(guideEvidence(guide, jobs, [], now).inputHash).toBe(
    guideEvidence(guide, jobs, [], new Date(now.valueOf() + 60000)).inputHash,
  );
  expect(guideSourcesCurrent(guide, now)).toBe(true);
  expect(guideSourcesCurrent(guide, new Date("2027-03-01"))).toBe(false);
  expect(
    guideSourcesCurrent(
      { ...guide, sources: guide.sources.map((s) => ({ ...s, checkedAt: "2027-01-01" })) },
      now,
    ),
  ).toBe(false);
});
it.each(sectorGuides)(
  "queues $slug against its own advert sample and keeps it private until approval",
  async (guide) => {
    jobs = jobs.map((job) => ({ ...job, sector_slugs: [guide.matchSlug] }));
    await refreshPilotDrafts(guide.slug);
    expect(revisions).toHaveLength(1);
    expect(revisions[0]).toMatchObject({ guide_slug: guide.slug, status: "draft", reviewed_at: null });
    expect(revisions[0].evidence).toMatchObject({ jobIds: jobs.map((job) => job.id) });
    await publishPilotDraft(revisions[0].id, revisions[0].input_hash);
    expect(revisions[0].status).toBe("published");
  },
);
it("does not queue sector evidence drafts without matching adverts", async () => {
  jobs = [];
  await refreshPilotDrafts();
  expect(revisions).toEqual([]);
});
it("queues a new role only when its tenth usable retained advert arrives and never overwrites the pending draft", async () => {
  jobs = jobs.map((job, id) => ({
    ...job,
    title: "Project Officer",
    feed_text: "Brief feed excerpt",
    feed_hash: `hash-${id}`,
  }));
  retained = jobs
    .slice(0, 9)
    .map((job) => ({ job_id: job.id, feed_hash: job.feed_hash!, is_detailed: true }));
  await refreshPilotDrafts("project-officer");
  expect(revisions).toEqual([]);
  retained.push({ job_id: jobs[9].id, feed_hash: jobs[9].feed_hash!, is_detailed: true });
  await refreshPilotDrafts();
  const draft = revisions.find((r) => r.guide_slug === "project-officer")!;
  expect(draft).toMatchObject({ status: "draft", reviewed_at: null });
  expect(draft.evidence).toMatchObject({ qualifiedAdverts: 10 });
  const fingerprint = draft.input_hash;
  jobs[0] = { ...jobs[0], title: "Senior Project Officer" };
  await refreshPilotDrafts();
  expect(revisions.filter((r) => r.guide_slug === "project-officer")).toHaveLength(1);
  expect(draft.input_hash).toBe(fingerprint);
  expect(draft.status).toBe("draft");
});
it("does not mistake equivalent content field order for changed evidence", () => {
  const guide = sectorGuides.find((g) => g.slug === "ecology")!;
  const reordered = {
    ...guide,
    sources: guide.sources.map((s) => ({
      supports: s.supports,
      checkedAt: s.checkedAt,
      url: s.url,
      title: s.title,
      id: s.id,
    })),
  };
  expect(guideEvidence(reordered, jobs, [], now).inputHash).toBe(
    guideEvidence(guide, jobs, [], now).inputHash,
  );
});
it("queues overdue research for private review but blocks its publication", async () => {
  vi.setSystemTime(new Date("2027-03-01T12:00:00Z"));
  await refreshPilotDrafts("ecologist");
  expect(revisions).toHaveLength(1);
  expect(revisions[0].status).toBe("draft");
  await expect(publishPilotDraft(revisions[0].id, revisions[0].input_hash)).rejects.toThrow(
    "source review needs attention",
  );
  expect(revisions[0].status).toBe("draft");
});
