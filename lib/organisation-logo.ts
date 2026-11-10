import { cachePublicIcon, fetchPublicText, fetchWebsiteIcon, verifyPublicImage } from "./directory-http";
import { publicUrl } from "./directory-url";
import { plainText } from "./directory-text";

function attribute(tag: string, name: string) {
  return plainText(tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1] ?? "");
}
export function employerWebsiteCandidates(html: string, pageUrl: string, stated?: string) {
  const candidates = new Set<string>();
  const boardHost = new URL(pageUrl).hostname.replace(/^www\./, "");
  const add = (value: string, allowSameHost = false) => {
    try {
      const url = publicUrl(value, pageUrl);
      const host = url.hostname.replace(/^www\./, "");
      if (
        (!allowSameHost && host === boardHost) ||
        /^(?:www\.)?(?:gmail|outlook|hotmail|yahoo|facebook|linkedin|twitter|instagram|youtube|google)\./i.test(
          host,
        )
      )
        return;
      candidates.add(url.pathname === "/" && !url.search ? url.origin : url.toString());
    } catch {
      /* Ignore non-web links. */
    }
  };
  if (stated) add(stated, true);
  for (const tag of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attribute(tag[0], "href");
    if (href.startsWith("mailto:")) {
      const domain = href.split("?")[0].split("@")[1];
      if (domain) add(`https://${domain}`);
    } else if (/^https?:/i.test(href)) add(href);
  }
  return [...candidates].slice(0, 12);
}

export function organisationLogoCandidates(html: string, pageUrl: string, organisation: string) {
  // An AI-suggested website must identify the employer before we accept its branding.
  const normalise = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const name = normalise(organisation);
  const identity = normalise(
    plainText(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")) +
      " " +
      [...html.matchAll(/<(?:img|meta)\b[^>]*>/gi)]
        .map((m) => attribute(m[0], "alt") + " " + attribute(m[0], "content"))
        .join(" "),
  );
  const coreName = normalise(organisation.split(/,|\(/)[0])
    .replace(/\b(?:the|inc|incorporated|llc|ltd|and|of|for)\b/g, " ")
    .trim();
  const words = coreName.split(/\s+/).filter((word) => word.length > 2);
  const identityWords = new Set(identity.split(/\s+/));
  const matches =
    identity.replaceAll(" ", "").includes(name.replaceAll(" ", "")) ||
    (words.length > 0 && words.filter((word) => identityWords.has(word)).length / words.length >= 0.8);
  if (!name || name === "organisation not stated" || !matches) return [];
  const lightLogo = (url: string) =>
    /white.*logo|logo.*white|[-_]ko[-_.]/i.test(url) && !/white-border|whitebkg/i.test(url);
  const images: string[] = [],
    icons: string[] = [];
  const inline = [...html.matchAll(/<svg\b[^>]*(?:logo|brand)[^>]*>[\s\S]*?<\/svg>/gi)]
    .map((match) => match[0])
    .filter(
      (svg) =>
        svg.length < 40000 &&
        !/<(?:script|foreignObject|image|use)\b|\bon\w+\s*=|(?:href|url\s*\()/i.test(svg),
    )
    .map(
      (svg) =>
        "data:image/svg+xml," +
        encodeURIComponent(
          svg.includes("xmlns=") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'),
        ),
    );
  for (const tag of html.matchAll(
    /<img\b[^>]*>|<link\b[^>]*>|<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
  )) {
    const element = tag[0];
    if (
      /^<img/i.test(element) &&
      /logo|brandmark|wordmark/i.test(element) &&
      !/brand[_-]assets|partner[-_ ]?logo|sponsor[-_ ]?logo|accredit/i.test(element)
    )
      images.push(attribute(element, "src") || attribute(element, "data-src"));
    if (
      /^<link/i.test(element) &&
      /^(?:apple-touch-icon(?:-precomposed)?|(?:shortcut )?icon)$/i.test(attribute(element, "rel"))
    )
      icons.push(attribute(element, "href"));
    if (/^<script/i.test(element)) {
      try {
        const visit = (value: unknown) => {
          if (Array.isArray(value)) {
            value.forEach(visit);
            return;
          }
          if (!value || typeof value !== "object") return;
          const item = value as Record<string, unknown>;
          if (item.logo) {
            const logo =
              typeof item.logo === "string" ? item.logo : (item.logo as Record<string, unknown>).url;
            if (typeof logo === "string") images.unshift(logo);
          }
          if (item["@graph"]) visit(item["@graph"]);
        };
        visit(JSON.parse(element.replace(/^<script[^>]*>|<\/script>$/gi, "")));
      } catch {
        /* Some sites have unrelated malformed metadata. */
      }
    }
  }
  return [
    ...new Set(
      [
        ...inline,
        ...images.filter((url) => !/footer/i.test(url) && !lightLogo(url)),
        ...icons,
        ...images.filter((url) => !/footer/i.test(url) && lightLogo(url)),
      ].flatMap((value) => {
        try {
          if (/pfavico\.ico|\/wp-includes\/images\/w-logo/i.test(value)) return [];
          return value
            ? [value.startsWith("data:image/svg+xml,") ? value : publicUrl(value, pageUrl).toString()]
            : [];
        } catch {
          return [];
        }
      }),
    ),
  ].slice(0, 5);
}

export async function findOrganisationLogo(
  organisation: string,
  website: string | null | undefined,
  linkedFromAdvert = false,
) {
  if (!website || organisation === "Organisation not stated") return null;
  const deadline = Date.now() + 6000;
  let site: URL;
  try {
    site = publicUrl(website);
  } catch {
    return null;
  }
  let verified = linkedFromAdvert;
  try {
    const page = await fetchPublicText(site.pathname === "/" ? site.origin : site.toString(), 4500);
    const candidates = organisationLogoCandidates(page.text, page.url, organisation);
    if (candidates.length) verified = true;
    for (const candidate of candidates.slice(0, 2)) {
      if (candidate.startsWith("data:image/svg+xml,")) return candidate;
      const remaining = deadline - Date.now() - 1000;
      if (remaining <= 0) break;
      if (/favicon|apple-touch|android-chrome|\/icon[.-]/i.test(candidate)) {
        const icon = await cachePublicIcon(candidate, Math.min(3500, remaining));
        if (icon) return icon;
      }
      const logo = await verifyPublicImage(candidate, Math.min(3500, remaining));
      if (logo) return logo;
    }
  } catch {
    /* A missing logo never blocks an otherwise valid job. */
  }
  if (verified && Date.now() < deadline)
    return fetchWebsiteIcon(site.origin, Math.min(1500, deadline - Date.now()));
  return null;
}
