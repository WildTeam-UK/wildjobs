import { describe, expect, it } from "vitest";
import {
  completeSalary,
  extractSalary,
  minimumGbpSalary,
  parseSalary,
  structuredSalary,
} from "../lib/job-salary";

describe("international salary formatting", () => {
  it.each([
    ["USD 69000 - 95000 per annum", "USD 69,000 – USD 95,000 per year", "USD", 69000],
    ["$69,000-$95,000, per year", "$69,000 – $95,000 per year", null, 69000],
    ["$39,908 – $111,111 USD", "USD 39,908 – USD 111,111", "USD", 39908],
    ["AUD 80k to 95k annually", "AUD 80,000 – AUD 95,000 per year", "AUD", 80000],
    ["CA$30–CA$35/hour", "CAD 30 – CAD 35 per hour", "CAD", 30],
    ["NZ$75,000 per year", "NZD 75,000 per year", "NZD", 75000],
    ["€45.000,50–€50.000,75 per year", "€45,000.50 – €50,000.75 per year", "EUR", 45000.5],
    ["50 000–60 000 SEK per year", "SEK 50,000 – SEK 60,000 per year", "SEK", 50000],
    ["CHF 80’000 per year", "CHF 80,000 per year", "CHF", 80000],
    ["₹12,00,000 per annum", "INR 1,200,000 per year", "INR", 1200000],
    ["ZAR 30,000 per month", "ZAR 30,000 per month", "ZAR", 30000],
    ["KES 100000 monthly", "KES 100,000 per month", "KES", 100000],
    ["BRL 4.000,00 por mes", "BRL 4,000", "BRL", 4000],
    ["¥300000", "¥300,000", null, 300000],
    ["£30–35k per year pro rata + benefits", "£30,000 – £35,000 per year pro rata + Benefits", "GBP", 30000],
    ["Up to £40,000 per year", "Up to £40,000 per year", "GBP", null],
    ["From EUR 40000 annually", "From €40,000 per year", "EUR", 40000],
    ["$1,440 biweekly ($2,880 p/month)", "$1,440 per fortnight", null, 1440],
    ["$31.50-$33.75 hourly", "$31.50 – $33.75 per hour", null, 31.5],
    ["Competitive salary", "Not stated", null, null],
    ["50000", "Not stated", null, null],
  ])("preserves the currency and amount in %s", (input, text, currency, minimum) => {
    expect(parseSalary(input)).toMatchObject({ text, currency, minimum });
  });
  it("does not invent a pay period or currency", () => {
    expect(parseSalary("$50000")).toEqual({ text: "$50,000", currency: null, minimum: 50000, period: null });
  });
  it("reads numeric and string structured salaries with explicit units", () => {
    expect(
      structuredSalary({
        currency: "CAD",
        value: { minValue: "80000", maxValue: "95000", unitText: "YEAR" },
      }),
    ).toBe("CAD 80,000 – CAD 95,000 per year");
    expect(structuredSalary("12.50", "GBP", "HOUR")).toBe("£12.50 per hour");
    expect(structuredSalary(350000, "JPY", "MONTH")).toBe("JPY 350,000 per month");
    expect(structuredSalary({ currency: "INR", value: "600000" })).toBe("INR 600,000");
    expect(structuredSalary({ currency: "USD", value: { maxValue: 60000, unitText: "YEAR" } })).toBe(
      "Up to USD 60,000 per year",
    );
  });
});

describe("salary extraction from descriptions", () => {
  it.each([
    [
      "Manage a $5.8 million budget. The salary range for this position is $165,000–$185,000, commensurate with experience.",
      "$165,000 – $185,000",
    ],
    [
      "This is a salaried employee position paying $88,000 – $97,000 per year. $150 monthly phone reimbursement.",
      "$88,000 – $97,000 per year",
    ],
    ["Salary: $31-$33 per hour. Generous paid time off and benefits.", "$31 – $33 per hour + Benefits"],
    [
      "Living Allowance: $1,360 biweekly ($2,720 p/month). Education Award: $5,176.50.",
      "$1,360 per fortnight",
    ],
    [
      "Annual base salary $155,000–$165,000 plus benefits and 10% performance bonus.",
      "$155,000 – $165,000 per year + Benefits",
    ],
    ["Competitive salary and a professional development fund of $2,000.", "Not stated"],
    ["Manage a $30 million project. Education award: $5000.", "Not stated"],
    ["Salary negotiable. Travel expenses of £200 available.", "Not stated"],
  ])("extracts pay rather than other money", (text, expected) => expect(extractSalary(text)).toBe(expected));
});

it("only compares confirmed GBP annual minimums in the GBP filter", () => {
  const job = (salary: string, salaryMinimum = 50000) => ({ salary, salaryMinimum });
  expect(minimumGbpSalary(job("£50,000 per year"))).toBe(50000);
  for (const salary of [
    "USD 50,000 per year",
    "€50,000 per year",
    "$50,000 per year",
    "£50 per hour",
    "£50,000",
    "Up to £50,000 per year",
  ]) {
    expect(minimumGbpSalary(job(salary))).toBeUndefined();
  }
});

it("reads feed pay headers and completes only matching amounts", () => {
  expect(extractSalary("Ecologist $8,055 - $11,054 per month -- Nature Trust")).toBe(
    "$8,055 – $11,054 per month",
  );
  expect(completeSalary("USD 8,055 – USD 11,054", "$8,055 – $11,054 per month")).toBe(
    "USD 8,055 – USD 11,054 per month",
  );
  expect(completeSalary("USD 70,000 – USD 85,000", "$31 – $33 per hour")).toBe("USD 70,000 – USD 85,000");
  expect(completeSalary("USD 70,000 per year", "$70,000 per month")).toBe("USD 70,000 per year");
  expect(completeSalary("$70,000 per year", "USD 70,000")).toBe("USD 70,000 per year");
  expect(completeSalary("$70,000 per year", "GBP 70,000")).toBe("$70,000 per year");
});
