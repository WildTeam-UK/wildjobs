import { createHash } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { parseFeed, normaliseSalary } from "./directory-feed";
import { plainText } from "./directory-text";
import { closingDate, directoryFacts } from "./directory-lifecycle";
import { canonicalUrl, publicUrl } from "./directory-url";

export type FeedCard = Omit<ReturnType<typeof parseFeed>[number], "locality" | "region"> & {
  locality: string | null;
  region: string | null | undefined;
  canonical_url: string;
  logo_url?: string;
};
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function string(value: unknown): string {
  if (Array.isArray(value)) return value.map(string).join(" ");
  if (typeof value === "string" || typeof value === "number") return String(value);
  const record = object(value);
  return record["#text"] !== undefined
    ? string(record["#text"])
    : Object.entries(record)
        .filter(([key]) => !key.startsWith("@_"))
        .map(([, v]) => string(v))
        .join(" ");
}
const list = (value: unknown): unknown[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
export function parseSourceFeed(
  xml: string,
  feedUrl: string,
  now = new Date(),
  organisationNames: readonly string[] = [],
): { name: string; items: FeedCard[] } {
  if (XMLValidator.validate(xml) !== true || /<!ENTITY\b/i.test(xml))
    throw new Error("The source did not return a valid RSS or Atom feed.");
  const parsed = new XMLParser({
    ignoreAttributes: false,
    processEntities: true,
    parseTagValue: false,
    removeNSPrefix: true,
  }).parse(xml);
  const channel = object(parsed.rss?.channel ?? parsed.feed ?? parsed.RDF?.channel);
  if (!Object.keys(channel).length) throw new Error("The source did not return an RSS or Atom feed.");
  const name = plainText(string(channel.title)) || new URL(feedUrl).hostname;
  const entries = list(channel.item ?? channel.entry ?? parsed.RDF?.item);
  if (entries.length > 5000) throw new Error("A feed can contain up to 5,000 jobs.");
  if (/^(www\.)?environmentjob\.co\.uk$/.test(new URL(feedUrl).hostname) && parsed.rss) {
    return {
      name,
      items: entries.length
        ? parseFeed(xml, now, organisationNames).map((j) => ({
            ...j,
            canonical_url: canonicalUrl(j.source_url),
          }))
        : [],
    };
  }
  const feedBase = publicUrl(string(channel["@_base"]) || feedUrl, feedUrl).toString();
  const items = entries.map((raw) => {
    const item = object(raw);
    const link = list(item.link).find((v) => {
      const a = object(v);
      return typeof v === "string" || !a["@_rel"] || a["@_rel"] === "alternate";
    });
    const entryBase = publicUrl(string(item["@_base"]) || feedBase, feedBase).toString();
    const rawLink =
      string(object(link)["@_href"] ?? link) ||
      (/^https?:\/\//.test(string(item.guid ?? item.id)) ? string(item.guid ?? item.id) : "");
    if (!rawLink) throw new Error("A feed item is missing its advert URL.");
    const source = publicUrl(
      rawLink,
      publicUrl(string(object(link)["@_base"]) || entryBase, entryBase).toString(),
    ).toString();
    const title = plainText(string(item.title));
    if (!title) throw new Error("A feed item is missing its job title.");
    const text = plainText(string(item.encoded ?? item.content ?? item.description ?? item.summary));
    const organisation =
      plainText(string(item.company ?? item.employer ?? item.hiringOrganization ?? item.companyName)) ||
      "Organisation not stated";
    const location =
      plainText(string(item.location ?? item.jobLocation ?? item.region)) || "Location not stated";
    const salary = normaliseSalary(plainText(string(item.salary ?? item.baseSalary)));
    const date = new Date(string(item.pubDate ?? item.published ?? item.date ?? item.updated));
    const closesAt = closingDate(string(item.closingDate ?? item.validThrough ?? ""));
    const feedId = string(item.guid ?? item.id) || canonicalUrl(source);
    const work = string(item.workplace ?? item.jobLocationType).toLowerCase();
    const types = string(item.employmentType ?? item.jobType).toLowerCase();
    const country = string(item.country ?? item.countryCode).toUpperCase();
    const logo = string(item.companyLogo ?? item.logo);
    let logoUrl: string | undefined;
    try {
      if (logo) logoUrl = publicUrl(logo, source).toString();
    } catch {}
    return {
      feed_id: feedId,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 100),
      source_url: source,
      canonical_url: canonicalUrl(source),
      title,
      organisation_name: organisation,
      feed_text: text,
      feed_hash: createHash("sha256")
        .update(
          JSON.stringify([
            title,
            text,
            source,
            organisation,
            location,
            salary,
            item.pubDate ?? item.published ?? item.date ?? null,
            closesAt,
          ]),
        )
        .digest("hex"),
      summary: text || title,
      summary_source: "source" as const,
      location_text: location,
      locality: location === "Location not stated" ? null : location.split(",")[0],
      region: null,
      country_code: /^[A-Z]{2}$/.test(country) ? country : null,
      salary_text: salary,
      salary_min: Number(salary.match(/[\d,]+/)?.[0].replaceAll(",", "")) || null,
      ...directoryFacts({
        workplace: /hybrid/.test(work)
          ? "Hybrid"
          : /remote|telecommute|home/.test(work)
            ? "Remote"
            : "On-site",
        hours: /part[ _-]?time/.test(types)
          ? /full[ _-]?time/.test(types)
            ? "Full time · Part time"
            : "Part time"
          : "Full time",
        contract: /fixed|temporary/.test(types) ? "Fixed term" : "Permanent",
      }),
      ...(closesAt ? { closes_at: closesAt } : {}),
      ...(logoUrl ? { logo_url: logoUrl } : {}),
      engagement_type: /volunt|unpaid/i.test(types) ? "Volunteer" : "Paid",
      posted_at: Number.isFinite(date.valueOf()) ? date.toISOString() : now.toISOString(),
      last_seen_at: now.toISOString(),
      is_active: true,
    };
  });
  return { name, items: [...new Map(items.map((j) => [j.feed_id, j])).values()] };
}
