import { plainText } from "./directory-text";

export function formatSalaryLabel(value: string): string {
  return value.replace(/\(\s*pro[\s-]*rata\s*\)|\bpro[\s-]*rata\b/gi, "(pro rata)");
}

// Keep ISO currencies explicit; a bare $ or ¥ does not identify a country.
const currencies = new Set(Intl.supportedValuesOf("currency"));
const symbols: Record<string, string> = {
  "£": "GBP",
  "€": "EUR",
  "₹": "INR",
  "₩": "KRW",
  "₽": "RUB",
  "₱": "PHP",
  "₺": "TRY",
  "฿": "THB",
  "₫": "VND",
  "₪": "ILS",
  R$: "BRL",
  US$: "USD",
  CA$: "CAD",
  C$: "CAD",
  AU$: "AUD",
  A$: "AUD",
  NZ$: "NZD",
  HK$: "HKD",
  SG$: "SGD",
  S$: "SGD",
  "CN¥": "CNY",
  "JP¥": "JPY",
};
const currencyToken = `(?:${[...currencies, ...Object.keys(symbols), "$", "¥"]
  .sort((a, b) => b.length - a.length)
  .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|")})`;
const numberToken =
  "(?:\\d{1,3}(?:,\\d{2})+,\\d{3}|\\d+(?:[.,'’ \\u202f]\\d{3})*)(?:[.,]\\d{1,2})?(?:[kK](?![a-zA-Z]))?";
