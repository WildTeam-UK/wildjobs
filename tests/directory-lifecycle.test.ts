import { describe, expect, it } from "vitest";
import {
  closingDate,
  directoryDeadline,
  directoryFacts,
  isDirectoryJobLive,
  liveDirectoryDateFilter,
} from "../lib/directory-lifecycle";

describe("directory retirement", () => {
  const posted = "2026-10-01T12:00:00.000Z";
  it("retires at exactly 30 elapsed days rather than the latest import time", () => {
    const job = { is_active: true, posted_at: posted, last_seen_at: "2026-11-01T00:00:00Z" };
    expect(directoryDeadline(posted)).toBe("2026-10-31T12:00:00.000Z");
    expect(isDirectoryJobLive(job, new Date("2026-10-31T11:59:59.999Z"))).toBe(true);
    expect(isDirectoryJobLive(job, new Date("2026-10-31T12:00:00Z"))).toBe(false);
  });
  it("uses the advertised deadline even when sooner or later than 30 days", () => {
    expect(
      isDirectoryJobLive(
        { is_active: true, posted_at: posted, closes_at: "2026-10-15T00:00:00Z" },
        new Date("2026-10-16"),
      ),
    ).toBe(false);
    expect(
      isDirectoryJobLive(
        { is_active: true, posted_at: posted, closes_at: "2026-11-15T00:00:00Z" },
        new Date("2026-11-01"),
      ),
    ).toBe(true);
  });
  it("keeps removed jobs unavailable even before their deadline", () => {
    expect(isDirectoryJobLive({ is_active: false, posted_at: posted }, new Date("2026-10-02"))).toBe(false);
  });
  it("excludes expired dates from the public database query", () => {
    expect(liveDirectoryDateFilter(new Date("2026-10-31T12:00:00Z"))).toBe(
      "closes_at.gt.2026-10-31T12:00:00.000Z,and(closes_at.is.null,posted_at.gt.2026-10-01T12:00:00.000Z)",
    );
  });
  it("normalises source dates and ignores missing or invalid ones", () => {
    expect(closingDate("2026-11-08")).toBe("2026-11-08T23:59:59.999Z");
    expect(closingDate("2026-11-08T23:55:00Z")).toBe("2026-11-08T23:55:00.000Z");
    expect(closingDate("invalid")).toBeNull();
    expect(closingDate(null)).toBeNull();
  });
});
describe("directory working defaults", () => {
  it("applies the agreed defaults to absent or unknown facts", () => {
    expect(directoryFacts({ workplace: "Not specified", hours: "Flexible", contract: null })).toEqual({
      workplace: "On-site",
      hours_type: "Full time",
      contract_type: "Permanent",
    });
  });
  it("retains explicit alternatives and fixed-term remote roles", () => {
    expect(
      directoryFacts({ workplace: "Remote", hours: "Full time · Part time", contract: "Fixed term" }),
    ).toEqual({ workplace: "Remote", hours_type: "Full time · Part time", contract_type: "Fixed term" });
    expect(directoryFacts({ workplace: "Hybrid", hours: "Part time" }).hours_type).toBe("Part time");
  });
});
