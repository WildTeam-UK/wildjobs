import { describe, expect, it } from "vitest";

import { findDuplicateJob, type DuplicateCandidateJob } from "../lib/admin/duplicate-match";

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
          source_title: "Ecologist with Another Nature Trust",
        },
        jobs,
      ),
    ).toBeNull();
  });
});
