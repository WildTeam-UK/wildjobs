import { describe, expect, it } from "vitest";

import { isCronRequestAuthorized } from "../lib/admin/cron-auth";

describe("scheduled import authentication", () => {
  const secret = "a-secure-cron-secret";

  it("accepts the matching Vercel bearer token", () => {
    expect(isCronRequestAuthorized(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects missing, short and mismatched credentials", () => {
    expect(isCronRequestAuthorized(null, secret)).toBe(false);
    expect(isCronRequestAuthorized(`Bearer ${secret}`, "too-short")).toBe(false);
    expect(isCronRequestAuthorized("Bearer something-else", secret)).toBe(false);
  });
});
