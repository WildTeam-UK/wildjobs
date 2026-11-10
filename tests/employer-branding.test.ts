import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock("../lib/organisation-logo", () => ({ findOrganisationLogo: mocks.find }));
import { repairEmployerLogo } from "../lib/employer-branding";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";
beforeEach(() => vi.resetAllMocks());
function client(logo: string | null, website = "https://nature.example") {
  const q = {
    select: vi.fn(() => q),
    eq: vi.fn(() => q),
    is: vi.fn(() => q),
    update: vi.fn(() => q),
    single: vi.fn(async () => ({ data: { logo_url: logo, website_url: website }, error: null })),
    // oxlint-disable-next-line unicorn/no-thenable -- Models the Supabase query builder.
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
  };
  return { q, db: { from: vi.fn(() => q) } as unknown as SupabaseClient<Database> };
}
it("repairs a missing employer logo without overwriting an administrator choice", async () => {
  const { db, q } = client(null);
  mocks.find.mockResolvedValue("https://nature.example/logo.svg");
  expect(await repairEmployerLogo(db, "Nature Trust", "https://nature.example")).toBe(true);
  expect(q.update).toHaveBeenCalledWith({ logo_url: "https://nature.example/logo.svg" });
  expect(q.is).toHaveBeenCalledWith("logo_url", null);
  expect(
    await repairEmployerLogo(
      client("https://custom.example/logo.svg").db,
      "Nature Trust",
      "https://nature.example",
    ),
  ).toBe(false);
  expect(mocks.find).toHaveBeenCalledTimes(1);
});
it("keeps branding failure separate and rejects a stale website", async () => {
  mocks.find.mockRejectedValue(new Error("Unavailable"));
  expect(await repairEmployerLogo(client(null).db, "Nature Trust", "https://nature.example")).toBe(false);
  expect(
    await repairEmployerLogo(
      client(null, "https://changed.example").db,
      "Nature Trust",
      "https://nature.example",
    ),
  ).toBe(false);
  expect(mocks.find).toHaveBeenCalledTimes(1);
});
