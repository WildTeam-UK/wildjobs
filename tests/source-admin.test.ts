import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ staff: vi.fn(), client: vi.fn() }));
vi.stubGlobal("React", React);
vi.mock("server-only", () => ({}));
vi.mock("../lib/auth/staff", () => ({ requireAdministrator: mocks.staff }));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: mocks.client }));
vi.mock("../app/admin/sources/actions", () => ({
  addSource: vi.fn(),
  changeSource: vi.fn(),
  queueCatalogue: vi.fn(),
  checkNextBatch: vi.fn(),
}));
import SourcesAdmin from "../app/admin/sources/page";
import styles from "../app/admin/sources/sources.module.css";
import { sourceDocument } from "../lib/source-posting";

it("renders checked, blocked and removed sources with previews and accessible source controls", async () => {
  const source = {
    id: 1,
    name: "Nature Trust",
    feed_url: "https://trust.example.org/jobs",
    enabled: false,
    last_seen_count: 0,
    last_feed_at: null,
    next_feed_at: null,
    checked_at: "2026-11-09T12:00:00Z",
    reviewed_at: null,
    last_error: null,
    removed_at: null,
    configuration: { kind: "auto", organisation: "Nature Trust" },
    notes: "",
    check_result: {
      complete: true,
      count: 1,
      liveCount: 1,
      kind: "html",
      pages: 2,
      jobs: [
        {
          title: "Ecologist",
          organisation: "Nature Trust",
          location: "Bristol",
          url: "https://trust.example.org/jobs/1",
          closesAt: "2026-11-20T23:59:59Z",
        },
      ],
    },
  };
  const sources = [
    source,
    {
      ...source,
      id: 2,
      name: "Blocked source",
      check_result: null,
      last_error: "The source returned an access challenge.",
    },
    { ...source, id: 3, name: "Removed source", removed_at: "2026-11-08T12:00:00Z" },
  ];
  mocks.staff.mockResolvedValue({ role: "admin" });
  mocks.client.mockReturnValue({
    from(table: string) {
      const result = {
        data:
          table === "directory_sources" ? sources : table === "directory_settings" ? { enabled: false } : [],
        error: null,
      };
      const query = {
        select: () => query,
        order: () => query,
        limit: () => query,
        single: async () => result,
        // oxlint-disable-next-line unicorn/no-thenable -- Models the Supabase query builder.
        then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
      };
      return query;
    },
  });
  const markup = renderToStaticMarkup(
    await SourcesAdmin({ searchParams: Promise.resolve({ message: "Sources checked." }) }),
  );
  expect(markup).toContain("1 current jobs");
  expect(markup).toContain("Ecologist");
  expect(markup).toContain("Restore and check");
  expect(markup).toContain("access challenge");
  expect(sourceDocument(markup).querySelector('input[name="reviewed"]')?.hasAttribute("required")).toBe(true);
  expect(markup).toContain("Check next 3 untested sources");
  if (process.env.WILDJOBS_SOURCE_ADMIN_PREVIEW === "1") {
    let css = await readFile(new URL("../app/admin/sources/sources.module.css", import.meta.url), "utf8");
    for (const [name, mapped] of Object.entries(styles)) css = css.replaceAll(`.${name}`, `.${mapped}`);
    const global = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
    const output = join(tmpdir(), "wildjobs-admin-preview");
    await mkdir(output, { recursive: true });
    await writeFile(
      join(output, "index.html"),
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WildJobs source admin — test fixture</title><style>${global}\n${css}</style></head><body><p style="padding:1rem;background:#ffe9ad">Local interface fixture with synthetic jobs. No forms are connected.</p>${markup}</body></html>`,
    );
  }
});
