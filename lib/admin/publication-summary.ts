export const PUBLICATION_SUMMARY_MAX_LENGTH = 500;

export function shouldGenerateAiSummary(value: string | null) {
  const length = value?.trim().length ?? 0;
  return length < 20 || length > PUBLICATION_SUMMARY_MAX_LENGTH;
}

export function cleanPublicationSummary(value: string, maximum = PUBLICATION_SUMMARY_MAX_LENGTH) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maximum) return clean;

  const candidate = clean.slice(0, Math.max(1, maximum - 1)).trimEnd();
  const sentenceEnd = Math.max(
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf("! "),
    candidate.lastIndexOf("? "),
  );
  if (sentenceEnd >= Math.floor(maximum * 0.4)) return candidate.slice(0, sentenceEnd + 1);

  const wordEnd = candidate.lastIndexOf(" ");
  return `${candidate.slice(0, wordEnd > 0 ? wordEnd : candidate.length).trimEnd()}…`;
}
