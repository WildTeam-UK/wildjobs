export const WWT_SEARCH_URL = "https://vacancies.wwt.org.uk/vacancies/vacancy-search-results.aspx";

export type WwtVacancy = {
  canonicalUrl: string;
  closesAt: string | null;
  employer: string | null;
  externalId: string;
  location: string | null;
  publishedAt: string | null;
  summary: string | null;
  title: string;
};

function decodeHtml(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      const numericValue = code.startsWith("#x")
        ? Number.parseInt(code.slice(2), 16)
        : code.startsWith("#")
          ? Number.parseInt(code.slice(1), 10)
          : null;
      if (numericValue !== null) {
        return Number.isSafeInteger(numericValue) && numericValue <= 0x10ffff
          ? String.fromCodePoint(numericValue)
          : entity;
      }
      return named[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function parseClosingDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() + 1 !== Number(month) ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function isSupportedWwtSource(value: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "vacancies.wwt.org.uk" &&
      url.pathname === "/vacancies/vacancy-search-results.aspx" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function parseWwtVacancies(html: string): WwtVacancy[] {
  const titlePattern =
    /<h2\b[^>]*class=["'][^"']*\bvsr-job__title\b[^"']*["'][^>]*>[\s\S]*?<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/gi;
  const titleMatches = [...html.matchAll(titlePattern)];
  const vacancies = new Map<string, WwtVacancy>();

  titleMatches.forEach((match, index) => {
    let canonicalUrl: URL;
    try {
      canonicalUrl = new URL(match[1], "https://vacancies.wwt.org.uk/vacancies/");
    } catch {
      return;
    }
    const pathMatch = /^\/vacancies\/(\d+)\/[^/]+\.html$/.exec(canonicalUrl.pathname);
    const chunk = html.slice(match.index, titleMatches[index + 1]?.index ?? html.length);
    const closingMatch =
      /<div\b[^>]*class=["'][^"']*\bvsr-job__date-posted\b[^"']*["'][^>]*>\s*Closing Date:\s*([^<]+)<\/div>/i.exec(
        chunk,
      );
    const closesAt = closingMatch ? parseClosingDate(decodeHtml(closingMatch[1])) : null;
    const title = decodeHtml(match[2]);

    if (
      canonicalUrl.protocol !== "https:" ||
      canonicalUrl.hostname !== "vacancies.wwt.org.uk" ||
      !pathMatch ||
      !title
    ) {
      return;
    }

    if (!vacancies.has(pathMatch[1])) {
      vacancies.set(pathMatch[1], {
        canonicalUrl: canonicalUrl.toString(),
        closesAt,
        employer: "WWT",
        externalId: pathMatch[1],
        location: null,
        publishedAt: null,
        summary: null,
        title,
      });
    }
  });

  return [...vacancies.values()];
}
