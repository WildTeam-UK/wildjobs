import { fetchPublicText } from "./directory-http";
import { publicUrl } from "./directory-url";
import type { advertPage } from "./directory-advert";

export function employerWebsiteMatches(name: string, html: string) {
  const normalise = (value: string) =>
    value
      .toLowerCase()
      .replace(/&(?:amp;)?/g, " and ")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const siteNames = [...html.matchAll(/<meta\b[^>]*>/gi)]
    .filter((m) => /(?:property|name)\s*=\s*["']og:site_name["']/i.test(m[0]))
    .map((m) => m[0].match(/content\s*=\s*["']([^"']*)["']/i)?.[1] ?? "");
  const identity = ` ${normalise([title, ...siteNames].join(" "))} `;
  const core = normalise(name.replace(/\([^)]*\)/g, ""))
    .replace(/^the /, "")
    .replace(/ (?:inc|incorporated|llc|ltd|limited)$/, "")
    .trim();
  const acronyms = [...name.matchAll(/\(([A-Z][A-Z0-9]{2,10})\)/g)].map((m) => m[1].toLowerCase());
  return Boolean(core && identity.includes(` ${core} `)) || acronyms.some((a) => identity.includes(` ${a} `));
}

export function employerWebsiteUrl(value: string | null | undefined, advertUrl: string) {
  if (!value) return null;
  try {
    const url = publicUrl(value, advertUrl);
    const host = url.hostname.replace(/^www\./, "");
    if (
      host === new URL(advertUrl).hostname.replace(/^www\./, "") ||
      /(?:^|\.)(?:facebook|linkedin|twitter|instagram|youtube|google|gmail|outlook|hotmail|yahoo)\./i.test(
        host,
      )
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function findEmployerWebsite(
  name: string,
  sourceUrl: string,
  advert: ReturnType<typeof advertPage>,
) {
  // Candidates come from the original advert, not an AI guess. A mention in page
  // body copy alone is insufficient: suppliers and partners also mention employers.
  const stated = employerWebsiteUrl(advert.organisationWebsite, sourceUrl);
  const candidates = [
    ...new Set(
      [stated, ...advert.websiteCandidates]
        .filter((url): url is string => Boolean(url))
        .map((url) => employerWebsiteUrl(url, sourceUrl))
        .filter((url): url is string => Boolean(url)),
    ),
  ];
  const deadline = Date.now() + 7000;
  for (const candidate of candidates.slice(0, 5)) {
    try {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      const page = await fetchPublicText(candidate, Math.min(3500, remaining));
      if (employerWebsiteMatches(name, page.text)) {
        return employerWebsiteUrl(page.url, sourceUrl);
      }
    } catch {
      // Missing websites must not block a vacancy or trigger another AI run.
    }
  }
  return null;
}
