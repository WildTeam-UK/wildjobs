import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ single: vi.fn(), load: vi.fn(), eq: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("../lib/directory-http", () => ({ loadPublicLogo: mocks.load }));
vi.mock("../lib/supabase/public", () => ({
  createPublicClient: () => ({ from: () => ({ select: () => ({ eq: mocks.eq }) }) }),
}));
import { GET } from "../app/api/employer-logo/route";
import { employerLogoPath } from "../lib/employer-logo-path";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.eq.mockReturnValue({ maybeSingle: mocks.single });
  mocks.single.mockResolvedValue({ data: { logo_url: "https://nature.example/logo.png" }, error: null });
});
const request = () =>
  new Request("https://jobs.example" + employerLogoPath("Nature Trust", "https://nature.example/logo.png"));
it("serves a checked PNG only for branding stored against that employer", async () => {
  mocks.load.mockResolvedValue({ png: Buffer.from("safe png") });
  const response = await GET(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(await response.text()).toBe("safe png");
  expect(mocks.load).toHaveBeenCalledWith("https://nature.example/logo.png");
});
it("rejects blank logos, leaving the image error handler to show initials", async () => {
  mocks.load.mockResolvedValue(null);
  expect((await GET(request())).status).toBe(404);
});
it("does not fetch arbitrary query URLs or a mismatched logo version", async () => {
  expect((await GET(new Request("https://jobs.example/api/employer-logo?url=http://127.0.0.1"))).status).toBe(
    400,
  );
  expect(
    (await GET(new Request("https://jobs.example/api/employer-logo?name=Nature&v=deadbeef"))).status,
  ).toBe(404);
  expect(mocks.load).not.toHaveBeenCalled();
});
it("does not cache transient network failures", async () => {
  mocks.load.mockRejectedValue(new Error("Timeout"));
  const response = await GET(request());
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
});
