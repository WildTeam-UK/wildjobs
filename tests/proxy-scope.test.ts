import { expect, it, vi } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
vi.mock("../lib/supabase/proxy", () => ({ updateSession: vi.fn() }));
import { config } from "../proxy";

it("skips session work only for the public logo route and existing static assets", () => {
  const matches = (url: string) => unstable_doesMiddlewareMatch({ config, nextConfig: {}, url });
  expect(matches("/api/employer-logo?name=Nature&v=1234")).toBe(false);
  expect(matches("/_next/static/app.js")).toBe(false);
  for (const url of [
    "/",
    "/admin",
    "/account/saved",
    "/auth/confirm",
    "/api/automation/feed",
    "/api/employer-logo-private",
  ]) {
    expect(matches(url), url).toBe(true);
  }
});
