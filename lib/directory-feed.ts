import { createHash } from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";

export const FEED_URL = "https://environmentjob.co.uk/jobs.rss";
export function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
export function normaliseSalary(value: string) {
  const amount = value.match(
    /(?:£|€|\$)\s*\d[\d,]*(?:\.\d+)?(?:\s*[–—-]\s*(?:£|€|\$)?\s*\d[\d,]*(?:\.\d+)?)?/,
  );
  if (!amount) return /volunt|unpaid/i.test(value) ? "Voluntary" : "Not stated";
  const money = amount[0]
    .replace(/\s*[–—-]\s*/g, " – ")
    .replace(/([£€$])\s+/g, "$1")
    .replace(/(?<=[£€$])\d{4,}/g, (n) => Number(n).toLocaleString("en-GB"));
  const payContext = value.slice((amount.index ?? 0) + amount[0].length).trim();
  const period = /^(?:per |an? |\/)?(?:hour|hr)\b|^ph\b/i.test(payContext)
    ? "per hour"
    : /^(?:per |a |\/)?day\b/i.test(payContext)
      ? "per day"
      : /^(?:per |a |\/)?week\b/i.test(payContext)
        ? "per week"
        : /^(?:per |a |\/)?month\b/i.test(payContext)
          ? "per month"
          : /^for \d+\s*(?:hours?|days?|months?|weeks?)\b|^total\b|\b(?:stipend|bursary)\b/i.test(payContext)
            ? "total"
            : "per year";
  return [
    money,
    period,
    /pro[ -]?rata/i.test(value) ? "pro rata" : "",
    /\bbenefits\b/i.test(value) ? "+ Benefits" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
export function parseFeed(xml: string, now = new Date(), organisationNames: readonly string[] = []) {
  if (XMLValidator.validate(xml) !== true) throw new Error("EnvironmentJob returned invalid RSS.");
  const parsed = new XMLParser({ ignoreAttributes: true, processEntities: true, parseTagValue: false }).parse(
    xml,
  );
  const raw = parsed?.rss?.channel?.item;
  if (!raw) throw new Error("EnvironmentJob returned no feed items.");
  return (Array.isArray(raw) ? raw : [raw]).map((item: Record<string, unknown>) => {
    const source = new URL(String(item.link));
    if (source.protocol !== "https:" || !/^(www\.)?environmentjob\.co\.uk$/.test(source.hostname))
      throw new Error("Unexpected feed link.");
    source.search = "";
    source.hash = "";
    const text = cleanText(item.description),
      title = cleanText(item.title);
    const known = organisationNames
      .filter((name) => text.startsWith(name + ", "))
      .sort((a, b) => b.length - a.length)[0];
    const comma = known ? known.length : text.indexOf(",");
    const organisation = comma < 0 ? "Organisation not stated" : text.slice(0, comma).trim();
    const rest = comma < 0 ? text : text.slice(comma + 1).trim();
    // RSS uses 'organisation, location, salary. description'. Do not split salary thousands or decimals.
    const boundary = rest.search(/\.\s+(?=[A-Z“‘])/);
    const prefix = boundary < 0 ? rest : rest.slice(0, boundary);
    const excerpt =
      boundary < 0
        ? text
        : rest
            .slice(boundary + 1)
            .trim()
            .replace(/\s*\.{3}$/, "…");
    const salaryAt = prefix.search(
      /(?:up to|from|starting at)\s+(?=[£€$])|(?:£|€|\$)\s*\d|\b(?:unpaid|voluntary|competitive|salary|negotiable)\b/i,
    );
    const location =
      (salaryAt < 0 ? prefix : prefix.slice(0, salaryAt))
        .replace(/(?:,\s*and\s+home working|(?:,\s*)?(?:with\s+)?hybrid working)\b/gi, "")
        .replace(/^Scotland West Coast of Scotland$/i, "West Coast of Scotland")
        .replace(/[,\s]+$/g, "")
        .replace(/\s*[,;]\s*/g, ", ") || "Location not stated";
    const salary = normaliseSalary(salaryAt < 0 ? prefix : prefix.slice(salaryAt));
    const parts = location.split(", ");
    const workplace = /\bhybrid\b|\band home working\b/i.test(prefix)
      ? "Hybrid"
      : /\bremote\b|home[ -]based|work(?:ing)? from home|home working/i.test(prefix)
        ? "Remote"
        : /\bon[ -]site\b|office[ -]based/i.test(prefix)
          ? "On-site"
          : "Not specified";
    const date = new Date(String(item.pubDate));
    const feed_id = String(item.guid ?? source.toString());
    return {
      feed_id,
      slug: source.pathname.split("/").filter(Boolean).at(-1)!,
      source_url: source.toString(),
      title,
      organisation_name: organisation,
      feed_text: text,
      feed_hash: createHash("sha256")
        .update(JSON.stringify([title, text, source.toString(), item.pubDate]))
        .digest("hex"),
      summary: excerpt || title,
      summary_source: "source" as const,
      location_text: location,
      locality: parts[0],
      region: parts.length > 1 ? parts.at(-1) : null,
      country_code:
        /\b(?:UK|United Kingdom|England|Scotland|Wales|Northern Ireland|Somerset|London|Bristol|Devon|Yorkshire|Cornwall|Gloucestershire|Surrey|Oxfordshire|Northamptonshire|Cambridgeshire|Wiltshire|Durham|Norfolk|Suffolk|Kent|Sussex|Hampshire|Berkshire|Warwickshire|Bedfordshire|Buckinghamshire|Essex|Cumbria|Derbyshire|Dorset|Lancashire|Leicestershire|Lincolnshire|Nottinghamshire|Northumberland|Shropshire|Staffordshire|Worcestershire|Hertfordshire|Cheshire|Flintshire|Powys|Gwynedd|Cardiff|Edinburgh|Aberdeen|Peterborough|Nottingham|Leeds|Sheffield|Manchester|Liverpool|Newcastle|Glasgow|Belfast)\b/i.test(
          location,
        )
          ? "GB"
          : null,
      salary_text: salary,
      salary_min: Number(salary.match(/[\d,]+/)?.[0].replaceAll(",", "")) || null,
      workplace,
      hours_type: /part[ -]time/i.test(text) ? "Part time" : /full[ -]time/i.test(text) ? "Full time" : null,
      contract_type: /\bpermanent\b/i.test(text)
        ? "Permanent"
        : /fixed[ -]term/i.test(text)
          ? "Fixed term"
          : null,
      engagement_type: /\bvolunteer|voluntary|unpaid\b/i.test(prefix) ? "Volunteer" : "Paid",
      posted_at: Number.isFinite(date.valueOf()) ? date.toISOString() : now.toISOString(),
      last_seen_at: now.toISOString(),
      is_active: true,
    };
  });
}
