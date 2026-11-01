import { isIP } from "node:net";

export function isPublicAddress(address: string): boolean {
  const value = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(value) === 4) {
    const [a, b] = value.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  // Only global unicast, excluding mapped/transition and IETF special-use space.
  if (isIP(value) === 6) {
    const [first, second = "0"] = value.split(":");
    return (
      /^[23][0-9a-f]{0,3}$/.test(first) &&
      first !== "2002" &&
      !(first === "2001" && (Number.parseInt(second || "0", 16) < 0x200 || second === "db8")) &&
      !value.startsWith("3fff:")
    );
  }
  return false;
}
export function publicUrl(value: string, base?: string) {
  const url = new URL(value, base);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.toString().length > 2048 ||
    (url.port && !["80", "443"].includes(url.port)) ||
    host === "localhost" ||
    /\.(?:localhost|local|internal|test|invalid)$/.test(host) ||
    (!isIP(host) && !host.includes(".")) ||
    (isIP(host) && !isPublicAddress(host))
  )
    throw new Error("Use a public HTTP or HTTPS feed URL.");
  url.hash = "";
  return url;
}
export function canonicalUrl(value: string, base?: string) {
  const url = publicUrl(value, base);
  const trackingKeys = [...url.searchParams.keys()].filter((key) =>
    /^utm_|^(?:from_rss|fbclid|gclid|mc_cid|mc_eid)$/i.test(key),
  );
  for (const key of trackingKeys) url.searchParams.delete(key);
  url.searchParams.sort();
  url.hostname = url.hostname.replace(/^www\./, "");
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}
