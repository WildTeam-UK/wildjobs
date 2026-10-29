import "server-only";

import type { LookupAddress } from "node:dns";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { getSourceConnector } from "./source-connector";

const MAX_DETAIL_BYTES = 900_000;
const MAX_EMPLOYER_BYTES = 600_000;

export class SourcePageError extends Error {
  constructor(public readonly code: "detail_too_large" | "invalid_source_page" | "source_unavailable") {
    super(code);
  }
}

function isPrivateIp(value: string) {
  if (value.includes(":")) {
    const normalised = value.toLocaleLowerCase("en-GB");
    return (
      normalised === "::1" ||
      normalised.startsWith("fc") ||
      normalised.startsWith("fd") ||
      normalised.startsWith("fe80:")
    );
  }

  const parts = value.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 0
  );
}

async function assertPublicHttpsUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new SourcePageError("invalid_source_page");
  }
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname) {
    throw new SourcePageError("invalid_source_page");
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) {
    throw new SourcePageError("invalid_source_page");
  }
  if (isIP(url.hostname) && isPrivateIp(url.hostname)) throw new SourcePageError("invalid_source_page");

  let addresses: LookupAddress[];
  try {
    addresses = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new SourcePageError("source_unavailable");
  }
  if (!addresses.length || addresses.some((address) => isPrivateIp(address.address))) {
    throw new SourcePageError("invalid_source_page");
  }
  return url;
}

export function isApprovedVacancyDetailUrl(value: string, sourceType: string, sourceUrl: string) {
  const connector = getSourceConnector(sourceType, sourceUrl);
  if (!connector) return false;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.searchParams.has("url"))
      return false;
    if (connector === "rss") {
      return url.hostname === "www.countryside-jobs.com" && url.pathname.startsWith("/job/");
    }
    return url.hostname === "vacancies.wwt.org.uk" && /^\/vacancies\/\d+\/[^/]+\.html$/.test(url.pathname);
  } catch {
    return false;
  }
}

export async function fetchApprovedVacancyPage(
  value: string,
  sourceType: string,
  sourceUrl: string,
  redirectsRemaining = 1,
): Promise<{ html: string; url: string }> {
  if (!isApprovedVacancyDetailUrl(value, sourceType, sourceUrl)) {
    throw new SourcePageError("invalid_source_page");
  }

  let response: Response;
  try {
    response = await fetch(value, {
      cache: "no-store",
      headers: { "User-Agent": "WildJobs vacancy verifier (+https://jobs.wildteam.org.uk)" },
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new SourcePageError("source_unavailable");
  }

  if (response.status >= 300 && response.status < 400 && redirectsRemaining > 0) {
    const location = response.headers.get("location");
    if (!location) throw new SourcePageError("source_unavailable");
    return fetchApprovedVacancyPage(
      new URL(location, value).toString(),
      sourceType,
      sourceUrl,
      redirectsRemaining - 1,
    );
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const contentType = response.headers.get("content-type")?.toLocaleLowerCase("en-GB") ?? "";
  if (!response.ok || !contentType.includes("text/html")) {
    throw new SourcePageError("source_unavailable");
  }
  if (contentLength > MAX_DETAIL_BYTES) throw new SourcePageError("detail_too_large");

  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_DETAIL_BYTES) throw new SourcePageError("detail_too_large");
  return { html: new TextDecoder().decode(body), url: value };
}

function sameEmployerHost(left: URL, right: URL) {
  const normalise = (hostname: string) => hostname.replace(/^www\./, "").toLocaleLowerCase("en-GB");
  return normalise(left.hostname) === normalise(right.hostname);
}

export async function fetchEmployerPage(
  value: string,
  redirectsRemaining = 1,
  originalUrl?: URL,
): Promise<{ html: string; url: string }> {
  const url = await assertPublicHttpsUrl(value);
  const origin = originalUrl ?? url;
  if (!sameEmployerHost(url, origin)) throw new SourcePageError("invalid_source_page");

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "WildJobs employer verifier (+https://jobs.wildteam.org.uk)" },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new SourcePageError("source_unavailable");
  }

  if (response.status >= 300 && response.status < 400 && redirectsRemaining > 0) {
    const location = response.headers.get("location");
    if (!location) throw new SourcePageError("source_unavailable");
    return fetchEmployerPage(new URL(location, url).toString(), redirectsRemaining - 1, origin);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const contentType = response.headers.get("content-type")?.toLocaleLowerCase("en-GB") ?? "";
  if (!response.ok || !contentType.includes("text/html")) throw new SourcePageError("source_unavailable");
  if (contentLength > MAX_EMPLOYER_BYTES) throw new SourcePageError("detail_too_large");

  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_EMPLOYER_BYTES) throw new SourcePageError("detail_too_large");
  return { html: new TextDecoder().decode(body), url: url.toString() };
}
