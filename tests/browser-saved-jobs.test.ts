import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseSavedJobIds } from "../lib/browser-saved-jobs";

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.resetModules());

describe("browser saved jobs", () => {
  it("rejects corrupt storage and limits saved IDs to valid unique integers", () => {
    expect(parseSavedJobIds("invalid")).toEqual([]);
    expect(parseSavedJobIds('{"id":12}')).toEqual([]);
    expect(parseSavedJobIds('[12,12,"13",null,-1,0,1.5,14]')).toEqual([12, 14]);
    expect(parseSavedJobIds(JSON.stringify(Array.from({ length: 600 }, (_, i) => i + 1)))).toHaveLength(500);
  });

  it("persists additions and removals without any account or network request", async () => {
    let stored: string | null = null;
    const setItem = vi.fn((_key: string, value: string) => {
      stored = value;
    });
    vi.stubGlobal("window", { localStorage: { getItem: () => stored, setItem } });
    const { toggleBrowserSavedJob, SAVED_JOBS_KEY } = await import("../lib/browser-saved-jobs");
    toggleBrowserSavedJob(12);
    toggleBrowserSavedJob(14);
    expect(setItem).toHaveBeenLastCalledWith(SAVED_JOBS_KEY, "[14,12]");
    toggleBrowserSavedJob(12);
    expect(stored).toBe("[14]");
  });

  it("keeps a usable in-memory shortlist when browser storage is blocked", async () => {
    const setItem = vi.fn(() => {
      throw new Error("Storage blocked");
    });
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem } });
    const { toggleBrowserSavedJob } = await import("../lib/browser-saved-jobs");
    expect(() => {
      toggleBrowserSavedJob(12);
      toggleBrowserSavedJob(14);
      toggleBrowserSavedJob(12);
    }).not.toThrow();
    expect(setItem).toHaveBeenLastCalledWith("wildjobs_saved_jobs_v1", "[14]");
  });
});
