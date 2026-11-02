import { afterEach, expect, it, vi } from "vitest";
import { animateJobDismissal } from "../lib/animate-job-dismissal";

afterEach(() => vi.unstubAllGlobals());

it("skips movement for reduced-motion users and unsupported browsers", async () => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
  const animate = vi.fn();
  await animateJobDismissal({ animate } as unknown as HTMLElement);
  expect(animate).not.toHaveBeenCalled();
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  await expect(animateJobDismissal({} as HTMLElement)).resolves.toBeUndefined();
});

it("does not block dismissal when an in-flight animation is cancelled", async () => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());
  const cancel = vi.fn();
  const row = {
    inert: false,
    animate: vi.fn(),
    firstElementChild: { animate: () => ({ finished: Promise.reject(new Error("Cancelled")), cancel }) },
  };
  await expect(animateJobDismissal(row as unknown as HTMLElement)).resolves.toBeUndefined();
  expect(row.inert).toBe(false);
  expect(cancel).toHaveBeenCalled();
});
