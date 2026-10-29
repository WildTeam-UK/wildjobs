import { describe, expect, it } from "vitest";

import { cleanPublicationSummary, shouldGenerateAiSummary } from "../lib/admin/publication-summary";

describe("publication summaries", () => {
  it("requests a concise AI summary until a bounded generated summary exists", () => {
    expect(shouldGenerateAiSummary(null)).toBe(true);
    expect(shouldGenerateAiSummary("A".repeat(321))).toBe(true);
    expect(shouldGenerateAiSummary("A useful concise vacancy summary.")).toBe(false);
  });

  it("prefers a complete sentence within the public limit", () => {
    const result = cleanPublicationSummary(`${"A".repeat(260)}. ${"B".repeat(260)}.`);

    expect(result).toBe(`${"A".repeat(260)}.`);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it("falls back to a whole word with an ellipsis", () => {
    const result = cleanPublicationSummary("word ".repeat(150));

    expect(result.endsWith("word…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(500);
  });
});
