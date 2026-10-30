import { getSafeJobSlug, getSafeNextPath } from "./redirects";

export type SaveJobIntent = Readonly<{
  jobSlug: string;
  next: string;
}>;

type IntentValues = {
  intent?: unknown;
  job?: unknown;
  next?: unknown;
};

export function getSaveJobIntent(values: IntentValues): SaveJobIntent | null {
  if (values.intent !== "save") return null;

  const jobSlug = getSafeJobSlug(values.job);
  if (!jobSlug) return null;

  return {
    jobSlug,
    next: getSafeNextPath(values.next, `/jobs/${jobSlug}`),
  };
}

export function addSaveStatus(path: string, status: "error" | "removed" | "saved") {
  const url = new URL(getSafeNextPath(path, "/"), "https://wildjobs.invalid");
  url.searchParams.set("save", status);
  return `${url.pathname}${url.search}${url.hash}`;
}
