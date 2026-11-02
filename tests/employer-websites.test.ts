import { describe, expect, it } from "vitest";
import { employerWebsiteMatches, employerWebsiteUrl } from "../lib/employer-websites";

describe("official employer websites", () => {
  it("rejects source-board, social, private and credential-bearing links", () => {
    const advert = "https://board.example/jobs/123";
    for (const url of [
      "https://board.example/employers/trust",
      "https://linkedin.com/company/trust",
      "http://127.0.0.1",
      "https://user:password@trust.example",
    ])
      expect(employerWebsiteUrl(url, advert)).toBeNull();
    expect(employerWebsiteUrl("https://trust.example/careers?utm_source=board", advert)).toBe(
      "https://trust.example",
    );
  });

  it("does not accept a supplier merely because its page mentions the employer", () => {
    expect(
      employerWebsiteMatches(
        "British Trust for Ornithology (BTO)",
        "<title>Vine House Farm</title><p>We support the British Trust for Ornithology and BTO.</p>",
      ),
    ).toBe(false);
  });

  it("recognises an employer's site identity, including its stated acronym", () => {
    expect(
      employerWebsiteMatches(
        "British Trust for Ornithology (BTO)",
        "<title>BTO | Looking out for birds</title>",
      ),
    ).toBe(true);
    expect(
      employerWebsiteMatches(
        "National Trust",
        '<title>Home</title><meta property="og:site_name" content="National Trust">',
      ),
    ).toBe(true);
    expect(employerWebsiteMatches("The Rivers Trust", "<title>Our work | Rivers Trust</title>")).toBe(true);
  });
});
