import { describe, expect, it } from "vitest";

import { hasAcceptedTerms, validateCredentials } from "../lib/auth/validation";

function credentials(email: string, password: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  return formData;
}

describe("validateCredentials", () => {
  it("normalises a valid email without changing the password", () => {
    expect(validateCredentials(credentials(" Person@Example.COM ", "a secure password"))).toEqual({
      data: { email: "person@example.com", password: "a secure password" },
    });
  });

  it("rejects an invalid email", () => {
    expect(validateCredentials(credentials("not-an-email", "a secure password"))).toEqual({
      error: "invalid-email",
    });
  });

  it("rejects a password shorter than ten characters", () => {
    expect(validateCredentials(credentials("person@example.com", "too-short"))).toEqual({
      error: "password-short",
    });
  });
});

describe("hasAcceptedTerms", () => {
  it("only accepts an explicitly selected checkbox", () => {
    const accepted = new FormData();
    accepted.set("terms", "on");

    expect(hasAcceptedTerms(accepted)).toBe(true);
    expect(hasAcceptedTerms(new FormData())).toBe(false);
  });
});
