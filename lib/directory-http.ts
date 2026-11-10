import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import type { LookupFunction } from "node:net";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { isPublicAddress, publicUrl } from "./directory-url";

export type PublicSourceRequest = { method: "POST"; body: string };

async function fetchPublicResource(
  value: string,
  timeout = 8000,
  redirects = 4,
  deadline = Date.now() + timeout,
  allow?: (url: URL) => boolean,
  sourceRequest?: PublicSourceRequest,
): Promise<{ body: Buffer; contentType: string; url: string }> {
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
            Accept:
              "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9",
            ...(sourceRequest
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
      req.end(sourceRequest?.body);
    },
  );
  if (result.location) {
    if (!redirects) throw new Error("Source redirected too many times.");
    if (sourceRequest)
      throw new Error("The source API redirected a POST request. Check its current endpoint.");
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
export async function verifyPublicImage(value: string, timeout = 4500): Promise<string | null> {
  try {
    const image = await fetchPublicResource(value, timeout);
    return image.body.length > 0 && image.contentType.toLowerCase().startsWith("image/") ? image.url : null;
  } catch {
    return null;
  }
}

export async function cachePublicIcon(url: string, timeout = 1500): Promise<string | null> {
  try {
    const image = await fetchPublicResource(url, timeout);
    const type = image.contentType.split(";")[0].toLowerCase();
    if (!/^image\/(?:png|jpeg|webp|avif|x-icon|vnd.microsoft.icon)$/.test(type) || image.body.length > 100000)
      return null;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><image width="128" height="128" href="data:${type};base64,${image.body.toString("base64")}"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
