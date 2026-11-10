const listingLifetime = 30 * 24 * 60 * 60 * 1000;

export function closingDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : null;
}

export function advertClosingDate(text: string) {
  const prefix =
    "(?:closing date(?: for applications)?|application deadline|apply by|deadline(?: for submitting (?:your |an )?application)?(?: is)?|applications?[\\s\\S]{0,220}?(?:sent|received|submitted)[\\s\\S]{0,180}?(?:by|before|no later than))";
  const date = text
    .match(
      new RegExp(
        prefix +
          "\\s*[:–-]?\\s*(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s+)?(\\d{1,2}(?:st|nd|rd|th)?\\s+[A-Za-z]+\\s+\\d{4}|[A-Za-z]+\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})",
        "i",
      ),
    )?.[1]
    ?.replace(/(\d)(?:st|nd|rd|th)\b/g, "$1")
    .replace(/,/g, "");
  if (!date) return null;
  let iso = date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parts = date.split(/\s+/),
      day = /^\d+$/.test(parts[0]) ? parts[0] : parts[1],
      name = /^\d+$/.test(parts[0]) ? parts[1] : parts[0];
    const month =
      ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(
        name.slice(0, 3).toLowerCase(),
      ) + 1;
    if (!month) return null;
    iso = `${parts[2]}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const result = closingDate(iso);
  return result?.startsWith(iso) ? result : null;
}

export function directoryDeadline(postedAt: string, closesAt?: string | null) {
  return closesAt ?? new Date(new Date(postedAt).valueOf() + listingLifetime).toISOString();
}

export function isDirectoryJobLive(
  job: { is_active: boolean; posted_at: string; closes_at?: string | null },
  now = new Date(),
) {
  return job.is_active && new Date(directoryDeadline(job.posted_at, job.closes_at)).valueOf() > now.valueOf();
}

// Shared by the public listing query and saved-job eligibility policy's equivalent SQL.
export function liveDirectoryDateFilter(now = new Date()) {
  const cutoff = new Date(now.valueOf() - listingLifetime).toISOString();
  return `closes_at.gt.${now.toISOString()},and(closes_at.is.null,posted_at.gt.${cutoff})`;
}

export function directoryFacts(
  input: {
    workplace?: string | null;
    hours?: string | null;
    contract?: string | null;
  },
  preserveUnknown = false,
) {
  const hours = input.hours?.split(" · ") ?? [];
  return {
    workplace:
      preserveUnknown && input.workplace === "Not specified"
        ? "Not specified"
        : input.workplace === "Remote" || input.workplace === "Hybrid"
          ? input.workplace
          : "On-site",
    contract_type:
      preserveUnknown && input.contract === "Not specified"
        ? "Not specified"
        : input.contract === "Fixed term"
          ? "Fixed term"
          : "Permanent",
    hours_type:
      preserveUnknown && input.hours === "Not specified"
        ? "Not specified"
        : hours.includes("Part time")
          ? hours.includes("Full time")
            ? "Full time · Part time"
            : "Part time"
          : "Full time",
  };
}
