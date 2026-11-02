"use client";

import { useSyncExternalStore } from "react";

export const SAVED_JOBS_KEY = "wildjobs_saved_jobs_v1";
const maximumSavedJobs = 500;
type SavedJobsSnapshot = Readonly<{ ids: readonly number[]; persistent: boolean }>;
const emptySnapshot: SavedJobsSnapshot = { ids: [], persistent: true };
let snapshot = emptySnapshot;
let cachedValue: string | null | undefined;
const listeners = new Set<() => void>();

export function parseSavedJobIds(value: string | null): readonly number[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0))].slice(
      0,
      maximumSavedJobs,
    );
  } catch {
    return [];
  }
}

function getSnapshot(): SavedJobsSnapshot {
  if (typeof window === "undefined") return emptySnapshot;
  try {
    const value = window.localStorage.getItem(SAVED_JOBS_KEY);
    if (value !== cachedValue) {
      cachedValue = value;
      snapshot = { ids: parseSavedJobIds(value), persistent: true };
    }
  } catch {
    if (snapshot.persistent) snapshot = { ...snapshot, persistent: false };
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const storageChanged = (event: StorageEvent) => {
    if (event.key === SAVED_JOBS_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", storageChanged);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storageChanged);
  };
}

export function useBrowserSavedJobs() {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptySnapshot);
}

export function toggleBrowserSavedJob(id: number) {
  if (typeof window === "undefined" || !Number.isSafeInteger(id) || id < 1) return;
  const current = getSnapshot();
  const ids = current.ids.includes(id)
    ? current.ids.filter((savedId) => savedId !== id)
    : [id, ...current.ids].slice(0, maximumSavedJobs);
  const value = JSON.stringify(ids);
  let persistent = true;
  try {
    window.localStorage.setItem(SAVED_JOBS_KEY, value);
    cachedValue = value;
  } catch {
    persistent = false;
  }
  snapshot = { ids, persistent };
  for (const listener of listeners) listener();
}
