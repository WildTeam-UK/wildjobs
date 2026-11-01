import { describe, expect, it } from "vitest";

import { isClosingSoon, isNewJob, postedAgoLabel } from "../lib/jobs";

const today = new Date("2026-10-30T12:00:00Z");

describe("job card status windows", () => {
  it("marks jobs published within the last seven days as new", () => {
    expect(isNewJob("2026-10-30", today)).toBe(true);
    expect(isNewJob("2026-10-30T11:00:00Z", today)).toBe(true);
    expect(isNewJob("2026-10-24", today)).toBe(true);
    expect(isNewJob("2026-10-23", today)).toBe(false);
  });

  it("marks jobs closing within the next seven days as closing soon", () => {
    expect(isClosingSoon("2026-10-30", today)).toBe(true);
    expect(isClosingSoon("2026-11-05", today)).toBe(true);
    expect(isClosingSoon("2026-11-06", today)).toBe(false);
  });

  it("describes how recently a job was published", () => {
    expect(postedAgoLabel("2026-10-30T11:32:00Z", today)).toBe("Posted 28 minutes ago");
    expect(postedAgoLabel("2026-10-30T09:00:00Z", today)).toBe("Posted 3 hours ago");
    expect(postedAgoLabel("2026-10-18T12:00:00Z", today)).toBe("Posted 12 days ago");
  });
});
