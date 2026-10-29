import { describe, expect, it } from "vitest";

import { buildSourceRecordDraftDefaults } from "../lib/admin/source-record-draft";

const sourceRecord = {
  canonical_url: "https://example.org/jobs/ecologist",
  closes_at: "2026-11-18",
  employer_name: "Elan Valley Trust",
  location_text: "Powys",
  source_id: 9,
  source_title: "Ecologist with Elan Valley Trust",
  source_updated_at: "2026-10-29T08:00:00.000Z",
  summary: "Help restore habitats across the Elan Valley while supporting long-term ecological monitoring.",
};

describe("source record draft defaults", () => {
  it("carries trusted feed details into the review form", () => {
    expect(buildSourceRecordDraftDefaults(sourceRecord)).toEqual({
      applicationUrl: "https://example.org/jobs/ecologist",
      canonicalUrl: "https://example.org/jobs/ecologist",
      closesAt: "2026-11-18",
      countryCode: "GB",
      description:
        "Help restore habitats across the Elan Valley while supporting long-term ecological monitoring.",
      employerName: "Elan Valley Trust",
      locationText: "Powys",
      postedAt: "2026-10-29",
      sourceId: 9,
      summary:
        "Help restore habitats across the Elan Valley while supporting long-term ecological monitoring.",
      title: "Ecologist with Elan Valley Trust",
    });
  });

  it("shortens a long feed description without cutting the final word", () => {
    const defaults = buildSourceRecordDraftDefaults({
      ...sourceRecord,
      summary: `${"Habitat restoration and community engagement. ".repeat(16)}Final sentence.`,
    });

    expect(defaults.summary?.length).toBeLessThanOrEqual(500);
    expect(defaults.summary?.endsWith("…")).toBe(true);
    expect(defaults.summary).not.toMatch(/\beng…$/);
    expect(defaults.description?.endsWith("Final sentence.")).toBe(true);
  });

  it("does not use an incomplete feed description as the required summary", () => {
    expect(
      buildSourceRecordDraftDefaults({ ...sourceRecord, summary: "Short note" }).summary,
    ).toBeUndefined();
  });

  it("keeps a useful excerpt when a long description has no spaces", () => {
    const defaults = buildSourceRecordDraftDefaults({ ...sourceRecord, summary: "a".repeat(600) });

    expect(defaults.summary).toHaveLength(500);
  });
});
