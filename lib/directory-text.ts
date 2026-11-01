export function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
export function plainText(html: string) {
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
  // Strip markup before decoding escaped angle brackets.
  return cleanText(html.replace(/<\/(?:p|li|h[1-6]|div)>|<br\s*\/?\s*>/gi, "\n"))
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, code: string) => {
      if (!code.startsWith("#")) return named[code.toLowerCase()] ?? whole;
      const hex = code[1]?.toLowerCase() === "x",
        n = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : whole;
    })
    .replace(/\s+/g, " ")
    .trim();
}
