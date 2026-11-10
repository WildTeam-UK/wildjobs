import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ staff: vi.fn(), client: vi.fn(), read: vi.fn(), sync: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../lib/auth/staff", () => ({ requireAdministrator: mocks.staff }));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: mocks.client }));
vi.mock("../lib/source-reader", () => ({ readSource: mocks.read }));
vi.mock("../lib/directory-sync", () => ({ syncDirectory: mocks.sync }));
import { addSource, changeSource, queueCatalogue, checkNextBatch } from "../app/admin/sources/actions";
it("keeps all direct source mutations and batch checks administrator-only", async () => {
  mocks.staff.mockRejectedValue(new Error("Administrator access required"));
  for (const action of [addSource, changeSource])
    await expect(action(new FormData())).rejects.toThrow("Administrator access required");
  for (const action of [queueCatalogue, checkNextBatch])
    await expect(action()).rejects.toThrow("Administrator access required");
  for (const operation of [mocks.client, mocks.read, mocks.sync]) expect(operation).not.toHaveBeenCalled();
});
