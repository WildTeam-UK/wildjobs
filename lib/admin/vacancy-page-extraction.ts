import { load } from "cheerio";

import { extractVacancyFieldEvidence, type VacancyFieldEvidence } from "./vacancy-detail-extraction";

type JsonRecord = Record<string, unknown>;

export const SOURCE_PAGE_EXTRACTOR_VERSION = "source-page-rules-v4";

export type VacancyPageExtraction = {
  applicationUrl: string | null;
  closesAt: string | null;
  detailText: string;
  employerLogoUrl: string | null;
  employerName: string | null;
  employerWebsiteUrl: string | null;
  evidence: VacancyFieldEvidence[];
  locationText: string | null;
  postedAt: string | null;
  salaryText: string | null;
  title: string | null;
};

export type EmployerPageExtraction = {
  logoUrl: string | null;
  researchUrls: string[];
  text: string;
  title: string | null;
};

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
}

function clean(value: unknown, maximum = 60_000) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maximum) : "";
}

function safeHttpsUrl(value: unknown, baseUrl: string) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value, baseUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hostname === "localhost" ||
      /^(?:127\.|10\.|192\.168\.|169\.254\.|0\.|\[?::1\]?$)/.test(url.hostname)
    ) {
      return null;
    }
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function findTypedObject(value: unknown, type: string): JsonRecord | null {
  for (const candidate of asArray(value)) {
    const record = asRecord(candidate);
    if (!record) continue;
    const types = asArray(record["@type"]);
    if (types.includes(type)) return record;
    const nested = findTypedObject(record["@graph"], type);
    if (nested) return nested;
  }
  return null;
}

function parseDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
}

function structuredLocation(jobPosting: JsonRecord | null) {
  if (!jobPosting) return null;
  const locations: string[] = [];

  for (const candidate of asArray(jobPosting.jobLocation)) {
    const place = asRecord(candidate);
    const address = asRecord(place?.address);
    const parts = [
      clean(address?.streetAddress, 120),
      clean(address?.addressLocality, 120),
      clean(address?.addressRegion, 120),
      clean(address?.postalCode, 40),
      clean(address?.addressCountry, 80),
    ].filter(Boolean);
    if (parts.length) locations.push([...new Set(parts)].join(", "));
  }

  return locations.length ? [...new Set(locations)].join("; ").slice(0, 500) : null;
}

function structuredSalary(jobPosting: JsonRecord | null) {
  const salary = asRecord(jobPosting?.baseSalary);
  if (!salary) return null;
  const value = asRecord(salary.value);
  const currency = clean(salary.currency, 8);
  const advertisedUnit = clean(value?.unitText, 40).toLocaleLowerCase("en-GB");
  const minimum = typeof value?.minValue === "number" ? value.minValue : null;
  const maximum = typeof value?.maxValue === "number" ? value.maxValue : null;
  const single = typeof value?.value === "number" ? value.value : null;
  const amounts = [minimum, maximum, single].filter((amount): amount is number => amount !== null);
  const unit = advertisedUnit === "hour" && amounts.some((amount) => amount >= 1_000) ? "" : advertisedUnit;
  const formatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });
  const symbol = currency === "GBP" ? "£" : currency ? `${currency} ` : "";

  if (minimum !== null || maximum !== null) {
    const range = [minimum, maximum]
      .filter((amount): amount is number => amount !== null)
      .map((amount) => `${symbol}${formatter.format(amount)}`)
      .join("–");
    return `${range}${unit ? ` per ${unit}` : ""}`;
  }
  if (single !== null) return `${symbol}${formatter.format(single)}${unit ? ` per ${unit}` : ""}`;
  return null;
}

function salaryAmountCount(value: string | null | undefined) {
  return value?.match(/(?:£|GBP\s*)[\d,.]+/gi)?.length ?? 0;
}

function preferredSalaryText(structured: string | null, extracted: string | null) {
  if (!structured) return extracted;
  if (!extracted) return structured;
  return salaryAmountCount(extracted) > salaryAmountCount(structured) ? extracted : structured;
}

function readJsonLd(html: string) {
  const $ = load(html);
  const values: unknown[] = [];
  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      values.push(JSON.parse($(element).text()));
    } catch {
      // A malformed third-party JSON-LD block is ignored; visible page text remains available.
    }
  });
  return values;
}

function externalUrl(value: unknown, pageUrl: string) {
  const url = safeHttpsUrl(value, pageUrl);
  if (!url) return null;
  return new URL(url).hostname === new URL(pageUrl).hostname ? null : url;
}

function firstExternalUrl(values: unknown[], pageUrl: string) {
  for (const value of values) {
    const url = externalUrl(value, pageUrl);
    if (url) return url;
  }
  return null;
}

function pageText(html: string, structuredDescription: string) {
  if (structuredDescription) return structuredDescription.slice(0, 60_000);

  const $ = load(html);
  $("script, style, noscript, svg, nav, footer").remove();
  const preferred = $("main").first().text() || $("article").first().text() || $("body").text();
  return clean(preferred, 60_000);
}

