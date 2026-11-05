import { fetchPublicResearchPage } from "./directory-http";
import { plainText } from "./directory-text";
import { publicUrl } from "./directory-url";
import { employerWebsiteMatches } from "./employer-websites";

const pageTypes = ["about", "work", "careers"] as const;
type PageType = (typeof pageTypes)[number];
type ResearchLink = { kind: PageType; url: string; priority: number; hub: boolean };

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

function classifyLink(path: string, label: string): Pick<ResearchLink, "kind" | "priority" | "hub"> | null {
  const segments = path.toLowerCase().split("/").filter(Boolean);
  const leaf = segments.at(-1) ?? "";
  if (!leaf || /^(?:contact|donate|privacy|terms|accessibility|news)(?:-|$)/.test(leaf)) return null;

  const careers =
    /^(?:jobs|careers|jobs-careers|jobs-and-careers|jobs-contracts|vacancies|work-with-us|work-for-us|working-for-us|working-with-us|what-we-offer)$/;
  if (careers.test(leaf) || /^(?:careers|jobs|vacancies|work (?:for|with) us)$/.test(label)) {
    return { kind: "careers", priority: leaf === "what-we-offer" ? 100 : 90, hub: true };
  }
  if (segments.some((segment) => careers.test(segment))) return { kind: "careers", priority: 45, hub: false };

  if (
    /^(?:about|about-us|who-we-are|the-trust|the-charity|our-mission|our-purpose|our-vision|our-strategy)$/.test(
      leaf,
    ) ||
    /^(?:about(?: us| the (?:trust|charity|organisation))?|who we are|our (?:mission|purpose|vision|strategy)|the (?:trust|charity))$/.test(
      label,
    )
  )
    return { kind: "about", priority: 100, hub: true };
  if (/\b(?:mission|purpose|vision)\b/.test(label) || /(?:^|-)(?:mission|purpose|vision)(?:-|$)/.test(leaf)) {
    return { kind: "about", priority: 85, hub: false };
  }

  const work =
    /^(?:what-we-do|our-work|our-projects|projects|programmes|programs|our-reserves|helping-nature)$/;
  if (
    work.test(leaf) ||
    /^(?:our work|what we do|(?:our )?(?:projects|programmes|programs|reserves))$/.test(label)
  ) {
    return { kind: "work", priority: 90, hub: true };
  }
  if (
    /\b(?:monitoring|restoration|recovery|project|programme|program|initiative|research|reserve)\b/.test(
      leaf.replaceAll("-", " ") + " " + label,
    )
  ) {
    return { kind: "work", priority: 100, hub: false };
  }
  if (segments.some((segment) => work.test(segment)) || leaf.startsWith("conservation-in-")) {
    return { kind: "work", priority: 55, hub: false };
  }
  if (segments.some((segment) => /^(?:about|about-us|the-trust|the-charity)$/.test(segment))) {
    return { kind: "about", priority: 45, hub: false };
  }
  return null;
}

function links(html: string, from: string, allow: (url: URL) => boolean) {
  const found = new Map<string, ResearchLink>();
  for (const match of html.matchAll(
    /<a\b[^>]*?\shref\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi,
  )) {
    try {
      const url = publicUrl((match[1] ?? match[2]).replace(/&amp;/g, "&"), from);
      if (!allow(url) || url.search || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) continue;
      const candidate = classifyLink(url.pathname, plainText(match[3]).toLowerCase());
      const key = url.toString();
      if (candidate && candidate.priority > (found.get(key)?.priority ?? 0)) {
        found.set(key, { ...candidate, url: key });
      }
    } catch {
      // Ignore non-web links and malformed URLs.
    }
  }
  return [...found.values()];
}

function acceptsResearch(html: string) {
  return !/<meta\b(?=[^>]*\bname=["'](?:robots|wildjobs)["'])(?=[^>]*\bcontent=["'][^"']*\b(?:noai|nosnippet|none)\b)[^>]*>/i.test(
    html,
  );
}

export async function loadEmployerResearchHome(name: string, website: string) {
  const origin = publicUrl(website).origin;
  const sameSite = (url: URL) => url.protocol === "https:" && url.origin === origin;
  let robots = "";
  try {
    robots = (await fetchPublicResearchPage(origin + "/robots.txt", 4500, sameSite)).text;
  } catch (error) {
    if (!(error instanceof Error) || !/^Source HTTP (404|410)$/.test(error.message)) throw error;
  }
  const allow = (url: URL) => sameSite(url) && robotsAllows(robots, url);
  if (!allow(new URL(origin))) return { identity: "unknown" } as const;
  const home = await fetchPublicResearchPage(origin, 6000, allow);
  if (!employerWebsiteMatches(name, home.text)) return { identity: "mismatch" } as const;
  if (!acceptsResearch(home.text) || !/(?:html|xhtml)/i.test(home.contentType))
    return { identity: "unknown" } as const;
  return { identity: "verified", home, allow } as const;
}

export async function collectEmployerSources(name: string, website: string) {
  const seed = await loadEmployerResearchHome(name, website);
  if (seed.identity !== "verified") return { identity: seed.identity, sources: [] };
  const { home, allow } = seed;

  const toSource = (page: typeof home, kind: EmployerSource["kind"]): EmployerSource => ({
    kind,
    url: page.url,
    title: plainText(page.text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 150),
    text: pageText(page.text),
  });
  const visited = new Set([home.url]);
  const sources = [toSource(home, "home")];
  const collect = async (candidates: ResearchLink[], firstPass: boolean) => {
    const unique = new Map<string, ResearchLink>();
    for (const link of candidates.toSorted((a, b) => b.priority - a.priority)) {
      if (!visited.has(link.url) && !unique.has(link.url)) unique.set(link.url, link);
    }
    const ranked = [...unique.values()];
    const selected = pageTypes.flatMap((kind) => {
      const best = ranked.filter((link) => link.kind === kind);
      if (kind !== "work" || !firstPass) return best.slice(0, kind === "work" || firstPass ? 2 : 1);
      // Read a work hub for its links and reserve a slot for a named project.
      const hub = best.find((link) => link.hub);
      return hub ? [hub, ...best.filter((link) => !link.hub).slice(0, 1)] : best.slice(0, 2);
    });
    selected.forEach(({ url }) => visited.add(url));
    const pages = await Promise.allSettled(
      selected.map(async ({ kind, url }) => {
        const page = await fetchPublicResearchPage(url, 5000, allow);
        if (!/(?:html|xhtml)/i.test(page.contentType) || !acceptsResearch(page.text)) return null;
        return { page, kind };
      }),
    );
    return pages.flatMap((result) => {
      if (result.status !== "fulfilled" || !result.value) return [];
      const { page, kind } = result.value;
      visited.add(page.url);
      if (!sources.some((source) => source.url === page.url)) sources.push(toSource(page, kind));
      const main = page.text.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
      return [...(main ? links(main, page.url, allow) : []), ...links(page.text, page.url, allow)];
    });
  };

  const secondary = await collect(links(home.text, home.url, allow), true);
  await collect(secondary, false);
  return { identity: "verified", sources: sources.filter((source) => source.text.length >= 100) } as const;
}
