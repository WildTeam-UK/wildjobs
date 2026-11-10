import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), load: vi.fn() }));
vi.mock("../lib/organisation-logo", () => ({ findOrganisationLogo: mocks.find }));
vi.mock("../lib/directory-http", () => ({ loadPublicLogo: mocks.load }));
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
  mocks.load.mockResolvedValue({ png: Buffer.from("verified") });
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

it("replaces a blank stored logo using a compare-and-set update", async () => {
  const { db, q } = client("https://nature.example/white.svg");
  mocks.load.mockResolvedValue(null);
  mocks.find.mockResolvedValue("https://nature.example/green.png");
  expect(await repairEmployerLogo(db, "Nature Trust", "https://nature.example")).toBe(true);
  expect(q.eq).toHaveBeenCalledWith("logo_url", "https://nature.example/white.svg");
  expect(q.update).toHaveBeenCalledWith({ logo_url: "https://nature.example/green.png" });
});
it("preserves the stored choice when validation fails because of a network error", async () => {
  const { db, q } = client("https://nature.example/green.png");
  mocks.load.mockRejectedValue(new Error("Timeout"));
  expect(await repairEmployerLogo(db, "Nature Trust", "https://nature.example")).toBe(false);
  expect(q.update).not.toHaveBeenCalled();
});