const moneyPattern = new RegExp(
  `(?<![\\w])(${currencyToken})?\\s*(${numberToken})(?:\\s*(?:[–—-]|to)\\s*(${currencyToken})?\\s*(${numberToken}))?(?:\\s*(${currencyToken})(?![a-zA-Z]))?`,
  "gi",
);
type SalaryOptions = { currency?: string; unit?: string; defaultAnnual?: boolean };
export type Salary = { text: string; minimum: number | null; currency: string | null; period: string | null };
function currencyCode(value: string) {
  const upper = value.toUpperCase();
  return symbols[upper] ?? (currencies.has(upper) ? upper : null);
}
function amount(value: string) {
  const suffix = /k$/i.test(value) ? 1000 : 1;
  const raw = value.replace(/k$/i, "").replace(/['’\s]/g, "");
  const decimal = raw.match(/[.,](\d{1,2})$/);
  const numeric = decimal
    ? raw.slice(0, decimal.index).replace(/[.,]/g, "") + "." + decimal[1]
    : raw.replace(/[.,]/g, "");
  return Number(numeric) * suffix;
}
function payPeriod(text: string): string | null {
  if (/^(?:biweekly|fortnightly|per fortnight|every two weeks)\b/i.test(text)) return "per fortnight";
  if (/^(?:per\s+|an?\s+|\/\s*|p\/?)?(?:hour|hr|hourly)s?\b|^ph\b/i.test(text)) return "per hour";
  if (/^(?:per\s+|a\s+|\/\s*)?(?:day|daily)s?\b/i.test(text)) return "per day";
  if (/^(?:per\s+|a\s+|\/\s*)?(?:week|weekly)s?\b/i.test(text)) return "per week";
  if (/^(?:per\s+|a\s+|\/\s*|p\/)?(?:month|monthly)s?\b/i.test(text)) return "per month";
  if (/^(?:per\s+|an?\s+|\/\s*)?(?:year|yearly|yr|annum|annually|annual)s?\b|^p\.?a\.?\b/i.test(text))
    return "per year";
  if (/^for \d+\s*(?:hours?|days?|months?|weeks?)\b|^total\b|^(?:stipend|bursary)\b/i.test(text))
    return "total";
  return null;
}
export function parseSalary(value: string, options: SalaryOptions = {}): Salary {
  const text = plainText(value).replace(/\u00a0/g, " ");
  const empty = {
    text: /^(?:voluntary|unpaid|volunteer)$/i.test(text) ? "Voluntary" : "Not stated",
    minimum: null,
    currency: null,
    period: null,
  };
  const hint = options.currency?.toUpperCase();
  for (const match of text.matchAll(moneyPattern)) {
    const token = match[1] || match[5] || (hint && currencies.has(hint) ? hint : "");
    if (!token) continue;
    const currency =
      currencyCode(token) ?? currencyCode(match[5] ?? "") ?? (hint && currencies.has(hint) ? hint : null);
    const otherCurrency = match[3] ? currencyCode(match[3]) : null;
    if (otherCurrency && currency && otherCurrency !== currency) return empty;
    let low = amount(match[2]);
    const high = match[4] ? amount(match[4]) : null;
    if (match[4] && /k$/i.test(match[4]) && !/k$/i.test(match[2])) low *= 1000;
    if (!Number.isFinite(low) || low <= 0 || (high !== null && high < low)) return empty;
    const before = text.slice(Math.max(0, match.index - 90), match.index);
    const after = text.slice(match.index + match[0].length).replace(/^[\s,;:]+/, "");
    const duration = /\b(?:\d+|three|six|nine|twelve)[ -]months?\b/i.test(after.slice(0, 90));
    const period =
      payPeriod(options.unit ?? "") ??
      payPeriod(after) ??
      (/\b(?:annual|yearly|per annum)\b[^.!?]*$/i.test(before) || /^FTE\b/i.test(after)
        ? "per year"
        : null) ??
      (options.defaultAnnual && !duration ? "per year" : null);
    const prefix = currency === "GBP" ? "£" : currency === "EUR" ? "€" : currency ? `${currency} ` : token;
    const format = (n: number) =>
      prefix +
      n.toLocaleString("en-GB", {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2,
      });
    const upTo = /\b(?:up to|maximum(?: of)?)\s*$/i.test(before);
    const from = /\b(?:from|starting (?:at|from))\s*$/i.test(before);
    const qualifiers = text.slice(Math.max(0, match.index - 20), match.index + match[0].length + 100);
    return {
      text: [
        upTo ? "Up to" : from ? "From" : "",
        format(low),
        high !== null ? `– ${format(high)}` : "",
        period,
        /pro[ -]?rata/i.test(qualifiers) ? "pro rata" : "",
        /\bbenefits\b/i.test(qualifiers) ? "+ Benefits" : "",
      ]
        .filter(Boolean)
        .join(" "),
      minimum: upTo ? null : low,
      currency,
      period,
    };
  }
  return empty;
}

export function normaliseSalary(value: string, options: SalaryOptions = {}): string {
  const bands = value.split(/\b(?:pa|per annum|per year)\s*\/\s*(?=[£€$])/i);
  if (bands.length > 1) return bands.map((band) => normaliseSalary(band, options)).join(" / ");
  return parseSalary(value, { defaultAnnual: true, ...options }).text;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
// RSS attributes and schema.org MonetaryAmount/QuantitativeValue share this path.
export function structuredSalary(value: unknown, currency?: string, unit?: string): string {
  const salary = record(value),
    quantity = record(salary.value);
  const low =
    quantity.minValue ?? quantity.value ?? salary.minValue ?? salary["#text"] ?? salary.value ?? value;
  const high = quantity.maxValue ?? salary.maxValue;
  const currencyHint = String(salary.currency ?? salary["@_currency"] ?? currency ?? "");
  const period = String(
    quantity.unitText ?? salary.unitText ?? salary["@_unitText"] ?? salary["@_unit"] ?? unit ?? "",
  );
  const hasLow = typeof low === "string" || typeof low === "number";
  return parseSalary(
    hasLow ? `${low}${high !== undefined ? ` - ${high}` : ""}` : high !== undefined ? `Up to ${high}` : "",
    {
      currency: currencyHint,
      unit: period,
    },
  ).text;
}

// A description may mention budgets, awards or expenses. Only extract money near pay wording.
export function extractSalary(value: string): string {
  const text = plainText(value);
  for (const match of text.matchAll(
    /\b(?:salary|salaries|pay(?:ing)?|compensation|remuneration|living allowance|stipend|bursary|hourly rate)\b/gi,
  )) {
    const context = text.slice(match.index, match.index + 250);
    const firstMoney = [...context.matchAll(moneyPattern)].find((m) => m[1] || m[5]);
    if (
      !firstMoney ||
      firstMoney.index > 160 ||
      /\b(?:budget|reimbursement|expenses|award|bonus|equipment|development fund)\b/i.test(
        context.slice(0, firstMoney.index),
      )
    )
      continue;
    const unit = text
      .slice(Math.max(0, match.index - 25), match.index)
      .match(/\b(annual|yearly|hourly|monthly|weekly)\b[^.!?]*$/i)?.[1];
    const salary = parseSalary(context, { unit });
    if (salary.text !== "Not stated") return salary.text;
  }
  // Short feed headers often say "$70,000 per year — Employer", without a salary label.
  for (const match of text.matchAll(moneyPattern)) {
    if (!match[1] && !match[5]) continue;
    const before = text.slice(Math.max(0, match.index - 70), match.index);
    if (/\b(?:budget|reimbursement|expenses|award|bonus|equipment|development fund)\b/i.test(before))
      continue;
    const salary = parseSalary(text.slice(match.index, match.index + match[0].length + 100));
    if (salary.period) return salary.text;
  }
  return "Not stated";
}

export function completeSalary(primary: string, fallback: string): string {
  if (primary === "Not stated") return fallback;
  const stated = parseSalary(primary),
    extra = parseSalary(fallback);
  if (
    (stated.period && stated.currency) ||
    (stated.currency && extra.currency && stated.currency !== extra.currency)
  )
    return primary;
  const numbers = (text: string) => text.match(/\d[\d,.]*/g)?.join("|");
  if (numbers(stated.text) !== numbers(extra.text)) return primary;
  const currency = stated.currency ?? extra.currency ?? undefined;
  const ambiguous = primary.match(/[$¥]/)?.[0];
  if (!stated.currency && currency && ambiguous) {
    const symbol = new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    })
      .formatToParts(1)
      .find((part) => part.type === "currency")?.value;
    if (symbol !== ambiguous) return primary;
  }
  return parseSalary(primary, { unit: stated.period ?? extra.period ?? undefined, currency }).text;
}

export function minimumGbpSalary(job: { salary: string; salaryMinimum?: number }): number | undefined {
  const salary = parseSalary(job.salary);
  return salary.currency === "GBP" &&
    salary.period === "per year" &&
    !job.salary.includes(" / ") &&
    salary.minimum !== null
    ? job.salaryMinimum
    : undefined;
}
