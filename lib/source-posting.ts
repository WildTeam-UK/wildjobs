import { createHash } from "node:crypto";
import { parseHTML } from "linkedom";
import { parseSourceFeed, type FeedCard } from "./directory-sources";
import { advertPage } from "./directory-advert";
import { canonicalUrl, publicUrl } from "./directory-url";
import { advertClosingDate } from "./directory-lifecycle";
import { plainText } from "./directory-text";

export type Posting = {
  id?: string;
  url: string;
  title: string;
  description: string;
  organisation?: string;
  location?: string;
  salary?: string;
  postedAt?: string;
  closesAt?: string | null;
  country?: string;
  employmentType?: string;
  remote?: string;
};
const xml = (value: unknown) =>
  String(value ?? "").replace(
    /[<>&"']/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!,
  );
export function postingCard(posting: Posting, now = new Date()): FeedCard {
  const card = parseSourceFeed(
    `<rss><channel><item><guid>${xml(posting.id || canonicalUrl(posting.url))}</guid><title>${xml(posting.title)}</title><link>${xml(posting.url)}</link><description>${xml(posting.description)}</description><company>${xml(posting.organisation)}</company><location>${xml(posting.location)}</location><salary>${xml(posting.salary)}</salary><pubDate>${xml(posting.postedAt)}</pubDate><closingDate>${xml(posting.closesAt)}</closingDate><country>${xml(posting.country)}</country><employmentType>${xml(posting.employmentType)}</employmentType><workplace>${xml(posting.remote)}</workplace></item></channel></rss>`,
    posting.url,
    now,
  ).items[0];
  const text = `${posting.employmentType || ""} ${posting.description}`;
  const full = /\bfull[ -_]?time\b/i.test(text),
    part = /\bpart[ -_]?time\b/i.test(text);
  card.hours_type =
    full && part ? "Full time · Part time" : full ? "Full time" : part ? "Part time" : "Not specified";
  card.contract_type = /\bfixed[ -]term\b|\btemporary\b/i.test(text)
    ? "Fixed term"
    : /\bpermanent\b/i.test(text)
      ? "Permanent"
      : "Not specified";
  card.workplace = /\bhybrid\b/i.test(posting.remote || "")
    ? "Hybrid"
    : /\bremote|telecommute\b/i.test(posting.remote || "")
      ? "Remote"
      : /\bon[ -]?site\b/i.test(posting.remote || "")
        ? "On-site"
        : "Not specified";
  card.engagement_type = /\bunpaid|volunteer\b/i.test(posting.employmentType || "")
    ? "Volunteer"
    : /\bpaid\b|\b(?:GBP|USD|AUD|CAD|EUR)\b|[£€$]\s*\d/.test(posting.salary || "")
      ? "Paid"
      : "Not specified";
  // Missing posting dates use first observation; the hash must never contain this fallback clock.
  card.feed_hash = createHash("sha256")
    .update(JSON.stringify({ ...posting, url: canonicalUrl(posting.url) }))
    .digest("hex");
  return card;
}

export function sourceDocument(html: string) {
  const { document } = parseHTML(
    /<html\b/i.test(html) ? html : `<html><head></head><body>${html}</body></html>`,
  );
  return document;
}

// Parse JSON embedded in a known assignment without evaluating page JavaScript.
export function assignedJson(html: string, name: string): Record<string, unknown> | null {
  const marker = html.indexOf(name);
  if (marker < 0) return null;
  const start = html.indexOf("{", marker + name.length);
  if (start < 0) return null;
  let depth = 0,
    quoted = false,
    escaped = false;
  for (let index = start; index < Math.min(html.length, start + 2000000); index++) {
    const character = html[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === "{") depth++;
    else if (character === "}" && --depth === 0) {
      try {
        return JSON.parse(html.slice(start, index + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function jobObjects(html: string): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  function walk(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    const object = value as Record<string, unknown>;
    if ([object["@type"]].flat().includes("JobPosting")) found.push(object);
    for (const [key, child] of Object.entries(object))
      if (["@graph", "itemListElement", "item"].includes(key)) walk(child);
  }
  for (const script of sourceDocument(html).querySelectorAll('script[type="application/ld+json"]')) {
    try {
      walk(JSON.parse(script.textContent || ""));
    } catch {
      /* Ignore unrelated invalid metadata. */
    }
  }
  return found;
}

export function structuredPosting(object: Record<string, unknown>, url: string, organisation = ""): Posting {
  const html = `<script type="application/ld+json">${JSON.stringify(object).replace(/<\//g, "<\\/")}</script>`;
  const advert = advertPage(html, url);
  return {
    id:
      typeof object.identifier === "object" && object.identifier
        ? String((object.identifier as Record<string, unknown>).value || url)
        : String(object.identifier || object.url || url),
    url: publicUrl(String(object.url || url), url).toString(),
    title: advert.title || "",
    description: advert.description,
    organisation: advert.organisationName || organisation,
    location: advert.locationText,
    salary: advert.salary,
    country: advert.countryCode || "",
    postedAt: typeof object.datePosted === "string" ? object.datePosted : undefined,
    closesAt: advert.closesAt,
    employmentType: [object.employmentType].flat().filter(Boolean).join(" "),
    remote: advert.workplace || "",
  };
}

export function visibleSource(html: string, selector = "") {
  const document = sourceDocument(html);
  for (const node of document.querySelectorAll(
    'script,style,noscript,nav,footer,form,svg,[hidden],[aria-hidden="true"]',
  ))
    node.remove();
  for (const header of document.querySelectorAll("header"))
    if (!header.closest("main,article")) header.remove();
  const content = selector
    ? document.querySelector(selector)
    : document.querySelector("main,article") || document.body;
  return { document, content, text: plainText(content?.innerHTML || "") };
}

export const closedAdvert =
  /(?:applications? (?:are |is )?(?:now |no longer )?(?:closed|being accepted)|no longer accepting applications|position has been filled|vacancy (?:has been |is )closed|job (?:has )?expired)/i;
export const emptyVacancies =
  /(?:\bno (?:current |open |available |suitable )?(?:job |employment |career )?(?:vacancies|openings|positions|roles|opportunities)(?: (?:are )?(?:currently )?(?:available|open))?\b|(?:do not|don't|don’t) (?:currently )?have any (?:open )?(?:vacancies|positions|roles)|there are currently no vacancies|no jobs were found)/i;
export function advertPosting(html: string, url: string, organisation = "", selector = ""): Posting | null {
  const { content, text } = visibleSource(html, selector);
  if (closedAdvert.test(text)) return null;
  const object = jobObjects(html)[0];
  if (object) return structuredPosting(object, url, organisation);
  const title = plainText((content?.querySelector("h1") || content?.querySelector("h2"))?.textContent || "");
  if (
    !title ||
    !/\b(?:officer|manager|director|specialist|assistant|coordinator|ecologist|ranger|technician|accountant|analyst|researcher|scientist|intern|adviser|advisor|administrator|head|chief|solicitor|lawyer|attorney|counsel|fellow|lead|executive|fundraiser|gardener|keeper|zookeeper|chef|cook|engineer|asistente|responsable|especialista|analista|consultant|consultor|associate|developer|designer|trustee|trainee|apprentice|editor|assistantship|professor|lecturer)\b/i.test(
      title,
    ) ||
    title.length > 180 ||
    /^(?:welcome|careers?\b|jobs?\b|vacancies\b|current (?:vacancies|opportunities)|join (?:our|the) team|work (?:for|with|at)\b|as a science|our benefits|recruitment process)/i.test(
      title,
    ) ||
    text.length < 120 ||
    !/\b(?:apply|application|closing date|deadline|salary|job description)\b/i.test(text)
  )
    return null;
  return { url, title, description: text.slice(0, 24000), organisation, closesAt: advertClosingDate(text) };
}
