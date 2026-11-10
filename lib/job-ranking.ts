import type { Job } from "./jobs";
import { cleanJobTitle } from "./job-title";

const words = (value: string): string[] => value.toLocaleLowerCase("en-GB").match(/[\p{L}\p{N}]+/gu) ?? [];

export function recommendedJobScore(job: Job, query: string) {
  const queryWords = [...new Set(words(query))];
  if (!queryWords.length) return 0;
  const title = words(cleanJobTitle(job.title));
  const employer = new Set(words(job.organisation));
  const summary = new Set(words(job.summary));
  const skills = new Set(words(job.skills?.map(({ title }) => title).join(" ") ?? ""));
  const benefits = new Set(words(job.benefits?.map(({ title }) => title).join(" ") ?? ""));
  const phrase = queryWords.join(" ");
  return (
    (title.join(" ") === phrase ? 1000 : title.join(" ").includes(phrase) ? 500 : 0) +
    queryWords.reduce(
      (score, word) =>
        score +
        (title.includes(word) ? 40 : 0) +
        (employer.has(word) ? 15 : 0) +
        (summary.has(word) ? 3 : 0) +
        (skills.has(word) ? 25 : 0) +
        (benefits.has(word) ? 10 : 0),
      0,
    )
  );
}

export function compareRecommendedJobs(left: Job, right: Job, query: string) {
  return (
    recommendedJobScore(right, query) - recommendedJobScore(left, query) ||
    right.postedAt.localeCompare(left.postedAt) ||
    left.slug.localeCompare(right.slug)
  );
}
