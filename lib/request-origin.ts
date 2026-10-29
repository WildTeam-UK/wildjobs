import "server-only";

import { headers } from "next/headers";

export async function getRequestOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.protocol === "https:" || parsedOrigin.hostname === "localhost") {
        return parsedOrigin.origin;
      }
    } catch {
      // Fall through to the platform-provided deployment URL.
    }
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
}
