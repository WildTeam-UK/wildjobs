import { describe, expect, it } from "vitest";

import { isSupportedRssSource, parseCjsVacancyFeed, parseVacancyFeed } from "../lib/admin/feed-source";

const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:cjsFeed="http://countryside-jobs.com/feeds/cjsFeedModule/">
  <channel>
    <title>CJS Jobs Feed</title>
    <item>
      <title>Volunteer Officer &amp; Ranger with Example Trust</title>
      <description><![CDATA[&lt;p&gt;Salary: £30,000&lt;/p&gt;&lt;p&gt;Help restore nature.&lt;/p&gt;]]></description>
      <cjsFeed:location>London</cjsFeed:location>
      <cjsFeed:company>Example Trust</cjsFeed:company>
      <cjsFeed:expiry>2026-11-11</cjsFeed:expiry>
      <link>https://www.countryside-jobs.com/job/nov26/volunteer-officer</link>
      <guid isPermaLink="false">cjs_job_123</guid>
      <pubDate>Wed, 28 Oct 2026 00:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Conservation jobs</title>
  <entry>
    <title>River Restoration Officer</title>
    <id>job-456</id>
    <updated>2026-10-28T12:00:00Z</updated>
    <author><name>River Trust</name></author>
    <link rel="alternate" href="https://example.org/jobs/river-restoration" />
    <summary>Restore river habitats with local partners.</summary>
  </entry>
</feed>`;

describe("vacancy feeds", () => {
  it("normalises a CJS RSS 2.0 vacancy", () => {
    expect(parseVacancyFeed(rss)).toEqual([
      {
        canonicalUrl: "https://www.countryside-jobs.com/job/nov26/volunteer-officer",
        closesAt: "2026-11-11",
        employer: "Example Trust",
        externalId: "cjs_job_123",
        location: "London",
        publishedAt: "2026-10-28T00:00:00.000Z",
        summary: "Salary: £30,000 Help restore nature.",
        title: "Volunteer Officer & Ranger with Example Trust",
      },
    ]);
  });

  it("normalises a standard Atom entry", () => {
    expect(parseVacancyFeed(atom)).toEqual([
      {
        canonicalUrl: "https://example.org/jobs/river-restoration",
        closesAt: null,
        employer: "River Trust",
        externalId: "job-456",
        location: null,
        publishedAt: "2026-10-28T12:00:00.000Z",
        summary: "Restore river habitats with local partners.",
        title: "River Restoration Officer",
      },
    ]);
  });

  it("rejects malformed and entity-declaring XML", () => {
    expect(() => parseVacancyFeed("<rss><channel></rss>")).toThrow("invalid XML");
    expect(() => parseVacancyFeed("<!DOCTYPE rss><rss><channel /></rss>")).toThrow("approved XML format");
  });

  it("accepts only the reviewed CJS feed endpoint", () => {
    expect(isSupportedRssSource("https://www.countryside-jobs.com/jobs-feed-items")).toBe(true);
    expect(isSupportedRssSource("https://www.countryside-jobs.com/other-feed")).toBe(false);
    expect(isSupportedRssSource("https://example.org/jobs-feed-items")).toBe(false);
  });

  it("keeps CJS imports on the reviewed job host", () => {
    const offDomain = rss.replace(
      "https://www.countryside-jobs.com/job/nov26/volunteer-officer",
      "https://example.org/job/volunteer-officer",
    );

    expect(parseCjsVacancyFeed(offDomain)).toEqual([]);
  });
});
