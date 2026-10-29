export type DuplicateCandidateJob = {
  canonicalUrls: readonly string[];
  employerName: string;
  id: number;
  status: string;
  title: string;
};

export type DuplicateCandidateSourceRecord = {
  canonicalUrl: string | null;
  employerName: string | null;
  id: number;
  sourceId: number;
  sourceName: string;
  sourceTitle: string | null;
};

type SourceRecordCandidate = {
  canonical_url: string | null;
  employer_name: string | null;
  id: number;
  source_id: number;
  source_title: string | null;
};

function normalizeWords(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-GB")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeRoleTitle(title: string, employerName: string) {
  const normalizedTitle = normalizeWords(title);
  const normalizedEmployer = normalizeWords(employerName);
  if (!normalizedEmployer) return normalizedTitle;

  for (const connector of [" with ", " at ", " for "]) {
    const suffix = `${connector}${normalizedEmployer}`;
    if (normalizedTitle.endsWith(suffix)) return normalizedTitle.slice(0, -suffix.length).trim();
  }

  return normalizedTitle;
}

export function findDuplicateJob(record: SourceRecordCandidate, jobs: readonly DuplicateCandidateJob[]) {
  if (record.canonical_url) {
    const sameAddress = jobs.find((job) => job.canonicalUrls.includes(record.canonical_url!));
    if (sameAddress) return { job: sameAddress, reason: "same_address" as const };
  }

  if (!record.source_title || !record.employer_name) return null;
  const employer = normalizeWords(record.employer_name);
  const title = normalizeRoleTitle(record.source_title, record.employer_name);
  if (!employer || title.length < 4) return null;

  const sameRole = jobs.find(
    (job) =>
      normalizeWords(job.employerName) === employer &&
      normalizeRoleTitle(job.title, job.employerName) === title,
  );

  return sameRole ? { job: sameRole, reason: "same_role" as const } : null;
}

export function findDuplicateSourceRecord(
  record: SourceRecordCandidate,
  candidates: readonly DuplicateCandidateSourceRecord[],
) {
  const otherSources = candidates.filter(
    (candidate) => candidate.id !== record.id && candidate.sourceId !== record.source_id,
  );

  if (record.canonical_url) {
    const sameAddress = otherSources.find((candidate) => candidate.canonicalUrl === record.canonical_url);
    if (sameAddress) return { reason: "same_address" as const, sourceRecord: sameAddress };
  }

  if (!record.source_title || !record.employer_name) return null;
  const employer = normalizeWords(record.employer_name);
  const title = normalizeRoleTitle(record.source_title, record.employer_name);
  if (!employer || title.length < 4) return null;

  const sameRole = otherSources.find(
    (candidate) =>
      candidate.employerName &&
      candidate.sourceTitle &&
      normalizeWords(candidate.employerName) === employer &&
      normalizeRoleTitle(candidate.sourceTitle, candidate.employerName) === title,
  );

  return sameRole ? { reason: "same_role" as const, sourceRecord: sameRole } : null;
}
