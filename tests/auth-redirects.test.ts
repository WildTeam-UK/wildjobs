import { describe, expect, it } from "vitest";

import { buildAuthPath, getSafeNextPath } from "../lib/auth/redirects";

describe("getSafeNextPath", () => {
  it("keeps internal paths and their query strings", () => {
    expect(getSafeNextPath("/jobs/example-role?intent=save")).toBe("/jobs/example-role?intent=save");
  });

  it.each(["https://example.com", "//example.com/path", "not-a-path", undefined])(
    "rejects unsafe destination %s",
    (value) => {
      expect(getSafeNextPath(value)).toBe("/account");
    },
  );
});

describe("buildAuthPath", () => {
  it("encodes messages and a safe return path", () => {
    expect(
      buildAuthPath("/sign-in", {
        error: "invalid-credentials",
        next: "/account/saved",
      }),
    ).toBe("/sign-in?error=invalid-credentials&next=%2Faccount%2Fsaved");
  });
});
