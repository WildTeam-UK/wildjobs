import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ staff: vi.fn(), client: vi.fn(), image: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../lib/auth/staff", () => ({ requireStaff: mocks.staff }));
vi.mock("../lib/supabase/trusted", () => ({ createTrustedClient: mocks.client }));
vi.mock("../lib/directory-http", () => ({ verifyPublicImage: mocks.image }));
vi.mock("../lib/public-data-cache", () => ({ invalidatePublicData: vi.fn() }));

import { updateCourse } from "../app/admin/course-actions";
import { updateLogo } from "../app/admin/logo-actions";

it("keeps the separated course and logo actions staff-only before reads, writes or image fetching", async () => {
  mocks.staff.mockRejectedValue(new Error("Staff access required"));
  for (const action of [updateCourse, updateLogo])
    await expect(action(new FormData())).rejects.toThrow("Staff access required");
  expect(mocks.client).not.toHaveBeenCalled();
  expect(mocks.image).not.toHaveBeenCalled();
});
