import { afterEach, expect, it, vi } from "vitest";
import { animateJobDismissal } from "../lib/animate-job-dismissal";

afterEach(() => vi.unstubAllGlobals());

it("skips movement for reduced-motion users and unsupported browsers", async () => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
  const animate = vi.fn();
  const remove = vi.fn();
  await animateJobDismissal({ animate } as unknown as HTMLElement, remove);
  expect(remove).toHaveBeenCalledOnce();
  expect(animate).not.toHaveBeenCalled();
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  await expect(animateJobDismissal({} as HTMLElement, remove)).resolves.toBeUndefined();
});

it("does not block dismissal when an in-flight animation is cancelled", async () => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });
  vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());
  const cancel = vi.fn();
  const row = {
    dataset: { jobDismissal: "1" },
    inert: false,
    animate: vi.fn(),
    firstElementChild: { animate: () => ({ finished: Promise.reject(new Error("Cancelled")), cancel }) },
  };
  const remove = vi.fn();
  await expect(animateJobDismissal(row as unknown as HTMLElement, remove)).resolves.toBeUndefined();
  expect(remove).toHaveBeenCalledOnce();
  expect(row.inert).toBe(false);
  expect(cancel).toHaveBeenCalled();
});

it("animates surviving cards between measured positions after removal without a height or gap handoff", async () => {
  vi.stubGlobal("window", { matchMedia: () => ({ matches: false }), scrollY: 50 });
  let removed = false;
  const move = vi.fn();
  const next = {
    dataset: { jobDismissal: "2" },
    getBoundingClientRect: () => ({ top: removed ? 20 : 100 }),
    animate: move,
  };
  const cancel = vi.fn();
  const row = {
    dataset: { jobDismissal: "1" },
    getBoundingClientRect: () => ({ top: 0 }),
    inert: false,
    animate: vi.fn(),
    firstElementChild: { animate: () => ({ finished: Promise.resolve(), cancel }) },
    parentElement: { isConnected: true, querySelectorAll: () => (removed ? [next] : [row, next]) },
  };
  await animateJobDismissal(row as unknown as HTMLElement, () => {
    removed = true;
  });
  expect(move).toHaveBeenCalledWith(
    [
      { transform: "translateY(80px)", opacity: 1 },
      { transform: "translateY(0)", opacity: 1 },
    ],
    { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  expect(row.animate).not.toHaveBeenCalled();
  expect(cancel).toHaveBeenCalledOnce();
});
