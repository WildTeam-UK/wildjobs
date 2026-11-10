import { prepareLogoImage } from "./logo-image";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import type { LookupFunction } from "node:net";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { isPublicAddress, publicUrl } from "./directory-url";

export type PublicSourceRequest =
  | { method: "POST"; body: string }
  | { method: "GET"; companyId: string; body?: never };

async function fetchPublicResource(
  value: string,
  timeout = 8000,
  redirects = 4,
  deadline = Date.now() + timeout,
  allow?: (url: URL) => boolean,
  sourceRequest?: PublicSourceRequest,
): Promise<{ body: Buffer; contentType: string; url: string }> {
  if (
    sourceRequest?.method === "GET" &&
    !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(sourceRequest.companyId)
  )
    throw new Error("A public recruitment employer identifier is required.");
  const url = publicUrl(value);
  if (allow && !allow(url)) throw new Error("Source URL is outside the permitted research scope.");
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new Error("Source request timed out.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(url.hostname.replace(/^\[|\]$/g, ""), { all: true, verbatim: true }),
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Source lookup timed out.")), remaining);
      timer.unref();
    }),
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error("The URL must resolve to a public web server.");
  const selected = addresses.find((a) => a.family === 4) ?? addresses[0];
  const pinned: LookupFunction = (_host, options, callback) => {
    if (options.all) callback(null, [selected]);
    else callback(null, selected.address, selected.family);
  };
  const result = await new Promise<{ status: number; location?: string; body: Buffer; contentType: string }>(
    (resolve, reject) => {
      const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(
        url,
        {
          ...(sourceRequest ? { method: sourceRequest.method } : {}),
          lookup: pinned,
          signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
          headers: {
            "User-Agent": "WildJobs/1.0 (WildTeam job directory)",
            "Accept-Encoding": "identity",
            ...(sourceRequest?.method === "GET" ? { "x-company-id": sourceRequest.companyId } : {}),
            Accept:
              "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9",
            ...(sourceRequest?.method === "POST"
              ? {
                  "Content-Type": "application/json",
                  "Content-Length": Buffer.byteLength(sourceRequest.body),
                }
              : {}),
          },
        },
        (res) => {
          const status = res.statusCode ?? 0;
          if ([301, 302, 303, 307, 308].includes(status)) {
            res.resume();
            resolve({ status, location: res.headers.location, body: Buffer.alloc(0), contentType: "" });
            return;
          }
          if (status < 200 || status >= 300) {
            res.resume();
            reject(new Error(`Source HTTP ${status}`));
            return;
          }
          const chunks: Buffer[] = [];
          let bytes = 0;
          res.on("data", (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > 3_000_000) {
              req.destroy(new Error("Source response is too large."));
              return;
            }
            chunks.push(chunk);
          });
          res.on("error", reject);
          res.on("end", () => {
            try {
              let body = Buffer.concat(chunks);
              const opts = { maxOutputLength: 5_000_000 };
              if (res.headers["content-encoding"] === "gzip") body = gunzipSync(body, opts);
              if (res.headers["content-encoding"] === "deflate") body = inflateSync(body, opts);
              if (res.headers["content-encoding"] === "br") body = brotliDecompressSync(body, opts);
              resolve({ status, body, contentType: String(res.headers["content-type"] ?? "") });
            } catch (error) {
              reject(error);
            }
          });
        },
      );
      req.on("error", reject);
      req.end(sourceRequest?.method === "POST" ? sourceRequest.body : undefined);
    },
  );
  if (result.location) {
    if (!redirects) throw new Error("Source redirected too many times.");
    if (sourceRequest)
      throw new Error("The source API redirected a scoped request. Check its current endpoint.");
    return fetchPublicResource(
      publicUrl(result.location, url.toString()).toString(),
      timeout,
      redirects - 1,
      deadline,
      allow,
    );
  }
  return { body: result.body, contentType: result.contentType, url: url.toString() };
}

export async function fetchPublicText(value: string, timeout = 8000) {
  const page = await fetchPublicResource(value, timeout);
  return { text: page.body.toString("utf8"), url: page.url };
}

// Source readers use the same DNS pinning, redirect checks and byte limits as feeds.
export async function fetchPublicSourceResource(
  value: string,
  timeout: number,
  allow: (url: URL) => boolean,
  sourceRequest?: PublicSourceRequest,
) {
  return fetchPublicResource(value, timeout, 4, undefined, allow, sourceRequest);
}

export async function fetchPublicResearchPage(value: string, timeout: number, allow: (url: URL) => boolean) {
  const page = await fetchPublicResource(value, timeout, 4, undefined, allow);
  return { text: page.body.toString("utf8"), url: page.url, contentType: page.contentType };
}
export async function loadPublicLogo(value: string, timeout = 4500) {
  let image: { body: Buffer; contentType: string; url: string };
  if (value.startsWith("data:image/")) {
    if (value.length > 500_000) return null;
    const data = value.match(/^data:(image\/(?:svg\+xml|png|jpeg|webp|avif))(;base64)?,([\s\S]*)$/i);
    if (!data) return null;
    image = {
      body: data[2] ? Buffer.from(data[3], "base64") : Buffer.from(decodeURIComponent(data[3])),
      contentType: data[1],
      url: value,
    };
  } else image = await fetchPublicResource(value, timeout);
  if (!image.contentType.toLowerCase().startsWith("image/")) return null;
  const png = await prepareLogoImage(image.body);
  return png ? { png, url: image.url } : null;
}
export async function verifyPublicImage(value: string, timeout = 4500): Promise<string | null> {
  try {
    return (await loadPublicLogo(value, timeout))?.url ?? null;
  } catch {
    return null;
  }
}

export async function cachePublicIcon(url: string, timeout = 1500): Promise<string | null> {
  try {
    const image = await loadPublicLogo(url, timeout);
    return image ? `data:image/png;base64,${image.png.toString("base64")}` : null;
  } catch {
    return null;
  }
}
export async function fetchWebsiteIcon(website: string, timeout = 1500): Promise<string | null> {
  const domain = publicUrl(website).origin;
  // A missing icon is a 404; never cache Google's generic missing-site image.
  return cachePublicIcon(
    `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(domain)}&sz=128`,
    timeout,
  );
}
