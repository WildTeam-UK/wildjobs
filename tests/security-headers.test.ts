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
    const connectSources = contentSecurityPolicy
      ?.split(";")
      .find((directive) => directive.trim().startsWith("connect-src"))
      ?.trim()
      .split(/\s+/);
    expect(connectSources).toEqual([
      "connect-src",
      "'self'",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://analytics.google.com",
    ]);
  });
});
