import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ client: vi.fn(), read: vi.fn(), ai: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: mocks.client }));
vi.mock("../lib/directory-http", () => ({ fetchPublicText: mocks.read }));
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
