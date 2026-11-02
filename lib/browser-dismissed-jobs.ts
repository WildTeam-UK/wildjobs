"use client";

import { useSyncExternalStore } from "react";

export const DISMISSED_JOBS_KEY = "wildjobs_dismissed_jobs_v1";
const maximumDismissedJobs = 2000;
type Snapshot = Readonly<{ ids: readonly number[]; persistent: boolean }>;
const emptySnapshot: Snapshot = { ids: [], persistent: true };
let snapshot = emptySnapshot;
let cachedValue: string | null | undefined;
const listeners = new Set<() => void>();

export function parseDismissedJobIds(value: string | null): readonly number[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0))].slice(
      0,
      maximumDismissedJobs,
    );
  } catch {
    return [];
  }
}

function getSnapshot(): Snapshot {
  if (typeof window === "undefined") return emptySnapshot;
  try {
    const value = window.localStorage.getItem(DISMISSED_JOBS_KEY);
    if (value !== cachedValue) {
      cachedValue = value;
      snapshot = { ids: parseDismissedJobIds(value), persistent: true };
    }
  } catch {
    if (snapshot.persistent) snapshot = { ...snapshot, persistent: false };
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const storageChanged = (event: StorageEvent) => {
    if (event.key === DISMISSED_JOBS_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", storageChanged);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storageChanged);
  };
}

export function useBrowserDismissedJobs() {
  return useSyncExternalStore(subscribe, getSnapshot, () => emptySnapshot);
}

export function setBrowserJobDismissed(id: number, dismissed: boolean) {
  if (typeof window === "undefined" || !Number.isSafeInteger(id) || id < 1) return;
  const current = getSnapshot();
  const ids = current.ids.filter((value) => value !== id);
  writeIds(dismissed ? [id, ...ids].slice(0, maximumDismissedJobs) : ids);
}

function writeIds(ids: readonly number[]) {
  const value = JSON.stringify(ids);
  let persistent = true;
  try {
    window.localStorage.setItem(DISMISSED_JOBS_KEY, value);
    cachedValue = value;
  } catch {
    persistent = false;
  }
  snapshot = { ids, persistent };
  for (const listener of listeners) listener();
}

export function restoreAllBrowserDismissedJobs() {
  if (typeof window !== "undefined") writeIds([]);
}
