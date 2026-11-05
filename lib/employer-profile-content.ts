import { z } from "zod";
import type { EmployerSource } from "./employer-research-sources";

export const employerResearchOutput = z.object({
  claims: z.array(
    z.object({
      kind: z.enum(["overview", "work", "careers"]),
      text: z.string(),
      passage: z.number().int(),
    }),
  ),
});

export const employerEvidenceReview = z.object({ supported: z.array(z.number().int()) });

const claim = z.object({
  kind: z.enum(["overview", "work", "careers"]),
  text: z.string().min(40).max(650),
  sourceUrl: z.url({ protocol: /^https$/ }),
  sourceTitle: z.string().min(1).max(150),
});
export const employerProfileContent = z.object({
  claims: z.array(claim).min(2).max(7),
});

const squash = (value: string) => value.replace(/\s+/g, " ").trim();
const sentences = new Intl.Segmenter("en-GB", { granularity: "sentence" });

type EmployerPassage = { page: EmployerSource; excerpt: string };

export function extractEmployerPassages(sources: readonly EmployerSource[]) {
  const maxLength = 540;
  return sources.flatMap((page) => {
    const passages: EmployerPassage[] = [];
    let excerpt = "";
    for (const { segment } of sentences.segment(squash(page.text))) {
      const sentence = segment.trim();
      // Keep long unpunctuated text intact up to a word boundary.
      const parts = sentence.length <= maxLength
        ? [sentence]
        : sentence.match(/\S.{0,539}(?= |$)|\S+/g) ?? [];
      for (const part of parts) {
        if (excerpt && excerpt.length + part.length + 1 > maxLength) {
          if (excerpt.length >= 25) passages.push({ page, excerpt });
          excerpt = "";
        }
        if (part.length <= maxLength) excerpt = excerpt ? `${excerpt} ${part}` : part;
      }
    }
    if (excerpt.length >= 25) passages.push({ page, excerpt });
    return passages;
  });
}

export function groundEmployerClaims(
  output: z.infer<typeof employerResearchOutput>,
  passages: readonly EmployerPassage[],
) {
  const seen = new Set<string>();
  return output.claims.slice(0, 7).flatMap((item) => {
    const passage = passages[item.passage - 1];
    if (!passage) return [];
    const { page, excerpt } = passage;
    const text = squash(item.text);
    const key = text.toLowerCase();
    if (
      (item.kind === "careers" && page.kind !== "careers") ||
      !squash(page.text).includes(excerpt) ||
      excerpt.toLowerCase().includes(key) ||
      seen.has(key) ||
      /(?:https?:\/\/|\b[\w.+%-]+@[\w.-]+\.[a-z]{2,}\b|[<>])/i.test(text)
    )
      return [];
    const result = claim.safeParse({
      kind: item.kind,
      text,
      sourceUrl: page.url,
      sourceTitle: page.title || new URL(page.url).hostname,
    });
    if (!result.success) return [];
    seen.add(key);
    return [{ claim: result.data, excerpt }];
  });
}

export function eligibleEmployerContent(
  grounded: ReturnType<typeof groundEmployerClaims>,
  supported: readonly number[],
) {
  const approved = grounded.filter((_item, i) => supported.includes(i + 1)).map((item) => item.claim);
  const primary = approved.filter((item) => item.kind !== "careers");
  if (
    !primary.some((item) => item.kind === "overview") ||
    !primary.some((item) => item.kind === "work") ||
    new Set(primary.map((item) => item.sourceUrl)).size < 2
  )
    return null;
  return employerProfileContent.parse({ claims: approved });
}
