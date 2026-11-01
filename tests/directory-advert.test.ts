import { describe, it, expect, vi } from "vitest";
import { parseAdvert, fetchAdvert, advertPage } from "../lib/directory-advert";
const page = (job: Record<string, unknown>, extra = "") =>
  `<script type='application/ld+json'>${JSON.stringify({ "@type": "JobPosting", ...job })}</script>${extra}`;
describe("EnvironmentJob advert", () => {
  it("reads the original description, employment choices and exact source logo", () => {
    const result = parseAdvert(
      page(
        {
          description:
            "<p>A full-time role on a fixed-term contract, with hybrid working.</p><p>Write trusts &amp; foundations applications. We&#39;re supporting nature.</p>",
          employmentType: ["FULL_TIME", "PART_TIME"],
          validThrough: "2026-11-08T23:55:00Z",
          hiringOrganization: { logo: "https://assets.example.org/trust_open_graph.jpg" },
          jobLocation: { address: { addressCountry: "United Kingdom" } },
        },
        '<img src="https://assets.example.org/trust_large.jpg" alt="Example Trust">',
      ),
    );
    expect(result).toMatchObject({
      description:
        "A full-time role on a fixed-term contract, with hybrid working. Write trusts & foundations applications. We're supporting nature.",
      hours: "Full time · Part time",
      closesAt: "2026-11-08T23:55:00.000Z",
      contract: "Fixed term",
      workplace: "Hybrid",
      countryCode: "GB",
      logoUrl: "https://assets.example.org/trust_large.jpg",
    });
  });
  it("reads JobPosting from a graph and leaves missing facts unknown", () => {
    expect(
      parseAdvert(
        page({
          "@type": "WebPage",
          "@graph": [{ "@type": "JobPosting", description: "Lead wildlife surveys." }],
        }),
      ),
    ).toMatchObject({ description: "Lead wildlife surveys.", hours: null, contract: null, workplace: null });
  });
  it("uses an explicit telecommute value", () =>
    expect(
      parseAdvert(page({ description: "Lead nature projects.", jobLocationType: "TELECOMMUTE" }))?.workplace,
    ).toBe("Remote"));
  it("does not mistake ordinary habitat descriptions for office working", () =>
    expect(
      parseAdvert(page({ description: "Restore permanent ponds and teach on-site education sessions." }))
        ?.workplace,
    ).toBeNull());
  it("does not manufacture a logo or full description when metadata is absent", () =>
    expect(parseAdvert("<h1>Example role</h1>")).toBeNull());
  it("does not accept an executable logo URL", () =>
    expect(
      parseAdvert(page({ hiringOrganization: { logo: "javascript:alert(1)" } }))?.logoUrl,
    ).toBeUndefined());
});
vi.mock("../lib/directory-http", () => ({ fetchPublicText: vi.fn() }));
it("uses the shared public-web reader for another source's advert", async () => {
  const { fetchPublicText } = await import("../lib/directory-http");
  vi.mocked(fetchPublicText).mockResolvedValue({
    text: page({ description: "Coordinate a wildlife project." }),
    url: "https://jobs.example.org/1",
  });
  expect((await fetchAdvert("https://jobs.example.org/1")).description).toBe(
    "Coordinate a wildlife project.",
  );
  expect(fetchPublicText).toHaveBeenCalledWith("https://jobs.example.org/1");
});
it("reads structured employer, searchable place, pay and canonical job URL", () => {
  expect(
    parseAdvert(
      page({
        title: "Ecologist",
        hiringOrganization: { name: "Nature Trust", logo: "/logo.png" },
        jobLocation: {
          address: {
            addressLocality: "Exeter",
            addressRegion: "Devon",
            addressCountry: { name: "United Kingdom" },
          },
        },
        baseSalary: { currency: "GBP", value: { minValue: 30000, maxValue: 35000, unitText: "YEAR" } },
        url: "/job/123?utm_source=rss",
      }),
      "https://jobs.example.org/123",
    ),
  ).toMatchObject({
    title: "Ecologist",
    organisationName: "Nature Trust",
    locationText: "Exeter, Devon, GB",
    salary: "£30,000 – £35,000 per year",
    logoUrl: "https://jobs.example.org/logo.png",
    canonicalUrl: "https://jobs.example.org/job/123",
  });
});
it("uses the advert body when JobPosting metadata is absent", () => {
  const result = advertPage(
    '<body><nav>Other vacancies</nav><main><h1>Ecologist</h1><p>Survey woodland and advise landowners.</p><img class="employer-logo" src="/trust.png" alt="Nature Trust"></main><footer>Subscribe</footer></body>',
    "https://jobs.example.org/job/123",
  );
  expect(result.description).toBe("Ecologist Survey woodland and advise landowners.");
  expect(result.logoCandidates).toEqual([{ url: "https://jobs.example.org/trust.png", alt: "Nature Trust" }]);
});
