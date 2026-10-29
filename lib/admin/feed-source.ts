import { XMLParser, XMLValidator } from "fast-xml-parser";

export const CJS_RSS_URL = "https://www.countryside-jobs.com/jobs-feed-items";

export type FeedVacancy = {
  canonicalUrl: string;
  closesAt: string | null;
  employer: string | null;
  externalId: string;
  location: string | null;
  publishedAt: string | null;
  summary: string | null;
  title: string;
};

type XmlRecord = Record<string, unknown>;

function asRecord(value: unknown): XmlRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as XmlRecord) : null;
}

function asArray(value: unknown) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function readText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  const record = asRecord(value);
  return record ? readText(record["#text"]) : null;
}

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    const numericValue = code.startsWith("#x")
      ? Number.parseInt(code.slice(2), 16)
      : code.startsWith("#")
        ? Number.parseInt(code.slice(1), 10)
        : null;
    if (numericValue !== null) {
      return Number.isSafeInteger(numericValue) && numericValue <= 0x10ffff
        ? String.fromCodePoint(numericValue)
        : entity;
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function cleanText(value: unknown, maxLength: number) {
  const text = readText(value);
  if (!text) return null;

  return decodeEntities(decodeEntities(text).replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function readDate(value: unknown, dateOnly = false) {
  const text = readText(value);
  if (!text) return null;

  if (dateOnly) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (!match) return null;
    const date = new Date(`${text}T00:00:00Z`);
    return date.getUTCFullYear() === Number(match[1]) &&
      date.getUTCMonth() + 1 === Number(match[2]) &&
      date.getUTCDate() === Number(match[3])
      ? text
      : null;
  }

  const date = new Date(text);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function readHttpsUrl(value: unknown) {
  const text = readText(value);
  if (!text) return null;

  try {
    const url = new URL(text);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function readAtomLink(value: unknown) {
  for (const candidate of asArray(value)) {
    const record = asRecord(candidate);
    if (!record) {
      const direct = readHttpsUrl(candidate);
      if (direct) return direct;
      continue;
    }

    const relation = readText(record["@_rel"]);
    if (!relation || relation === "alternate") {
      const href = readHttpsUrl(record["@_href"]);
      if (href) return href;
    }
  }
  return null;
}

function normalizeRssItem(value: unknown): FeedVacancy | null {
  const item = asRecord(value);
  if (!item) return null;

  const canonicalUrl = readHttpsUrl(item.link);
  const title = cleanText(item.title, 240);
  const externalId = cleanText(item.guid, 500) ?? canonicalUrl;
  if (!canonicalUrl || !title || !externalId) return null;

  return {
    canonicalUrl,
    closesAt: readDate(item["cjsFeed:expiry"], true),
    employer: cleanText(item["cjsFeed:company"], 200),
    externalId,
    location: cleanText(item["cjsFeed:location"], 240),
    publishedAt: readDate(item.pubDate),
    summary: cleanText(item.description, 2_000),
    title,
  };
}

function normalizeAtomEntry(value: unknown): FeedVacancy | null {
  const entry = asRecord(value);
  if (!entry) return null;

  const canonicalUrl = readAtomLink(entry.link);
  const title = cleanText(entry.title, 240);
  const externalId = cleanText(entry.id, 500) ?? canonicalUrl;
  if (!canonicalUrl || !title || !externalId) return null;

  const author = asRecord(entry.author);
  return {
    canonicalUrl,
    closesAt: null,
    employer: cleanText(author?.name, 200),
    externalId,
    location: null,
    publishedAt: readDate(entry.published ?? entry.updated),
    summary: cleanText(entry.summary ?? entry.content, 2_000),
    title,
  };
}

export function isSupportedRssSource(value: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "www.countryside-jobs.com" &&
      url.pathname === "/jobs-feed-items" &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function parseVacancyFeed(xml: string): FeedVacancy[] {
  if (xml.length > 1_500_000 || /<!DOCTYPE/i.test(xml)) {
    throw new Error("The feed is not in an approved XML format.");
  }

  const validation = XMLValidator.validate(xml, { allowBooleanAttributes: false });
  if (validation !== true) throw new Error("The feed contains invalid XML.");

  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (_name, path) => path === "rss.channel.item" || path === "feed.entry",
    maxNestedTags: 80,
    parseAttributeValue: false,
    parseTagValue: false,
    processEntities: false,
    trimValues: true,
  });
  const parsed = asRecord(parser.parse(xml));
  if (!parsed) throw new Error("The feed could not be parsed.");

  const rss = asRecord(parsed.rss);
  const channel = asRecord(rss?.channel);
  const atom = asRecord(parsed.feed);
  const candidates = channel
    ? asArray(channel.item).map(normalizeRssItem)
    : atom
      ? asArray(atom.entry).map(normalizeAtomEntry)
      : [];
  const vacancies = new Map<string, FeedVacancy>();

  for (const vacancy of candidates.slice(0, 500)) {
    if (vacancy && !vacancies.has(vacancy.externalId)) {
      vacancies.set(vacancy.externalId, vacancy);
    }
  }

  return [...vacancies.values()];
}

export function parseCjsVacancyFeed(xml: string) {
  return parseVacancyFeed(xml).filter((vacancy) => {
    const url = new URL(vacancy.canonicalUrl);
    return url.hostname === "www.countryside-jobs.com" && url.pathname.startsWith("/job/");
  });
}
