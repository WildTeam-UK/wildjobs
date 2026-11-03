import { isDirectoryJobLive } from "./directory-lifecycle";
import { parseSalary } from "./job-salary";
import { matchCareerRole, type RoleAlias, type RoleMatch } from "./career-role-matching";

export type GuideJob = Readonly<{
  feed_hash?: string;
  salary_full_time_evidence?: boolean;
  salary_evidence_hash?: string | null;
  id: number;
  title: string;
  organisation_name: string;
  source_url: string;
  source_name: string;
  sector_slugs: readonly string[];
  feed_text: string;
  salary_text: string;
  country_code: string | null;
  hours_type: string | null;
  engagement_type: string | null;
  posted_at: string;
  first_seen_at: string;
  closes_at: string | null;
  is_active: boolean;
  merged_into: number | null;
}>;
export type GuideScope = { kind: "sector" | "career"; matchSlug: string };
export const guideMinimumAdverts = 10;
export const guideMinimumSalarySample = 5;

export function hasFullTimeEvidence(text: string) {
  return /\bfull[\s-]*time\b(?!\s+(?:degree|study|education))|\b(?:35|37|37\.5|40)\s*(?:hours|hrs)\s*(?:per|a|\/)\s*week\b/i.test(
    text,
  );
}

export function guideWindowStart(now: Date) {
  // Clamp leap-day rather than letting the date overflow into the following month.
  const start = new Date(now);
  const month = start.getUTCMonth();
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  if (start.getUTCMonth() !== month) start.setUTCDate(0);
  return start.toISOString();
}

export function guideMatches(job: GuideJob, scope: GuideScope, aliases: readonly RoleAlias[] = []) {
  return scope.kind === "sector"
    ? job.sector_slugs.includes(scope.matchSlug)
    : matchCareerRole(job.title, job.feed_text, aliases).roleSlug === scope.matchSlug;
}

function median(values: number[]) {
  if (values.length < guideMinimumSalarySample) return null;
  const sorted = values.toSorted((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function buildGuideMarket(
  jobs: readonly GuideJob[],
  scope: GuideScope,
  aliases: readonly RoleAlias[] = [],
  now = new Date(),
) {
  const start = guideWindowStart(now);
  const unique = [...new Map(jobs.filter((j) => j.merged_into === null).map((j) => [j.id, j])).values()];
  const matched = unique.filter((j) => guideMatches(j, scope, aliases));
  const history = matched.filter(
    (j) => new Date(j.posted_at) >= new Date(start) && new Date(j.posted_at) <= now,
  );
  const current = matched.filter((j) => new Date(j.posted_at) <= now && isDirectoryJobLive(j, now));
  const evidence = history.filter((j) => j.feed_text.trim().length >= 200);
  const groups = new Map<RoleMatch["seniority"], number[]>();
  const salaries: number[] = [];
  for (const job of history) {
    const salary = parseSalary(job.salary_text, { defaultAnnual: false });
    const fullTimeEvidence =
      hasFullTimeEvidence(job.feed_text) ||
      Boolean(job.salary_full_time_evidence && job.feed_hash && job.salary_evidence_hash === job.feed_hash);
    if (
      job.country_code !== "GB" ||
      job.engagement_type !== "Paid" ||
      job.hours_type !== "Full time" ||
      !fullTimeEvidence ||
      /pro[\s-]*rata/i.test(job.salary_text) ||
      salary.currency !== "GBP" ||
      salary.period !== "per year" ||
      salary.minimum === null
    )
      continue;
    const careerLevel = matchCareerRole(job.title, job.feed_text, aliases).seniority;
    // Multi-grade adverts cannot establish the salary of any one seniority band.
    if (careerLevel === "mixed") continue;
    const level = scope.kind === "career" ? careerLevel : "unspecified";
    salaries.push(salary.minimum);
    groups.set(level, [...(groups.get(level) ?? []), salary.minimum]);
  }
  const employers = new Set(
    history
      .map((j) => j.organisation_name.trim().toLocaleLowerCase("en-GB"))
      .filter((name) => name && name !== "organisation not stated"),
  );
  const evidenceEmployers = new Set(
    evidence
      .map((j) => j.organisation_name.trim().toLocaleLowerCase("en-GB"))
      .filter((name) => name && name !== "organisation not stated"),
  );
  const review = unique.filter(
    (j) =>
      new Date(j.posted_at) >= new Date(start) &&
      new Date(j.posted_at) <= now &&
      matchCareerRole(j.title, j.feed_text, aliases).status === "review",
  );
  return {
    start,
    asOf: now.toISOString(),
    history,
    current,
    evidence,
    employers: employers.size,
    observedFrom:
      history
        .map((j) => j.first_seen_at)
        .filter(Boolean)
        .toSorted()[0] ?? null,
    salaryMedian: median(salaries),
    salaryCount: salaries.length,
    salaryGroups: [...groups].map(([level, values]) => ({
      level,
      count: values.length,
      median: median(values),
    })),
    draftEligible: evidence.length >= guideMinimumAdverts && evidenceEmployers.size >= 2,
    review,
  };
}
