const listingLifetime = 30 * 24 * 60 * 60 * 1000;

export function closingDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.999Z` : value);
  return Number.isFinite(date.valueOf()) ? date.toISOString() : null;
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

export function directoryFacts(input: {
  workplace?: string | null;
  hours?: string | null;
  contract?: string | null;
}) {
  const hours = input.hours?.split(" · ") ?? [];
  return {
    workplace: input.workplace === "Remote" || input.workplace === "Hybrid" ? input.workplace : "On-site",
    contract_type: input.contract === "Fixed term" ? "Fixed term" : "Permanent",
    hours_type: hours.includes("Part time")
      ? hours.includes("Full time")
        ? "Full time · Part time"
        : "Part time"
      : "Full time",
  };
}
