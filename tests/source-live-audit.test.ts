import { mkdir, writeFile } from "node:fs/promises";
import { expect, it } from "vitest";
import { sourceCatalogue } from "../lib/source-catalogue";
import { readSource } from "../lib/source-reader";
import { sourceError } from "../lib/source-config";
import { fetchPublicSourceResource } from "../lib/directory-http";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FEED_URL } from "../lib/directory-feed";

// Opt-in, read-only integration audit. Never contacts the database or the AI provider.
it.skipIf(process.env.WILDJOBS_SOURCE_AUDIT !== "1")(
  "checks the proposed sources in bounded batches",
  async () => {
    const output = join(tmpdir(), "wildjobs-source-audit");
    const results = [];
    const filter = process.env.WILDJOBS_SOURCE_FILTER;
    const selected = sourceCatalogue.filter((s) => !filter || new RegExp(filter, "i").test(s.name));
    for (let offset = 0; offset < selected.length; offset += 3) {
      const batch = await Promise.all(
        selected.slice(offset, offset + 3).map(async (source) => {
          try {
            const result = await readSource(
              { url: source.url, name: source.name, config: source.config },
              process.env.WILDJOBS_SOURCE_CAPTURE === "1"
                ? {
                    transport: async (url, timeout, allow, request) => {
                      const resource = await fetchPublicSourceResource(url, timeout, allow, request);
                      await mkdir(join(output, "pages"), { recursive: true });
                      await writeFile(
                        join(output, "pages", `${createHash("sha256").update(url).digest("hex")}.json`),
                        JSON.stringify({
                          url,
                          resolvedUrl: resource.url,
                          type: resource.contentType,
                          text: resource.body.toString("utf8"),
                        }),
                      );
                      return resource;
                    },
                  }
                : {},
            );
            return {
              name: source.name,
              sourceUrl: source.url,
              region: source.region,
              status: "tested",
              ...result.preview,
            };
          } catch (error) {
            return {
              name: source.name,
              url: source.url,
              region: source.region,
              status: "needs_attention",
              ...sourceError(error),
              checkedAt: new Date().toISOString(),
            };
          }
        }),
      );
      results.push(...batch);
      for (const result of batch) console.log(JSON.stringify(result));
      await mkdir(output, { recursive: true });
      await writeFile(join(output, `${filter ? "filtered" : "all"}.json`), JSON.stringify(results, null, 2));
    }
    expect(results).toHaveLength(selected.length);
  },
  1800000,
);

it.skipIf(process.env.WILDJOBS_PRIMARY_FEED_AUDIT !== "1")(
  "preserves the existing EnvironmentJob feed through the shared reader",
  async () => {
    const result = await readSource({ url: FEED_URL, config: { kind: "rss" } });
    expect(result.preview.complete).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every((item) => new URL(item.source_url).hostname.endsWith("environmentjob.co.uk")),
    ).toBe(true);
    const output = join(tmpdir(), "wildjobs-source-audit");
    await mkdir(output, { recursive: true });
    await writeFile(join(output, "primary-feed.json"), JSON.stringify(result.preview, null, 2));
  },
  60000,
);
