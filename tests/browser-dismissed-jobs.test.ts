import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseDismissedJobIds } from "../lib/browser-dismissed-jobs";

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("browser dismissed jobs", () => {
  it("rejects corrupt data and invalid IDs, deduplicates and caps stored history", () => {
    expect(parseDismissedJobIds("broken")).toEqual([]);
    expect(parseDismissedJobIds('{"id":12}')).toEqual([]);
    expect(parseDismissedJobIds('[12,12,"13",null,-1,0,1.5,14]')).toEqual([12, 14]);
    expect(parseDismissedJobIds(JSON.stringify(Array.from({ length: 2100 }, (_, i) => i + 1)))).toHaveLength(
      2000,
    );
  });

  it("dismisses idempotently, restores individually, and leaves saved jobs untouched", async () => {
    const storage = new Map<string, string>([["wildjobs_saved_jobs_v1", "[12]"]]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    const { setBrowserJobDismissed, DISMISSED_JOBS_KEY } = await import("../lib/browser-dismissed-jobs");
    setBrowserJobDismissed(12, true);
    setBrowserJobDismissed(14, true);
    setBrowserJobDismissed(12, true);
    expect(storage.get(DISMISSED_JOBS_KEY)).toBe("[12,14]");
    setBrowserJobDismissed(12, false);
    expect(storage.get(DISMISSED_JOBS_KEY)).toBe("[14]");
    expect(storage.get("wildjobs_saved_jobs_v1")).toBe("[12]");
  });

  it("retains existing dismissals after reloading and restores all without changing other storage", async () => {
    const storage = new Map<string, string>([["wildjobs_dismissed_jobs_v1", "[12,14]"]]);
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    const { setBrowserJobDismissed, restoreAllBrowserDismissedJobs, DISMISSED_JOBS_KEY } =
      await import("../lib/browser-dismissed-jobs");
    setBrowserJobDismissed(16, true);
    expect(storage.get(DISMISSED_JOBS_KEY)).toBe("[16,12,14]");
    restoreAllBrowserDismissedJobs();
    expect(storage.get(DISMISSED_JOBS_KEY)).toBe("[]");
  });

  it("ignores invalid mutation IDs", async () => {
    const setItem = vi.fn();
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem } });
    const { setBrowserJobDismissed } = await import("../lib/browser-dismissed-jobs");
    for (const id of [0, -1, NaN, Infinity, 1.5]) setBrowserJobDismissed(id, true);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("keeps dismiss and undo usable when storage throws", async () => {
    const setItem = vi.fn(() => {
      throw new Error("Storage blocked");
    });
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("Storage blocked");
        },
        setItem,
      },
    });
    const { setBrowserJobDismissed, restoreAllBrowserDismissedJobs, DISMISSED_JOBS_KEY } =
      await import("../lib/browser-dismissed-jobs");
    setBrowserJobDismissed(12, true);
    setBrowserJobDismissed(14, true);
    expect(setItem).toHaveBeenLastCalledWith(DISMISSED_JOBS_KEY, "[14,12]");
    setBrowserJobDismissed(12, false);
    expect(setItem).toHaveBeenLastCalledWith(DISMISSED_JOBS_KEY, "[14]");
    expect(restoreAllBrowserDismissedJobs).not.toThrow();
  });
});
