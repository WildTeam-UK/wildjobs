import { cleanText } from "./directory-feed";
import { closingDate } from "./directory-lifecycle";

function plainText(html: string) {
  const named: Record<string, string> = {
    amp: "&",
    quot: '"',
    apos: "'",
    lt: "<",
    gt: ">",
    nbsp: " ",
    rsquo: "’",
    lsquo: "‘",
    rdquo: "”",
    ldquo: "“",
    ndash: "–",
    mdash: "—",
    pound: "£",
    bull: "•",
  };
  return cleanText(
    html
      .replace(/<\/(?:p|li|h[1-6]|div)>|<br\s*\/?\s*>/gi, "\n")
      .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, code: string) =>
        code.startsWith("#")
          ? String.fromCodePoint(
              Number.parseInt(
                code.slice(code[1]?.toLowerCase() === "x" ? 2 : 1),
                code[1]?.toLowerCase() === "x" ? 16 : 10,
              ),
            )
          : (named[code.toLowerCase()] ?? whole),
      ),
  );
}
type JsonRecord = Record<string, unknown>;
function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}
export function parseAdvert(html: string) {
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
  const logoUrl = (preferredLogo ?? logo).startsWith("https://") ? (preferredLogo ?? logo) : undefined;
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
  const country = String(address.addressCountry ?? "");
  const countryCode =
    ({ "United Kingdom": "GB", UK: "GB", Romania: "RO", "Falkland Islands": "FK" } as Record<string, string>)[
      country
    ] ?? (/^[A-Z]{2}$/.test(country) ? country : null);
  return {
    description,
    logoUrl,
    hours,
    contract,
    workplace,
    countryCode,
    closesAt: closingDate(job.validThrough),
  };
}
export async function fetchAdvert(sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (url.protocol !== "https:" || !/^(www\.)?environmentjob\.co\.uk$/.test(url.hostname))
    throw new Error("Unexpected advert host");
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    headers: { "User-Agent": "WildJobs/1.0 (WildTeam job directory)" },
  });
  if (!response.ok) throw new Error(`Advert HTTP ${response.status}`);
  return parseAdvert(await response.text());
}
