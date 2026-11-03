import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), read: vi.fn(), ai: vi.fn(), logo: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/guide-workflow", () => ({ recordGuideAdvert: vi.fn(), refreshPilotDrafts: vi.fn() }));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: mocks.client }));
vi.mock("../lib/directory-http", () => ({ fetchPublicText: mocks.read }));
vi.mock("../lib/organisation-logo", async (original) => ({
  ...(await original<typeof import("../lib/organisation-logo")>()),
  findOrganisationLogo: mocks.logo,
}));
vi.mock("openai", () => ({ default: mocks.ai }));
import { syncDirectory } from "../lib/directory-sync";
beforeEach(() => vi.resetAllMocks());
it("preserves a broken feed, imports the healthy source, and skips AI for an already enriched duplicate", async () => {
  const updates: { table: string; value: unknown }[] = [];
  const rpc = vi.fn(async (name: string, _args?: unknown) => ({
    data:
      name === "claim_directory_run"
        ? true
        : name === "import_directory_feed"
          ? { seen: 1, changed: 1 }
          : name === "directory_pending_jobs"
            ? []
            : null,
    error: null,
  }));
  const sources = [
    { id: 1, name: "Unavailable board", feed_url: "https://a.example.org/feed" },
    { id: 2, name: "Healthy board", feed_url: "https://b.example.org/feed" },
  ];
  function from(table: string) {
    const result = { data: table === "directory_sources" ? sources : [], error: null };
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      is: vi.fn(() => query),
      lte: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      insert: vi.fn(() => query),
      update: vi.fn((value) => {
        updates.push({ table, value });
        return query;
      }),
      single: vi.fn(async () => ({ data: { id: 7 }, error: null })),
      // oxlint-disable-next-line unicorn/no-thenable -- Models the Supabase query builder.
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    };
    return query;
  }
  mocks.client.mockReturnValue({ rpc, from });
  mocks.read.mockImplementation(async (url: string) => {
    if (url === "https://a.example.org/feed") throw new Error("Source HTTP 503");
    return {
      url,
      text: "<rss><channel><title>Jobs</title><item><guid>new-source-copy</guid><title>Ecologist</title><link>https://employer.example.org/jobs/1</link><description>Survey habitats.</description><company>Nature Trust</company><location>Exeter</location></item></channel></rss>",
    };
  });
  const result = await syncDirectory();
  expect(result).toMatchObject({
    status: "partial",
    feed_seen: 1,
    changed: 1,
    ai_completed: 0,
    estimated_cost_usd: 0,
  });
  const imports = rpc.mock.calls.filter((call) => call[0] === "import_directory_feed");
  expect(imports).toHaveLength(1);
  expect(imports[0][1]).toMatchObject({ p_source_id: 2, p_feed_url: "https://b.example.org/feed" });
  expect(updates).toContainEqual({
    table: "directory_sources",
    value: expect.objectContaining({ last_error: "Source HTTP 503" }),
  });
  expect(mocks.ai).not.toHaveBeenCalled();
  expect(rpc).toHaveBeenCalledWith(
    "finish_directory_run",
    expect.objectContaining({ p_run_id: 7, p_error: "Unavailable board: Source HTTP 503" }),
  );
});

it("persists international pay and reuses one employer logo lookup within the single AI pass", async () => {
  const job = {
    id: 1,
    feed_hash: "current",
    processed_hash: null,
    source_url: "https://trust.example.org/job/1",
    salary_text: "Not stated",
    organisation_name: "Nature Trust",
    title: "Ranger",
    feed_text: "Care for wildlife.",
    location_text: "Toronto, Canada",
    hours_type: "Full time",
    contract_type: "Permanent",
    workplace: "On-site",
  };
  const rpc = vi.fn(
    async (
      name: string,
      args?: { p_job_id?: number; p_ai?: boolean; p_fields?: Record<string, unknown> },
    ) => ({
      data:
        name === "claim_directory_run"
          ? true
          : name === "directory_pending_jobs"
            ? [job, { ...job, id: 2 }]
            : name === "apply_directory_job"
              ? { ...job, id: args?.p_job_id, ...args?.p_fields }
              : null,
      error: null,
    }),
  );
  function from(table: string) {
    const query = {
      select: () => query,
      eq: () => query,
      is: () => query,
      lte: () => query,
      order: () => query,
      limit: () => query,
      insert: () => query,
      update: () => query,
      single: async () => ({ data: { id: 8 }, error: null }),
      // oxlint-disable-next-line unicorn/no-thenable -- Models the Supabase query builder.
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve),
    };
    void table;
    return query;
  }
  mocks.client.mockReturnValue({ rpc, from });
  mocks.read.mockResolvedValue({
    url: job.source_url,
    text: `<script type="application/ld+json">${JSON.stringify({
      "@type": "JobPosting",
      description: "Care for wildlife.",
      baseSalary: { currency: "CAD", value: { minValue: "31.50", maxValue: "33.75", unitText: "HOUR" } },
    })}</script>`,
  });
  mocks.logo.mockResolvedValue("https://nature.org/logo.svg");
  const parse = vi.fn().mockResolvedValue({
    output_parsed: {
      jobs: [1, 2].map((id) => ({
        id,
        summary: "Care for wildlife and maintain habitats.",
        sector_slugs: [],
        course_slugs: [],
        salary_text: "£90000 per year",
        organisation_website: "https://nature.org",
      })),
    },
    usage: { input_tokens: 100, output_tokens: 50 },
  });
  mocks.ai.mockImplementation(function () {
    return { responses: { parse } };
  });
  expect(await syncDirectory()).toMatchObject({ status: "complete", ai_completed: 2 });
  const writes = rpc.mock.calls.filter(([name]) => name === "apply_directory_job");
  expect(writes).toHaveLength(4);
  for (const [, args] of writes)
    expect(args?.p_fields).toMatchObject({ salary_text: "CAD 31.50 – CAD 33.75 per hour", salary_min: 31.5 });
  expect(parse).toHaveBeenCalledTimes(1);
  expect(mocks.logo).toHaveBeenCalledTimes(1);
  for (const [, args] of writes.filter(([, args]) => args?.p_ai))
    expect(args?.p_fields).toMatchObject({ logo_url: "https://nature.org/logo.svg" });
});
