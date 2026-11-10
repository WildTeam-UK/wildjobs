import catalogue from "./job-attribute-catalogue.json";
import { plainText } from "./directory-text";

export const jobAttributeVersion = 1;
export const jobSkills = catalogue.skills;
export const jobBenefits = catalogue.benefits;
type Selection = { slug: string; evidence: string };
const normalise = (value: string) =>
  plainText(value)
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export function groundedJobAttributes(skills: unknown, benefits: unknown, advert: string) {
  const source = normalise(advert);
  const sentences = plainText(advert)
    .split(/[.!?;]+/)
    .map(normalise);
  const collect = (input: unknown, terms: typeof jobSkills, limit: number) => {
    const grounded = new Map<string, string>();
    for (const value of Array.isArray(input) ? input : []) {
      if (!value || typeof value !== "object") continue;
      const item = value as Selection;
      const term = terms.find((term) => term.slug === item.slug);
      if (!term || typeof item.evidence !== "string" || item.evidence.length > 240) continue;
      const excerpt = normalise(item.evidence);
      if (excerpt.length < 8 || !source.includes(excerpt)) continue;
      // Conservative omission is preferable to turning a stated exclusion into a filter.
      if (/\b(?:no|not|without|unavailable|cannot|can t|don t|doesn t)\b/.test(excerpt)) continue;
      // A cropped quote must not hide negation immediately around the claim.
      const sentence = sentences.find((sentence) => sentence.includes(excerpt));
      const position = (sentence ?? source).indexOf(excerpt);
      const context = (sentence ?? source).slice(Math.max(0, position - 55), position + excerpt.length + 35);
      if (/\b(?:no|not|without|unavailable|cannot|can t|don t|doesn t)\b/.test(context)) continue;
      if (![term.title, ...term.aliases].some((alias) => ` ${excerpt} `.includes(` ${normalise(alias)} `)))
        continue;
      grounded.set(term.slug, plainText(item.evidence));
      if (grounded.size >= limit) break;
    }
    return grounded;
  };
  const s = collect(skills, jobSkills, 6),
    b = collect(benefits, jobBenefits, 5);
  return {
    skill_slugs: [...s.keys()],
    benefit_slugs: [...b.keys()],
    attribute_evidence: { skills: Object.fromEntries(s), benefits: Object.fromEntries(b) },
  };
}

export function attributeTerms(slugs: readonly string[], kind: "skills" | "benefits") {
  return catalogue[kind]
    .filter((term) => slugs.includes(term.slug))
    .map(({ slug, title }) => ({ slug, title }));
}
