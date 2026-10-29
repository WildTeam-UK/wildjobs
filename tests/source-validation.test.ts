import { describe, expect, it } from "vitest";

import {
  validateSource,
  validateSourceRecordLink,
  validateSourceRecordStatus,
  validateSourceStatus,
} from "../lib/admin/source-validation";

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

describe("source status validation", () => {
  it("accepts a valid source and explicit status", () => {
    expect(validateSourceStatus(sourceForm({ sourceId: "7", status: "paused" }))).toEqual({
      data: { isActive: false, sourceId: 7 },
    });
  });

  it("rejects invalid source references", () => {
    expect(validateSourceStatus(sourceForm({ sourceId: "0", status: "active" }))).toEqual({
      error: "invalid-source",
    });
  });

  it("rejects implicit or unknown statuses", () => {
    expect(validateSourceStatus(sourceForm({ sourceId: "7", status: "deleted" }))).toEqual({
      error: "invalid-status",
    });
  });
});

describe("source record status validation", () => {
  it("accepts an explicit triage status", () => {
    expect(validateSourceRecordStatus(sourceForm({ recordId: "42", status: "possible_duplicate" }))).toEqual({
      data: { recordId: 42, status: "possible_duplicate" },
    });
  });

  it("rejects invalid records and mapped status changes", () => {
    expect(validateSourceRecordStatus(sourceForm({ recordId: "nope", status: "ignored" }))).toEqual({
      error: "invalid-record",
    });
    expect(validateSourceRecordStatus(sourceForm({ recordId: "42", status: "mapped" }))).toEqual({
      error: "invalid-status",
    });
  });
});

describe("source record link validation", () => {
  it("accepts explicit positive record and job references", () => {
    expect(validateSourceRecordLink(sourceForm({ jobId: "11", recordId: "42" }))).toEqual({
      data: { jobId: 11, recordId: 42 },
    });
  });

  it("rejects missing or invalid references", () => {
    expect(validateSourceRecordLink(sourceForm({ jobId: "11", recordId: "nope" }))).toEqual({
      error: "invalid-record",
    });
    expect(validateSourceRecordLink(sourceForm({ jobId: "0", recordId: "42" }))).toEqual({
      error: "invalid-job",
    });
  });
});
