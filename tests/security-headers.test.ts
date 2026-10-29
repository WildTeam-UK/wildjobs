import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("security headers", () => {
  it("allows HTTPS employer logos without opening other resource types", async () => {
    const rules = await nextConfig.headers?.();
    const contentSecurityPolicy = rules
      ?.flatMap((rule) => rule.headers)
      .find((header) => header.key === "Content-Security-Policy")?.value;

    expect(contentSecurityPolicy).toContain("img-src 'self' data: https:");
    expect(contentSecurityPolicy).toContain("connect-src 'self'");
    expect(contentSecurityPolicy).not.toContain("connect-src 'self' https:");
  });
});
