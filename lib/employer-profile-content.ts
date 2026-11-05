import { z } from "zod";
import type { EmployerSource } from "./employer-research-sources";

export const employerResearchOutput = z.object({
  claims: z.array(
    z.object({
      kind: z.enum(["overview", "work", "careers"]),
      text: z.string(),
      source: z.number().int(),
      excerpt: z.string(),
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

export function groundEmployerClaims(
  output: z.infer<typeof employerResearchOutput>,
  sources: readonly EmployerSource[],
) {
  const squash = (value: string) => value.replace(/\s+/g, " ").trim();
  const seen = new Set<string>();
  return output.claims.slice(0, 7).flatMap((item) => {
    const page = sources[item.source - 1];
    const excerpt = squash(item.excerpt);
    const text = squash(item.text);
    const key = text.toLowerCase();
    if (
      !page ||
      (item.kind === "careers" && page.kind !== "careers") ||
      excerpt.length < 25 ||
      excerpt.length > 600 ||
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
