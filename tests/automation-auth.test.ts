import { describe, expect, it } from "vitest";

import { isAutomationRequestAuthorized } from "../lib/admin/automation-auth";

describe("source automation authentication", () => {
  const secret = "a-secure-automation-secret";

  it("accepts the matching Supabase heartbeat bearer token", () => {
    expect(isAutomationRequestAuthorized(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects missing, short and mismatched credentials", () => {
    expect(isAutomationRequestAuthorized(null, secret)).toBe(false);
    expect(isAutomationRequestAuthorized(`Bearer ${secret}`, "too-short")).toBe(false);
    expect(isAutomationRequestAuthorized("Bearer something-else", secret)).toBe(false);
  });
});
