import { describe, expect, it } from "vitest";

import { validateSource } from "../lib/admin/source-validation";

function sourceForm(values: Record<string, string>) {
  const formData = new FormData();
  Object.entries(values).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("source validation", () => {
  it("accepts an approved HTTPS manual source", () => {
    const result = validateSource(
      sourceForm({
        authoritativeBaseUrl: "https://example.org/careers",
        isActive: "on",
        name: "Example conservation charity",
        sourceType: "manual_curation",
      }),
    );

    expect(result).toEqual({
      data: {
        authoritativeBaseUrl: "https://example.org/careers",
        isActive: true,
        name: "Example conservation charity",
        sourceType: "manual_curation",
      },
    });
  });

  it("rejects unknown source types", () => {
    const result = validateSource(
      sourceForm({
        authoritativeBaseUrl: "https://example.org/careers",
        name: "Example",
        sourceType: "scraper",
      }),
    );

    expect(result).toEqual({ error: "invalid-type" });
  });

  it("requires an HTTPS source URL", () => {
    const result = validateSource(
      sourceForm({
        authoritativeBaseUrl: "http://example.org/careers",
        name: "Example",
        sourceType: "feed",
      }),
    );

    expect(result).toEqual({ error: "invalid-url" });
  });
});
