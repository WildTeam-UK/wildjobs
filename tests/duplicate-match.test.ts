import { describe, expect, it } from "vitest";

import {
  findDuplicateJob,
  findDuplicateSourceRecord,
  type DuplicateCandidateJob,
  type DuplicateCandidateSourceRecord,
} from "../lib/admin/duplicate-match";

const jobs: DuplicateCandidateJob[] = [
  {
    canonicalUrls: ["https://example.org/jobs/ecologist"],
    employerName: "Elan Valley Trust",
    id: 11,
    status: "published",
    title: "Ecologist",
  },
];

describe("source record duplicate matching", () => {
  it("prioritises an identical authoritative address", () => {
    expect(
      findDuplicateJob(
        {
          canonical_url: "https://example.org/jobs/ecologist",
          employer_name: "Different employer",
          id: 81,
          source_id: 9,
          source_title: "Different role",
        },
        jobs,
      ),
    ).toEqual({ job: jobs[0], reason: "same_address" });
  });

  it("recognises a feed title that includes the employer name", () => {
    expect(
      findDuplicateJob(
        {
          canonical_url: "https://listing.example/jobs/ecologist",
          employer_name: "Elan Valley Trust",
          id: 81,
          source_id: 9,
          source_title: "Ecologist with Elan Valley Trust",
        },
        jobs,
      ),
    ).toEqual({ job: jobs[0], reason: "same_role" });
  });

  it("normalises punctuation and accents without matching a different employer", () => {
    expect(
      findDuplicateJob(
        {
          canonical_url: null,
          employer_name: "Elán Valley Trust",
          id: 81,
          source_id: 9,
          source_title: "Ecologist — with Elán Valley Trust",
        },
        jobs,
      ),
    ).toEqual({ job: jobs[0], reason: "same_role" });

    expect(
      findDuplicateJob(
        {
          canonical_url: null,
          employer_name: "Another Nature Trust",
          id: 81,
          source_id: 9,
          source_title: "Ecologist with Another Nature Trust",
        },
        jobs,
      ),
    ).toBeNull();
  });
});

const sourceRecords: DuplicateCandidateSourceRecord[] = [
  {
    canonicalUrl: "https://example.org/jobs/ecologist",
    employerName: "Elan Valley Trust",
    id: 42,
    sourceId: 4,
    sourceName: "Partner vacancy feed",
    sourceTitle: "Ecologist",
  },
];

describe("cross-feed source record matching", () => {
  const record = {
    canonical_url: "https://listing.example/jobs/ecologist",
    employer_name: "Elan Valley Trust",
    id: 81,
    source_id: 9,
    source_title: "Ecologist with Elan Valley Trust",
  };

  it("finds the same vacancy before either source record becomes a job", () => {
    expect(findDuplicateSourceRecord(record, sourceRecords)).toEqual({
      reason: "same_role",
      sourceRecord: sourceRecords[0],
    });
  });

  it("prioritises an identical vacancy address across two sources", () => {
    expect(
      findDuplicateSourceRecord(
        { ...record, canonical_url: "https://example.org/jobs/ecologist" },
        sourceRecords,
      ),
    ).toEqual({ reason: "same_address", sourceRecord: sourceRecords[0] });
  });

  it("does not compare records from the same source", () => {
    expect(
      findDuplicateSourceRecord(record, [{ ...sourceRecords[0], sourceId: record.source_id }]),
    ).toBeNull();
  });
});
