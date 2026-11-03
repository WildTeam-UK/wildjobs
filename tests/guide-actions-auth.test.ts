import { expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  staff: vi.fn(),
  refresh: vi.fn(),
  collect: vi.fn(),
  publish: vi.fn(),
  alias: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../lib/auth/staff", () => ({ requireStaff: mocks.staff }));
vi.mock("../lib/guide-workflow", () => ({
  collectPilotAdverts: mocks.collect,
  publishPilotDraft: mocks.publish,
  refreshPilotDrafts: mocks.refresh,
  setRoleAlias: mocks.alias,
}));
import { approveGuide, collectGuideEvidence, refreshGuide, reviewRole } from "../app/admin/guides/actions";
it("rejects direct unauthenticated mutations before any guide or role write", async () => {
  mocks.staff.mockRejectedValue(new Error("Staff access required"));
  for (const action of [approveGuide, refreshGuide, reviewRole])
    await expect(action(new FormData())).rejects.toThrow("Staff access required");
  await expect(collectGuideEvidence()).rejects.toThrow("Staff access required");
  for (const write of [mocks.refresh, mocks.collect, mocks.publish, mocks.alias])
    expect(write).not.toHaveBeenCalled();
});
it("requires a supported family before a staff role-confirmation can reach the database", async () => {
  mocks.staff.mockResolvedValue(undefined);
  const form = new FormData();
  form.set("job_id", "1");
  form.set("decision", "include");
  form.set("role_slug", "arbitrary-unresearched-role");
  await expect(reviewRole(form)).rejects.toThrow("Choose an occupation family");
  expect(mocks.alias).not.toHaveBeenCalled();
});
