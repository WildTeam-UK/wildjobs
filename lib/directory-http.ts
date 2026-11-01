import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import type { LookupFunction } from "node:net";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { isPublicAddress, publicUrl } from "./directory-url";

export async function fetchPublicText(
  value: string,
  timeout = 8000,
  redirects = 4,
  deadline = Date.now() + timeout,
): Promise<{ text: string; url: string }> {
  const url = publicUrl(value);
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
  const result = await new Promise<{ status: number; location?: string; text: string }>((resolve, reject) => {
    const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        lookup: pinned,
        signal: AbortSignal.timeout(Math.max(1, deadline - Date.now())),
        headers: {
          "User-Agent": "WildJobs/1.0 (WildTeam job directory)",
          "Accept-Encoding": "identity",
          Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          res.resume();
          resolve({ status, location: res.headers.location, text: "" });
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
            resolve({ status, text: body.toString("utf8") });
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
  if (result.location) {
    if (!redirects) throw new Error("Source redirected too many times.");
    return fetchPublicText(
      publicUrl(result.location, url.toString()).toString(),
      timeout,
      redirects - 1,
      deadline,
    );
  }
  return { text: result.text, url: url.toString() };
}
