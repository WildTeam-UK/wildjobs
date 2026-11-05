import { fetchPublicResearchPage } from "./directory-http";
import { plainText } from "./directory-text";
import { publicUrl } from "./directory-url";
import { employerWebsiteMatches } from "./employer-websites";

const pageTypes = {
  about: /(?:about|who-we-are|our-mission|our-purpose)/i,
  work: /(?:what-we-do|our-work|our-projects|projects|programmes|our-reserves|helping-nature|conservation-in)/i,
  careers: /(?:careers|working-for|working-with-us|work-with-us|work-for-us|what-we-offer|jobs|vacancies)/i,
};
type PageType = keyof typeof pageTypes;

export type EmployerSource = { url: string; title: string; text: string; kind: PageType | "home" };

export function robotsAllows(robots: string, url: URL) {
  const groups: { agents: string[]; rules: { allow: boolean; path: string }[] }[] = [];
  let group = { agents: [] as string[], rules: [] as { allow: boolean; path: string }[] };
  for (const line of robots.split(/\r?\n/)) {
    const [, field, value] = line.replace(/#.*$/, "").match(/^\s*([^:]+):\s*(.*?)\s*$/) ?? [];
    if (!field) continue;
    switch (field.trim().toLowerCase()) {
      case "user-agent":
        if (group.rules.length) {
          groups.push(group);
          group = { agents: [], rules: [] };
        }
        group.agents.push(value.toLowerCase());
        break;
      case "allow":
      case "disallow":
        if (group.agents.length) group.rules.push({ allow: field.toLowerCase() === "allow", path: value });
        break;
    }
  }
  if (group.agents.length) groups.push(group);
  const named = groups.filter(({ agents }) => agents.includes("wildjobs"));
  const relevant = named.length ? named : groups.filter(({ agents }) => agents.includes("*"));
  const path = url.pathname + url.search;
  const matches = relevant.flatMap(({ rules }) =>
    rules.filter((rule) => {
      if (!rule.path) return false;
      const anchored = rule.path.endsWith("$");
      const pattern = (anchored ? rule.path.slice(0, -1) : rule.path)
        .split("*")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*");
      return new RegExp("^" + pattern + (anchored ? "$" : "")).test(path);
    }),
  );
  matches.sort((a, b) => b.path.length - a.path.length || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
}

function pageText(html: string) {
  const content = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  return plainText(
    content.replace(/<(script|style|noscript|nav|footer|header|form|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, " "),
  )
    .replace(/\b[\w.+%-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[email removed]")
    .slice(0, 6500);
}

function links(html: string, from: string, allow: (url: URL) => boolean) {
  const found: { kind: PageType; url: string }[] = [];
  for (const match of html.matchAll(
    /<a\b[^>]*?\shref\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    try {
      const url = publicUrl((match[1] ?? match[2]).replace(/&amp;/g, "&"), from);
      if (!allow(url) || url.search || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) continue;
      const kind = (Object.keys(pageTypes) as PageType[]).find((type) => pageTypes[type].test(url.pathname));
      if (kind) found.push({ kind, url: url.toString() });
    } catch {
      // Ignore non-web links and malformed URLs.
    }
  }
  return found;
}

function acceptsResearch(html: string) {
  return !/<meta\b(?=[^>]*\bname=["'](?:robots|wildjobs)["'])(?=[^>]*\bcontent=["'][^"']*\b(?:noai|nosnippet|none)\b)[^>]*>/i.test(
    html,
  );
}

export async function collectEmployerSources(name: string, website: string) {
  const origin = publicUrl(website).origin;
  const sameSite = (url: URL) => url.protocol === "https:" && url.origin === origin;
  let robots = "";
  try {
    robots = (await fetchPublicResearchPage(origin + "/robots.txt", 4500, sameSite)).text;
  } catch (error) {
    if (!(error instanceof Error) || !/^Source HTTP (404|410)$/.test(error.message)) throw error;
  }
  const allow = (url: URL) => sameSite(url) && robotsAllows(robots, url);
  if (!allow(new URL(origin))) return { identity: "unknown", sources: [] } as const;
  const home = await fetchPublicResearchPage(origin, 6000, allow);
  if (!employerWebsiteMatches(name, home.text)) return { identity: "mismatch", sources: [] } as const;
  if (!acceptsResearch(home.text)) return { identity: "unknown", sources: [] } as const;

  const toSource = (page: typeof home, kind: EmployerSource["kind"]): EmployerSource => ({
    kind,
    url: page.url,
    title: plainText(page.text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 150),
    text: pageText(page.text),
  });
  const visited = new Set([home.url]);
  const sources = [toSource(home, "home")];
  const collect = async (candidates: ReturnType<typeof links>, perType: number) => {
    const selected = (Object.keys(pageTypes) as PageType[]).flatMap((kind) =>
      [...new Set(candidates.filter((candidate) => candidate.kind === kind).map(({ url }) => url))]
        .filter((url) => !visited.has(url))
        .slice(0, perType)
        .map((url) => ({ kind, url })),
    );
    selected.forEach(({ url }) => visited.add(url));
    const pages = await Promise.allSettled(
      selected.map(async ({ kind, url }) => {
        const page = await fetchPublicResearchPage(url, 5000, allow);
        if (!/(?:html|xhtml)/i.test(page.contentType) || !acceptsResearch(page.text)) return [];
        if (!sources.some((source) => source.url === page.url)) sources.push(toSource(page, kind));
        return links(page.text, page.url, allow);
      }),
    );
    return pages.flatMap((page) => (page.status === "fulfilled" ? page.value : []));
  };

  const secondary = await collect(links(home.text, home.url, allow), 2);
  await collect(secondary, 1);
  return { identity: "verified", sources: sources.filter((source) => source.text.length >= 150) } as const;
}
