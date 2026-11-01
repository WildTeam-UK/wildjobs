import { describe, it, expect, vi, afterEach } from "vitest";
import { parseAdvert, fetchAdvert } from "../lib/directory-advert";
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
          hiringOrganization: { logo: "https://example.test/trust_open_graph.jpg" },
          jobLocation: { address: { addressCountry: "United Kingdom" } },
        },
        '<img src="https://example.test/trust_large.jpg" alt="Example Trust">',
      ),
    );
    expect(result).toMatchObject({
      description:
        "A full-time role on a fixed-term contract, with hybrid working. Write trusts & foundations applications. We're supporting nature.",
      hours: "Full time · Part time",
      contract: "Fixed term",
      workplace: "Hybrid",
      countryCode: "GB",
      logoUrl: "https://example.test/trust_large.jpg",
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
afterEach(() => vi.unstubAllGlobals());
it("fetches only the linked EnvironmentJob advert", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(new Response(page({ description: "Coordinate a wildlife project." })));
  vi.stubGlobal("fetch", fetch);
  expect((await fetchAdvert("https://environmentjob.co.uk/jobs/1-example"))?.description).toBe(
    "Coordinate a wildlife project.",
  );
  await expect(fetchAdvert("https://example.test/jobs/1-example")).rejects.toThrow("Unexpected advert host");
  expect(fetch).toHaveBeenCalledTimes(1);
});
