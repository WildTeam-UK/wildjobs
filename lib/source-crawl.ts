import { fetchPublicSourceResource, type PublicSourceRequest } from "./directory-http";
import { publicUrl } from "./directory-url";
import { SourceReadError } from "./source-config";

export function sourceRobotsAllows(text: string, url: URL) {
  const groups: { agents: string[]; rules: { path: string; allow: boolean }[] }[] = [];
  let current = { agents: [] as string[], rules: [] as { path: string; allow: boolean }[] };
  for (const raw of text.split(/\r?\n/)) {
    const [, field, value] = raw.replace(/#.*$/, "").match(/^\s*([^:]+):\s*(.*?)\s*$/) || [];
    if (!field) continue;
    const key = field.toLowerCase().trim();
    if (key === "user-agent") {
      if (current.rules.length) {
        groups.push(current);
        current = { agents: [], rules: [] };
      }
      current.agents.push(value.toLowerCase());
    } else if (["allow", "disallow"].includes(key) && current.agents.length)
      current.rules.push({ path: value, allow: key === "allow" });
  }
  groups.push(current);
  const specific = groups.filter((g) =>
    g.agents.some((agent) => agent !== "*" && "wildjobs".includes(agent)),
  );
  const matching = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  const path = url.pathname + url.search;
  const rules = matching
    .flatMap((g) => g.rules)
    .filter((rule) => {
      if (!rule.path) return false;
      const anchored = rule.path.endsWith("$");
      const escaped = (anchored ? rule.path.slice(0, -1) : rule.path)
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*");
      return new RegExp("^" + escaped + (anchored ? "$" : "")).test(path);
    })
    .sort(
      (a, b) =>
        b.path.replaceAll("*", "").length - a.path.replaceAll("*", "").length ||
        Number(b.allow) - Number(a.allow),
    );
  return rules[0]?.allow ?? true;
}

export type SourceResource = { body: Uint8Array; contentType: string; url: string };
export type SourceTransport = (
  url: string,
  timeout: number,
  allow: (url: URL) => boolean,
  request?: PublicSourceRequest,
) => Promise<SourceResource>;
export function sourceCrawler(
  origins: string[],
  transport: SourceTransport = fetchPublicSourceResource,
  deadline = Date.now() + 55000,
) {
  const originKey = (url: URL) => `${url.protocol}//${url.hostname.replace(/^www\./, "")}`;
  const permitted = new Set(origins.map((url) => originKey(publicUrl(url))));
  const policies = new Map<string, string>();
  const queues = new Map<string, Promise<unknown>>();
  const nextRequest = new Map<string, number>();
  let requests = 0;
  const scope = (url: URL) => permitted.has(originKey(url));
  const raw = async (url: string, allow: (url: URL) => boolean, request?: PublicSourceRequest) => {
    if (++requests > 100 || Date.now() >= deadline)
      throw new SourceReadError(
        "incomplete",
        "Source exceeds the bounded import budget. Its previous jobs have been preserved.",
      );
    return transport(url, Math.min(8000, deadline - Date.now()), allow, request);
  };
  async function policy(origin: string) {
    const key = originKey(new URL(origin));
    if (!policies.has(key)) {
      try {
        const page = await raw(origin + "/robots.txt", (url) => scope(url) && originKey(url) === key);
        const body = Buffer.from(page.body).toString("utf8");
        if (
          /html/i.test(page.contentType) &&
          /<title[^>]*>[^<]*(?:access denied|just a moment|sign in|log in)|verify you are human|cf-chl-/i.test(
            body,
          )
        )
          throw new SourceReadError("blocked", "The crawl policy returned an access challenge.");
        // RFC 9309 §2.3.1.5: use parseable rules even when a catch-all route
        // returns HTML at /robots.txt. Never execute or render that response.
        policies.set(key, body);
      } catch (error) {
        if (!(error instanceof Error) || !/^Source HTTP (404|410)$/.test(error.message)) throw error;
        policies.set(key, "");
      }
    }
  }
  return {
    async read(value: string, request?: PublicSourceRequest) {
      const url = publicUrl(value);
      if (!scope(url))
        throw new SourceReadError(
          "unsupported",
          "The source links to another website. Save that recruitment URL or add its origin to the source settings.",
        );
      await policy(url.origin);
      const key = originKey(url);
      const allow = (candidate: URL) =>
        scope(candidate) &&
        policies.has(originKey(candidate)) &&
        sourceRobotsAllows(policies.get(originKey(candidate)) || "", candidate);
      if (!allow(url))
        throw new SourceReadError("blocked", "This source's robots.txt excludes the requested vacancy page.");
      const pending = (queues.get(key) || Promise.resolve()).then(async () => {
        const wait = Math.max(0, (nextRequest.get(key) || 0) - Date.now());
        if (Date.now() + wait >= deadline)
          throw new SourceReadError(
            "incomplete",
            "The source's crawl delay requires a smaller import batch or an agreed feed.",
          );
        if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
        const delays = [...(policies.get(key) || "").matchAll(/^\s*crawl-delay:\s*([\d.]+)/gim)].map(
          (m) => Number(m[1]) * 1000,
        );
        nextRequest.set(key, Date.now() + Math.max(0, ...delays));
        return raw(url.toString(), allow, request);
      });
      queues.set(
        key,
        pending.catch(() => undefined),
      );
      const page = await pending;
      const text = Buffer.from(page.body).toString("utf8");
      if (
        /html/i.test(page.contentType) &&
        /<title[^>]*>[^<]*(?:access denied|just a moment|attention required|sign in|log in)|(?:verify you are human|cf-chl-|captcha-container)/i.test(
          text,
        )
      )
        throw new SourceReadError(
          "blocked",
          "The source returned a login or access challenge instead of vacancies.",
        );
      if (
        /<meta\b(?=[^>]*\bname=["'](?:robots|wildjobs)["'])(?=[^>]*\bcontent=["'][^"']*\b(?:noai|nosnippet|none)\b)/i.test(
          text,
        )
      )
        throw new SourceReadError(
          "permission",
          "The page declares content reuse restrictions. An agreed feed is needed.",
        );
      return { ...page, text };
    },
  };
}