function structuredDescriptionText(value: unknown) {
  const html = clean(value, 60_000);
  if (!html) return "";
  const $ = load(`<body>${html}</body>`);
  return clean($("body").text(), 60_000);
}

export function parseVacancyPage(html: string, pageUrl: string): VacancyPageExtraction {
  const $ = load(html);
  const jsonLd = readJsonLd(html);
  const jobPosting = jsonLd.map((value) => findTypedObject(value, "JobPosting")).find(Boolean) ?? null;
  const organisation = asRecord(jobPosting?.hiringOrganization);
  const structuredDescription = structuredDescriptionText(jobPosting?.description);
  const detailText = pageText(html, structuredDescription);
  const deterministicEvidence = extractVacancyFieldEvidence(detailText, {
    extractorVersion: SOURCE_PAGE_EXTRACTOR_VERSION,
    sourceKind: "source_page",
  });
  const salaryEvidence = deterministicEvidence.find((item) => item.fieldName === "salary_text");
  const salaryText = preferredSalaryText(structuredSalary(jobPosting), salaryEvidence?.value ?? null);
  if (salaryText && salaryEvidence && salaryEvidence.resolutionStatus === "unresolved") {
    salaryEvidence.confidence = 95;
    salaryEvidence.evidenceText = salaryText;
    salaryEvidence.resolutionStatus = "extracted";
    salaryEvidence.value = salaryText;
  }

  const employerWebsiteUrl = firstExternalUrl(
    [organisation?.sameAs, organisation?.url].flatMap(asArray),
    pageUrl,
  );
  const employerLogoUrl = safeHttpsUrl(
    asRecord(organisation?.logo)?.url ?? organisation?.logo,
    employerWebsiteUrl ?? pageUrl,
  );

  let applicationUrl: string | null = null;
  $("a[href]").each((_index, element) => {
    if (applicationUrl) return;
    const label = clean($(element).text(), 160);
    if (!/\bapply(?:\s+now|\s+online|\s+for)?\b/i.test(label)) return;
    applicationUrl = safeHttpsUrl($(element).attr("href"), pageUrl);
  });

  if (!applicationUrl) applicationUrl = safeHttpsUrl(jobPosting?.url, pageUrl);
  if (!applicationUrl) applicationUrl = pageUrl;

  const locationText = structuredLocation(jobPosting);
  const title = clean(jobPosting?.title, 240) || clean($("h1").first().text(), 240) || null;
  const employerName = clean(organisation?.name, 200) || null;

  return {
    applicationUrl,
    closesAt: parseDate(jobPosting?.validThrough),
    detailText,
    employerLogoUrl,
    employerName,
    employerWebsiteUrl,
    evidence: deterministicEvidence,
    locationText,
    postedAt: parseDate(jobPosting?.datePosted),
    salaryText,
    title,
  };
}

export function parseEmployerPage(html: string, pageUrl: string): EmployerPageExtraction {
  const $ = load(html);
  const jsonLd = readJsonLd(html);
  const organisation = jsonLd.map((value) => findTypedObject(value, "Organization")).find(Boolean) ?? null;
  const logoUrl =
    safeHttpsUrl(asRecord(organisation?.logo)?.url ?? organisation?.logo, pageUrl) ??
    safeHttpsUrl($("link[rel='apple-touch-icon']").first().attr("href"), pageUrl) ??
    safeHttpsUrl($("link[rel~='icon']").first().attr("href"), pageUrl);
  const currentUrl = new URL(pageUrl);
  const currentHost = currentUrl.hostname.replace(/^www\./, "").toLocaleLowerCase("en-GB");
  const candidates: { order: number; score: number; url: string }[] = [];
  $("a[href]").each((order, element) => {
    const candidate = safeHttpsUrl($(element).attr("href"), pageUrl);
    if (!candidate) return;
    const url = new URL(candidate);
    const host = url.hostname.replace(/^www\./, "").toLocaleLowerCase("en-GB");
    if (host !== currentHost) return;
    url.hash = "";
    url.search = "";
    const normalised = url.toString();
    if (normalised === currentUrl.toString()) return;

    const label = clean($(element).text(), 160).toLocaleLowerCase("en-GB");
    const signal = `${url.pathname.toLocaleLowerCase("en-GB")} ${label}`;
    if (/\b(?:career|contact|cookie|donat|job|login|privacy|shop|vacanc)/.test(signal)) return;
    const score = /\b(?:mission|purpose|vision)\b/.test(signal)
      ? 100
      : /\b(?:about|about-us|who-we-are)\b/.test(signal)
        ? 90
        : /\b(?:what-we-do|our-work)\b/.test(signal)
          ? 80
          : 0;
    if (score) candidates.push({ order, score, url: normalised });
  });
  const researchUrls = [...new Map(candidates.map((candidate) => [candidate.url, candidate])).values()]
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .slice(0, 3)
    .map((candidate) => candidate.url);
  $("script, style, noscript, svg, nav, footer").remove();
  const text = clean($("main").first().text() || $("body").text(), 30_000);
  const title = clean(organisation?.name, 200) || clean($("title").text(), 200) || null;

  return { logoUrl, researchUrls, text, title };
}
