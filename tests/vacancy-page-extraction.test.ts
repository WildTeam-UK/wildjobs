import { describe, expect, it } from "vitest";

import { parseEmployerPage, parseVacancyPage } from "../lib/admin/vacancy-page-extraction";

const pageUrl = "https://www.countryside-jobs.com/job/nov26/conservation-officer-example-trust-2910-1";

describe("vacancy page extraction", () => {
  it("extracts structured vacancy, application and employer facts without guessing", () => {
    const result = parseVacancyPage(
      `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "JobPosting",
                "title": "Conservation Officer",
                "description": "<p>Salary: £31,000. Permanent, full-time role with hybrid working.</p>",
                "datePosted": "2026-10-28",
                "validThrough": "2026-11-30T23:59:59Z",
                "hiringOrganization": {
                  "@type": "Organization",
                  "name": "Example Nature Trust",
                  "sameAs": "https://nature.example.org",
                  "logo": "https://nature.example.org/logo.png"
                },
                "jobLocation": {
                  "address": {
                    "addressLocality": "Bristol",
                    "addressCountry": "GB"
                  }
                }
              }
            </script>
          </head>
          <body>
            <main><a href="https://nature.example.org/apply/123">Apply now</a></main>
          </body>
        </html>
      `,
      pageUrl,
    );

    expect(result).toMatchObject({
      applicationUrl: "https://nature.example.org/apply/123",
      closesAt: "2026-11-30",
      employerLogoUrl: "https://nature.example.org/logo.png",
      employerName: "Example Nature Trust",
      employerWebsiteUrl: "https://nature.example.org/",
      locationText: "Bristol, GB",
      postedAt: "2026-10-28",
      title: "Conservation Officer",
    });
    expect(result.evidence.find((item) => item.fieldName === "salary_text")).toMatchObject({
      resolutionStatus: "extracted",
      value: "£31,000",
    });
    expect(result.evidence.find((item) => item.fieldName === "workplace_type")).toMatchObject({
      value: "hybrid",
    });
  });

  it("extracts an official organisation logo and keeps the page text for bounded enrichment", () => {
    const result = parseEmployerPage(
      `
        <html>
          <head>
            <script type="application/ld+json">
              {"@type":"Organization","logo":"/assets/brand.svg"}
            </script>
          </head>
          <body><main><h1>Example Nature Trust</h1><p>We restore habitats with communities.</p></main></body>
        </html>
      `,
      "https://nature.example.org/about",
    );

    expect(result.logoUrl).toBe("https://nature.example.org/assets/brand.svg");
    expect(result.text).toContain("We restore habitats with communities.");
  });

  it("keeps a richer advertised salary range and rejects incidental remote wording", () => {
    const result = parseVacancyPage(
      `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "JobPosting",
                "title": "Civil Engineer",
                "description": "Reference: REQ1254Salary: £36987 - £39459 per annum + 28.97% employer pension contributionsType: Permanent. Projects include remote, steep or environmentally sensitive areas.",
                "baseSalary": {
                  "@type": "MonetaryAmount",
                  "currency": "GBP",
                  "value": {"@type": "QuantitativeValue", "value": 36987, "unitText": "YEAR"}
                }
              }
            </script>
          </head>
          <body><main><h1>Civil Engineer</h1></main></body>
        </html>
      `,
      pageUrl,
    );

    expect(result.salaryText).toBe("£36987 - £39459 per annum + 28.97% employer pension contributions");
    expect(result.evidence.find((item) => item.fieldName === "salary_text")).toMatchObject({
      value: "£36987 - £39459 per annum + 28.97% employer pension contributions",
    });
    expect(result.evidence.find((item) => item.fieldName === "workplace_type")).toMatchObject({
      resolutionStatus: "unresolved",
      value: null,
    });
  });

  it("drops an implausible hourly period without guessing an annual one", () => {
    const result = parseVacancyPage(
      `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "JobPosting",
                "title": "Wildlife Education Warden",
                "description": "Connect people with nature on protected heathlands.",
                "baseSalary": {
                  "@type": "MonetaryAmount",
                  "currency": "GBP",
                  "value": {"@type": "QuantitativeValue", "value": 28910, "unitText": "HOUR"}
                }
              }
            </script>
          </head>
          <body><main><h1>Wildlife Education Warden</h1></main></body>
        </html>
      `,
      pageUrl,
    );

    expect(result.salaryText).toBe("£28,910");
    expect(result.evidence.find((item) => item.fieldName === "salary_text")).toMatchObject({
      value: "£28,910",
    });
  });
});
