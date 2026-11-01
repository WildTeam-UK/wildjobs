import { z } from "zod";

export const BRIEF_POLICY_VERSION = "wildteam-brief-v1";
const claim = z.object({
  text: z.string().trim().min(8).max(900),
  evidence: z.string().trim().min(8).max(800),
});
const fact = z.object({
  value: z.string().trim().max(500).nullable(),
  evidence: z.string().trim().max(800).nullable(),
});
const match = z.object({ termId: z.number().int().positive(), evidence: z.string().trim().min(4).max(500) });

export const briefOutputSchema = z.object({
  relevance: z.enum(["relevant", "uncertain", "irrelevant"]),
  summary: claim,
  overview: claim,
  conservationContext: claim,
  responsibilities: z.array(claim).max(6),
  essential: z.array(claim).max(6),
  desirable: z.array(claim).max(4),
  practical: z.array(claim).max(4),
  applicationChecklist: z.array(claim).max(4),
  fields: z.object({
    engagement_type: fact,
    workplace_type: fact,
    contract_type: fact,
    hours_type: fact,
    experience_level: fact,
    salary_text: fact,
    location_text: fact,
    country_code: fact,
  }),
  occupations: z.array(match).max(2),
  careerAreas: z.array(match).max(3),
  capabilities: z.array(match).max(6),
  benefits: z.array(match).max(8),
});
export type BriefOutput = z.infer<typeof briefOutputSchema>;

export function normalizedText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-GB");
}

export function evidencePresent(quote: string | null, source: string) {
  return Boolean(quote?.trim() && normalizedText(source).includes(normalizedText(quote)));
}

function numericFacts(text: string): string[] {
  return text.replace(/(?<=\d),(?=\d)/g, "").match(/\d+(?:\.\d+)?/g) ?? [];
}

export function copiedWordFraction(text: string, source: string) {
  const words = normalizedText(text).split(/\s+/);
  const original = normalizedText(source);
  const copied = new Set<number>();
  for (let i = 0; i + 16 <= words.length; i++) {
    if (original.includes(words.slice(i, i + 16).join(" "))) {
      for (let j = i; j < i + 16; j++) copied.add(j);
    }
  }
  return copied.size / Math.max(1, words.length);
}

export type BriefCatalogues = {
  occupations: { id: number; title: string; description?: string | null }[];
  careerAreas: { id: number; title: string; description?: string | null }[];
  capabilities: { id: number; title: string; description?: string | null }[];
  benefits: { id: number; title: string; description?: string | null }[];
};

export function validateJobBrief(output: BriefOutput, source: string, catalogues: BriefCatalogues) {
  const errors = new Set<string>();
  if (output.relevance !== "relevant") errors.add("conservation_relevance_uncertain");
  if (output.responsibilities.length < 2 || output.essential.length < 1)
    errors.add("insufficient_role_detail");
  const claims = [
    output.summary,
    output.overview,
    output.conservationContext,
    ...output.responsibilities,
    ...output.essential,
    ...output.desirable,
    ...output.practical,
    ...output.applicationChecklist,
  ];
  for (const item of claims) {
    if (!evidencePresent(item.evidence, source)) errors.add("unsupported_claim");
    const allowedNumbers = new Set(numericFacts(item.evidence));
    if (numericFacts(item.text).some((n) => !allowedNumbers.has(n))) errors.add("unsupported_number");
    if (/https?:|<[^>]+>/.test(item.text)) errors.add("unexpected_markup");
  }
  if (copiedWordFraction(claims.map((item) => item.text).join("\n"), source) > 0.35)
    errors.add("excessive_source_copy");
  if (normalizedText(output.summary.text) === normalizedText(output.overview.text))
    errors.add("repeated_summary");
  for (const [name, item] of Object.entries(output.fields)) {
    if (item.value !== null && !evidencePresent(item.evidence, source)) errors.add(`unsupported_${name}`);
    if (
      item.value !== null &&
      ["salary_text", "location_text"].includes(name) &&
      !evidencePresent(item.value, item.evidence ?? "")
    )
      errors.add(`changed_${name}`);
    if (
      item.value !== null &&
      numericFacts(item.value).some((n) => !numericFacts(item.evidence ?? "").includes(n))
    )
      errors.add(`unsupported_${name}_number`);
  }
  const choices: Record<string, readonly string[]> = {
    engagement_type: ["paid", "volunteer"],
    workplace_type: ["remote", "hybrid", "on_site"],
    contract_type: ["permanent", "fixed_term", "temporary", "internship", "apprenticeship"],
    hours_type: ["full_time", "part_time", "flexible"],
    experience_level: ["entry", "developing", "experienced", "leadership", "open"],
  };
  for (const [key, values] of Object.entries(choices)) {
    const field = output.fields[key as keyof typeof output.fields];
    if (field.value !== null && !values.includes(field.value)) errors.add(`invalid_${key}`);
  }
  if (output.fields.country_code.value && !/^[A-Z]{2}$/.test(output.fields.country_code.value))
    errors.add("invalid_country_code");
  if (!output.fields.engagement_type.value) errors.add("engagement_missing");
  if (!output.fields.location_text.value) errors.add("location_missing");
  if (
    output.fields.engagement_type.value === "volunteer" &&
    /\b(?:salary|salaried)\b/i.test(output.fields.engagement_type.evidence ?? "")
  )
    errors.add("engagement_conflict");
  for (const name of ["occupations", "careerAreas", "capabilities", "benefits"] as const) {
    const ids = new Set(catalogues[name].map((item) => item.id));
    if (output[name].some((item) => !ids.has(item.termId) || !evidencePresent(item.evidence, source)))
      errors.add(`invalid_${name}`);
  }
  if (!output.careerAreas.length) errors.add("career_area_missing");
  return [...errors];
}

export function normalizeVacancyUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("invalid_vacancy_url");
  url.hash = "";
  for (const key of new Set(url.searchParams.keys())) {
    if (/^(utm_.+|from_rss|fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.toString().replace(/\/$/, "");
}
