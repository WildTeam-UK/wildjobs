import { describe, expect, it } from "vitest";

import { parseEmployerPage, parseVacancyPage } from "../lib/admin/vacancy-page-extraction";

const pageUrl = "https://www.countryside-jobs.com/job/nov26/conservation-officer-example-trust-2910-1";

describe("vacancy page extraction", () => {
  it("does not treat a fallback vacancy URL as application instructions", () => {
    const result = parseVacancyPage(
      '<script type="application/ld+json">{"@type":"JobPosting","description":"Restore habitats with local communities.","url":"https://example.org/role"}</script>',
      pageUrl,
    );
    expect(result.applicationUrl).toBe("https://example.org/role");
    expect(result.applicationInstructionsFound).toBe(false);
  });

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
                    "addressRegion": "City of Bristol",
                    "postalCode": "BS1 5AH",
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
      applicationInstructionsFound: true,
      applicationUrl: "https://nature.example.org/apply/123",
      closesAt: "2026-11-30",
      employerLogoUrl: "https://nature.example.org/logo.png",
      employerName: "Example Nature Trust",
      employerWebsiteUrl: "https://nature.example.org/",
      locationCountryCode: "GB",
      locationLocality: "Bristol",
      locationRegion: "City of Bristol",
      locationText: "Bristol, City of Bristol, BS1 5AH, GB",
      postalCode: "BS1 5AH",
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

    expect(result).toMatchObject({
      logoSourceUrl: "https://nature.example.org/about",
      logoUrl: "https://nature.example.org/assets/brand.svg",
    });
    expect(result.text).toContain("We restore habitats with communities.");
  });

  it("preserves readable paragraph breaks from structured vacancy copy", () => {
    const result = parseVacancyPage(
      `<script type="application/ld+json">{
        "@type":"JobPosting",
        "title":"Ranger",
        "description":"<p>Protect priority habitats.</p><p>Work with local volunteers.</p>"
      }</script>`,
      pageUrl,
    );

    expect(result.detailText).toBe("Protect priority habitats.\n\nWork with local volunteers.");
  });

  it("does not invent one locality when an advert names multiple workplaces", () => {
    const result = parseVacancyPage(
      `<script type="application/ld+json">{
        "@type":"JobPosting",
        "title":"Regional Ranger",
        "jobLocation":[
          {"address":{"addressLocality":"Bristol","addressCountry":"United Kingdom"}},
          {"address":{"addressLocality":"Bath","addressCountry":"United Kingdom"}}
        ]
      }</script>`,
      pageUrl,
    );

    expect(result).toMatchObject({
      locationCountryCode: "GB",
      locationLocality: null,
      locationRegion: null,
      locationText: "Bristol, United Kingdom; Bath, United Kingdom",
      postalCode: null,
    });
  });

  it("prefers a visible brand logo over a small browser icon", () => {
    const result = parseEmployerPage(
      `<html><head><link rel="icon" href="/favicon.ico"></head><body>
        <header><img class="site-logo" src="/assets/full-logo.svg" alt="Example Trust logo"></header>
      </body></html>`,
      "https://nature.example.org/",
    );

    expect(result).toMatchObject({
      logoSourceUrl: "https://nature.example.org/",
      logoUrl: "https://nature.example.org/assets/full-logo.svg",
    });
  });

  it("ranks one same-site employer research page without following unrelated links", () => {
    const result = parseEmployerPage(
      `
        <html><body><nav>
          <a href="https://elsewhere.example.org/about">External about</a>
          <a href="/jobs">Jobs</a>
          <a href="/privacy">Privacy</a>
          <a href="/our-work?utm_source=nav">Our work</a>
          <a href="/about-us#team">About us</a>
          <a href="/our-mission">Mission and vision</a>
        </nav><main><p>We restore habitats with communities.</p></main></body></html>
      `,
      "https://www.nature.example.org/",
    );

    expect(result.researchUrls).toEqual([
      "https://www.nature.example.org/our-mission",
      "https://www.nature.example.org/about-us",
      "https://www.nature.example.org/our-work",
    ]);
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
