import { describe, it, expect } from "vitest";
import { parseSourceFeed } from "../lib/directory-sources";
import { canonicalUrl, publicUrl, isPublicAddress } from "../lib/directory-url";
const now = new Date("2026-11-01T12:00:00Z");
describe("self-service feed parsing", () => {
  it("reads RSS fields and namespaces without a source-specific mapping", () => {
    const feed = parseSourceFeed(
      `<rss xmlns:job="urn:jobs"><channel><title>Nature careers</title><item><guid>123</guid><title>Ecologist &amp; Adviser</title><link>https://jobs.example.org/roles?id=123&amp;utm_source=rss&amp;utm_medium=feed</link><pubDate>Fri, 30 Oct 2026 12:00:00 GMT</pubDate><description><![CDATA[<p>Survey woodland.</p>]]></description><job:companyName>Nature Trust</job:companyName><job:location>Exeter, Devon</job:location><job:salary>£30000 pa pro rata</job:salary><job:employmentType>PART_TIME</job:employmentType></item></channel></rss>`,
      "https://jobs.example.org/rss",
      now,
    );
    expect(feed.name).toBe("Nature careers");
    expect(feed.items[0]).toMatchObject({
      feed_id: "123",
      title: "Ecologist & Adviser",
      organisation_name: "Nature Trust",
      location_text: "Exeter, Devon",
      salary_text: "£30,000 per year pro rata",
      hours_type: "Part time",
      workplace: "On-site",
      canonical_url: "https://jobs.example.org/roles?id=123",
      posted_at: "2026-10-30T12:00:00.000Z",
    });
  });
  it("reads Atom alternate links, XHTML content and stable IDs", () => {
    const feed = parseSourceFeed(
      `<feed xmlns="http://www.w3.org/2005/Atom"><title>Trust roles</title><entry><id>urn:job:77</id><title>Ranger</title><link rel="self" href="/atom/77"/><link rel="alternate" href="/jobs/77"/><published>2026-10-31T10:00:00Z</published><content type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml"><p>Care for a nature reserve.</p></div></content></entry></feed>`,
      "https://trust.example.org/feed",
      now,
    );
    expect(feed.items[0]).toMatchObject({
      feed_id: "urn:job:77",
      source_url: "https://trust.example.org/jobs/77",
      feed_text: "Care for a nature reserve.",
      organisation_name: "Organisation not stated",
      posted_at: "2026-10-31T10:00:00.000Z",
    });
  });
  it("does not change content hashes just because an undated feed is fetched again", () => {
    const xml =
      "<rss><channel><title>Roles</title><item><title>Ranger</title><link>https://trust.example.org/77</link><description>Manage a reserve.</description></item></channel></rss>";
    expect(parseSourceFeed(xml, "https://trust.example.org/feed", now).items[0].feed_hash).toBe(
      parseSourceFeed(xml, "https://trust.example.org/feed", new Date("2026-11-02")).items[0].feed_hash,
    );
  });
  it("accepts a successful empty snapshot, but rejects HTML, malformed XML and declared entities", () => {
    expect(
      parseSourceFeed("<rss><channel><title>Jobs</title></channel></rss>", "https://jobs.example.org/rss")
        .items,
    ).toEqual([]);
    for (const input of [
      "<html>Unavailable</html>",
      "<rss>",
      '<!DOCTYPE rss [<!ENTITY bomb "hello">]><rss><channel><title>&bomb;</title></channel></rss>',
    ])
      expect(() => parseSourceFeed(input, "https://jobs.example.org/rss")).toThrow();
  });
});
describe("public feed URLs", () => {
  it.each([
    "https://127.0.0.1/feed",
    "http://2130706433/feed",
    "http://169.254.169.254/latest",
    "https://10.1.2.3/feed",
    "https://[::1]/feed",
    "https://[::ffff:127.0.0.1]/feed",
    "https://localhost/feed",
    "https://service.internal/feed",
    "file:///etc/passwd",
    "https://user:password@jobs.example.org/feed",
    "https://jobs.example.org:8080/feed",
  ])("rejects %s", (url) => expect(() => publicUrl(url)).toThrow());
  it("keeps meaningful URL parameters while removing all tracking aliases", () => {
    expect(
      canonicalUrl(
        "https://www.jobs.example.org/role/?id=123&utm_source=rss&utm_medium=feed&from_rss=true#apply",
      ),
    ).toBe("https://jobs.example.org/role?id=123");
    expect(canonicalUrl("https://jobs.example.org/role?id=124")).not.toBe(
      canonicalUrl("https://jobs.example.org/role?id=123"),
    );
  });
  it("distinguishes public addresses from internal DNS answers", () => {
    for (const value of [
      "10.0.0.1",
      "192.168.1.2",
      "172.20.1.2",
      "100.64.0.1",
      "fe80::1",
      "fc00::1",
      "2001::1",
    ])
      expect(isPublicAddress(value)).toBe(false);
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
  });
});
