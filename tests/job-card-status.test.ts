import { describe, expect, it } from "vitest";

import { isClosingSoon, isNewJob } from "../lib/jobs";

const today = new Date("2026-10-30T12:00:00Z");

describe("job card status windows", () => {
  it("marks jobs published within the last seven days as new", () => {
    expect(isNewJob("2026-10-30", today)).toBe(true);
    expect(isNewJob("2026-10-24", today)).toBe(true);
    expect(isNewJob("2026-10-23", today)).toBe(false);
  });

  it("marks jobs closing within the next seven days as closing soon", () => {
    expect(isClosingSoon("2026-10-30", today)).toBe(true);
    expect(isClosingSoon("2026-11-05", today)).toBe(true);
    expect(isClosingSoon("2026-11-06", today)).toBe(false);
  });
});
