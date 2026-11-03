import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { GuideRevision } from "../lib/guide-database.types";
import type { GuideJob } from "../lib/guide-market";
const mocks = vi.hoisted(() => ({ client: vi.fn(), jobs: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: mocks.client }));
vi.mock("../lib/public-guides", () => ({ getGuideJobs: mocks.jobs }));
import {
  guideEvidence,
  guideSourcesCurrent,
  publishPilotDraft,
  refreshPilotDrafts,
} from "../lib/guide-workflow";
import { pilotGuides, sectorGuides } from "../lib/guide-content";

const now = new Date("2026-11-03T12:00:00Z");
let revisions: GuideRevision[], jobs: GuideJob[];
let nextId: number;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  revisions = [];
  nextId = 1;
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
