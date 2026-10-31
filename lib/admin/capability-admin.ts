export type CapabilityCoverageInput = {
  classifiedJobIds: readonly number[];
  matchedJobIds: readonly number[];
  publishedJobIds: readonly number[];
};

export function uniqueIds(values: readonly (number | null)[]) {
  return [...new Set(values.filter((value): value is number => value !== null))];
}

export function capabilityCoverage(input: CapabilityCoverageInput) {
  const published = new Set(input.publishedJobIds);
  const classified = new Set(input.classifiedJobIds.filter((jobId) => published.has(jobId)));
  const matched = new Set(input.matchedJobIds.filter((jobId) => published.has(jobId)));

  return {
    awaitingClassification: Math.max(0, published.size - classified.size),
    classifiedWithoutMatch: [...classified].filter((jobId) => !matched.has(jobId)).length,
    matchedJobs: matched.size,
    publishedJobs: published.size,
  };
}
