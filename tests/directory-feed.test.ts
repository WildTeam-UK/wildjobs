import { describe, it, expect } from "vitest";
import { parseFeed, normaliseSalary } from "../lib/directory-feed";
const xml = (description: string) =>
  `<rss><channel><item><title>Ecologist</title><link>https://environmentjob.co.uk/jobs/123-ecologist?from_rss=true</link><guid>123</guid><pubDate>Fri, 30 Oct 2026 17:11:15 +0000</pubDate><description><![CDATA[${description}]]></description></item></channel></rss>`;
describe("feed cards", () => {
  it("separates organisation, searchable location, salary and text", () => {
    const [job] = parseFeed(
      xml(
        "Nature Trust, Exeter, Devon, £30,000 - £40,000 pa pro rata. Lead ecological surveys and manage projects.",
      ),
    );
    expect(job).toMatchObject({
      organisation_name: "Nature Trust",
      location_text: "Exeter, Devon",
      locality: "Exeter",
      region: "Devon",
      salary_text: "£30,000 – £40,000 per year pro rata",
      workplace: "Not specified",
      summary: "Lead ecological surveys and manage projects.",
      posted_at: "2026-10-30T17:11:15.000Z",
      source_url: "https://environmentjob.co.uk/jobs/123-ecologist",
    });
  });
  it("retains recognised organisation names containing commas", () => {
    expect(
      parseFeed(
        xml("Royal Botanic Gardens, Kew, Richmond, London, £35,380 pa. Teach environmental sessions."),
        new Date(),
        ["Royal Botanic Gardens, Kew"],
      )[0],
    ).toMatchObject({ organisation_name: "Royal Botanic Gardens, Kew", location_text: "Richmond, London" });
  });
  it("recognises explicit workplace and leaves absent salary unknown", () => {
    expect(
      parseFeed(xml("Nature Trust, UK-based / Home-based, Competitive salary. Lead ecological surveys."))[0],
    ).toMatchObject({
      location_text: "UK-based / Home-based",
      workplace: "Remote",
      salary_text: "Not stated",
    });
  });
  it("strips salary qualifiers out of the location", () => {
    expect(
      parseFeed(xml("Nature Trust, Exeter, Up to £45,000 pa. Manage nature reserves."))[0].location_text,
    ).toBe("Exeter");
  });
  it("uses a stable content hash and changes it when feed text changes", () => {
    expect(parseFeed(xml("Trust, Exeter, £30000 pa. Surveys."))[0].feed_hash).not.toBe(
      parseFeed(xml("Trust, Exeter, £35000 pa. Surveys."))[0].feed_hash,
    );
  });
  it("rejects malformed RSS without treating it as an empty replacement", () => {
    expect(() => parseFeed("<rss/>")).toThrow();
  });
});
describe("salary formatting", () => {
  it.each([
    ["£30000 per annum + benefits", "£30,000 per year + Benefits"],
    ["£34,992 FTE (£17.94/hour)", "£34,992 per year"],
    ["£6,187 for 10 hours/week for 9 months", "£6,187 total"],
    ["£12.71 per hour", "£12.71 per hour"],
    ["£250/day", "£250 per day"],
    ["Competitive", "Not stated"],
  ])("formats %s", (source, expected) => {
    expect(normaliseSalary(source)).toBe(expected);
  });
});
