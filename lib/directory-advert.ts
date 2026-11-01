import { plainText } from "./directory-text";
import { fetchPublicText } from "./directory-http";
import { canonicalUrl, publicUrl } from "./directory-url";
import { normaliseSalary } from "./directory-feed";
import { closingDate } from "./directory-lifecycle";

type JsonRecord = Record<string, unknown>;
function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}
export function parseAdvert(html: string, pageUrl?: string) {
  const objects: JsonRecord[] = [];
  function collect(value: unknown) {
    if (Array.isArray(value)) value.forEach(collect);
    else {
      const item = record(value);
      if (
        item["@type"] === "JobPosting" ||
        (Array.isArray(item["@type"]) && item["@type"].includes("JobPosting"))
      )
        objects.push(item);
      if (item["@graph"]) collect(item["@graph"]);
    }
  }
  for (const match of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      collect(JSON.parse(match[1]));
    } catch {
      /* Ignore unrelated malformed metadata. */
    }
  }
  const job = objects[0];
  if (!job) return null;
  const organisation = record(job.hiringOrganization),
    location = record(Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation),
    address = record(location.address);
  const description = plainText(String(job.description ?? ""));
  const logo =
    typeof organisation.logo === "string" ? organisation.logo : String(record(organisation.logo).url ?? "");
  const logoStem = logo.includes("_open_graph.") ? logo.slice(0, logo.indexOf("_open_graph.")) : null;
  const sourceImages = [...html.matchAll(/<img\b[^>]*>/gi)].map(
    (match) => match[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1],
  );
  const preferredLogo = logoStem
    ? sourceImages.find((src) => src?.startsWith(logoStem) && src.includes("_large."))
    : undefined;
  const logoUrl = preferredLogo ?? logo;
  const types = (Array.isArray(job.employmentType) ? job.employmentType : [job.employmentType]).map((t) =>
    String(t).toUpperCase(),
  );
  const hours =
    [types.includes("FULL_TIME") ? "Full time" : null, types.includes("PART_TIME") ? "Part time" : null]
      .filter(Boolean)
      .join(" · ") || null;
  const contract =
    types.includes("TEMPORARY") || /\bfixed[ -]term\b/i.test(description)
      ? "Fixed term"
      : /\bpermanent (?:contract|role|position|post)|\bcontract(?: type)?\s*:\s*permanent\b/i.test(
            description,
          )
        ? "Permanent"
        : null;
  const workplace =
    /\bhybrid (?:working|work|role|position|arrangement|basis)|\bwork (?:on a )?hybrid\b/i.test(description)
      ? "Hybrid"
      : job.jobLocationType === "TELECOMMUTE" ||
          /\b(?:fully remote|remote (?:working|role|position)|home[ -]based (?:role|position|working))\b/i.test(
            description,
          )
        ? "Remote"
        : /\b(?:office|site)[ -]based (?:role|position|working)|\b(?:role|position) (?:is|will be) (?:based )?(?:on[ -]site|office[ -]based)\b/i.test(
              description,
            )
          ? "On-site"
          : null;
  const country = String(
    typeof address.addressCountry === "object"
      ? (record(address.addressCountry).name ?? "")
      : (address.addressCountry ?? ""),
  );
  const countryCode =
    ({ "United Kingdom": "GB", UK: "GB", Romania: "RO", "Falkland Islands": "FK" } as Record<string, string>)[
      country
    ] ?? (/^[A-Z]{2}$/.test(country) ? country : null);
  const safeUrl = (value: string) => {
    try {
      return publicUrl(value, pageUrl).toString();
    } catch {
      return undefined;
    }
  };
  const locationText = [address.addressLocality, address.addressRegion, countryCode ?? country]
    .filter(Boolean)
    .map(String)
    .filter((x, i, xs) => xs.indexOf(x) === i)
    .join(", ");
  const baseSalary = record(job.baseSalary),
    amount = record(baseSalary.value);
  const currency = String(baseSalary.currency ?? job.salaryCurrency ?? ""),
    symbol = ({ GBP: "£", EUR: "€", USD: "$" } as Record<string, string>)[currency];
  const low =
      amount.minValue ?? amount.value ?? (typeof baseSalary.value === "number" ? baseSalary.value : null),
    high = amount.maxValue;
  const unit = String(amount.unitText ?? "YEAR").toLowerCase();
  const salary =
    symbol && low !== null && low !== undefined
      ? normaliseSalary(`${symbol}${low}${high !== undefined ? ` - ${symbol}${high}` : ""} per ${unit}`)
      : null;
  let canonical: string | undefined;
  try {
    if (job.url) canonical = canonicalUrl(String(job.url), pageUrl);
  } catch {}
  return {
    title: plainText(String(job.title ?? "")),
    organisationName: plainText(String(organisation.name ?? "")),
    locationText,
    salary,
    canonicalUrl: canonical,
    description,
    logoUrl: logoUrl ? safeUrl(logoUrl) : undefined,
    hours,
    contract,
    workplace,
    countryCode,
    closesAt: closingDate(job.validThrough),
  };
}
export function advertPage(html: string, pageUrl: string) {
  const structured = parseAdvert(html, pageUrl);
  const main =
    html.match(/<(?:main|article)\b[^>]*>([\s\S]*?)<\/(?:main|article)>/i)?.[1] ??
    html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ??
    html;
  const description =
    structured?.description ||
    plainText(main.replace(/<(script|style|nav|header|footer|aside|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ""));
  const logoCandidates = [...html.matchAll(/<img\b[^>]*>/gi)]
    .flatMap((m) => {
      const src = m[0].match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1],
        alt = plainText(m[0].match(/\balt\s*=\s*["']([^"']*)["']/i)?.[1] ?? "");
      if (!src || !/logo|employer|company|organisation/i.test(m[0])) return [];
      try {
        return [{ url: publicUrl(src, pageUrl).toString(), alt }];
      } catch {
        return [];
      }
    })
    .slice(0, 12);
  return { ...structured, description, logoCandidates };
}
export async function fetchAdvert(sourceUrl: string) {
  const page = await fetchPublicText(sourceUrl);
  return advertPage(page.text, page.url);
}
