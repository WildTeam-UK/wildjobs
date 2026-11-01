import type { CandidatePreferences } from "./candidate-preferences";
import {
  contractOptions,
  type ContractType,
  hoursOptions,
  type HoursType,
  workplaceOptions,
  type WorkplaceType,
} from "./candidate-preference-validation";
import type { Job } from "./jobs";

function normalise(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("en-GB")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function isWorkplaceType(value: string): value is WorkplaceType {
  return workplaceOptions.some((option) => option.value === value);
}

function isContractType(value: string): value is ContractType {
  return contractOptions.some((option) => option.value === value);
}

function isHoursType(value: string): value is HoursType {
  return hoursOptions.some((option) => option.value === value);
}

export function preferenceMatchScore(job: Job, preferences: CandidatePreferences) {
  let score = 0;

  const jobCareerAreas = job.careerAreas ?? [job.category];
  if (
    preferences.careerAreaTitles.some((title) =>
      jobCareerAreas.some((careerArea) => normalise(title) === normalise(careerArea)),
    )
  ) {
    score += 1;
  }
  const workplaceType = normalise(job.locationType);
  if (isWorkplaceType(workplaceType) && preferences.workplaceTypes.includes(workplaceType)) score += 1;
  const contractType = job.contractType ? normalise(job.contractType) : "";
  if (isContractType(contractType) && preferences.contractTypes.includes(contractType)) score += 1;
  const hoursTypes = (job.hoursTypes ?? [job.hoursType ?? job.employmentType]).map(normalise);
  if (hoursTypes.some((hoursType) => isHoursType(hoursType) && preferences.hoursTypes.includes(hoursType)))
    score += 1;
  if (
    preferences.preferredLocation &&
    job.location.toLocaleLowerCase("en-GB").includes(preferences.preferredLocation.toLocaleLowerCase("en-GB"))
  ) {
    score += 1;
  }
  if (preferences.experienceLevel !== "open" && job.experienceLevel === preferences.experienceLevel) {
    score += 1;
  }

  return score;
}

export function matchJobsToPreferences(items: readonly Job[], preferences: CandidatePreferences) {
  if (!preferences.hasPreferences) return [];

  return items
    .map((job) => ({ job, score: preferenceMatchScore(job, preferences) }))
    .filter((match) => match.score > 0)
    .toSorted(
      (left, right) =>
        right.score - left.score ||
        (right.job.publishedAt ?? right.job.postedAt).localeCompare(
          left.job.publishedAt ?? left.job.postedAt,
        ),
    )
    .map((match) => match.job);
}
