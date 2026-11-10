import { beforeEach, expect, it, vi } from "vitest";
import {
  employerWebsiteCandidates,
  organisationLogoCandidates,
  findOrganisationLogo,
} from "../lib/organisation-logo";
import { cachePublicIcon, fetchPublicText, fetchWebsiteIcon, verifyPublicImage } from "../lib/directory-http";
vi.mock("../lib/directory-http", () => ({
  fetchPublicText: vi.fn(),
  verifyPublicImage: vi.fn(),
  fetchWebsiteIcon: vi.fn(),
  cachePublicIcon: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());

it("does not mistake a brand-assets photograph or partner logo for the employer logo", () => {
  const candidates = organisationLogoCandidates(
    '<title>Drax Group</title><img src="/Cruachan_brand_assets_2019.jpg" alt="Two Drax workers"><img src="/partner-logo.png" alt="Partner logo"><link rel="apple-touch-icon" href="/drax-icon.png">',
    "https://www.drax.com/",
    "Drax Group",
  );
  expect(candidates).toEqual(["https://www.drax.com/drax-icon.png"]);
});

it("collects employer websites and business email domains, excluding the board and personal email services", () => {
  expect(
    employerWebsiteCandidates(
      '<a href="https://jobs.example.org/jobs">Jobs</a><a href="mailto:careers@nature.org">Apply</a><a href="mailto:person@gmail.com">Email</a><a href="https://www.facebook.com/board">Social</a>',
      "https://jobs.example.org/job/1",
    ),
  ).toEqual(["https://nature.org"]);
});
it("uses structured branding and website icons only when the site identifies the employer", () => {
  const html =
    '<title>Nature Trust</title><script type="application/ld+json">{"@type":"Organization","logo":{"url":"/brand.svg"}}</script><img src="/nature-logo.png" alt="Nature Trust logo"><link rel="apple-touch-icon" href="/icon.png">';
  expect(organisationLogoCandidates(html, "https://nature.org/", "Nature Trust")).toEqual([
    "https://nature.org/brand.svg",
    "https://nature.org/nature-logo.png",
    "https://nature.org/icon.png",
  ]);
  expect(organisationLogoCandidates(html, "https://nature.org/", "Another Employer")).toEqual([]);
});
it("matches legal suffix and punctuation variations", () => {
  expect(
    organisationLogoCandidates('<title>ACRT</title><img src="/logo.svg">', "https://acrt.com", "ACRT Inc"),
  ).toEqual(["https://acrt.com/logo.svg"]);
});
it("rejects unsafe image and website URLs", async () => {
  expect(
    organisationLogoCandidates(
      '<title>Nature Trust</title><img src="javascript:alert(1)" alt="logo">',
      "https://nature.org",
      "Nature Trust",
    ),
  ).toEqual([]);
  expect(await findOrganisationLogo("Nature Trust", "http://169.254.169.254/latest")).toBeNull();
  expect(fetchPublicText).not.toHaveBeenCalled();
});
it("fetches a real image and falls back when a declared logo is broken", async () => {
  vi.mocked(fetchPublicText).mockResolvedValue({
    url: "https://nature.org/",
    text: '<title>Nature Trust</title><img src="/logo.png"><link rel="apple-touch-icon" href="/icon.png">',
  });
  vi.mocked(verifyPublicImage).mockResolvedValueOnce(null);
  vi.mocked(cachePublicIcon).mockResolvedValueOnce("https://nature.org/icon.png");
  expect(await findOrganisationLogo("Nature Trust", "https://nature.org/jobs")).toBe(
    "https://nature.org/icon.png",
  );
  expect(fetchPublicText).toHaveBeenCalledWith("https://nature.org/jobs", 4500);
});
it("does not substitute the logo of an unrelated site", async () => {
  vi.mocked(fetchPublicText).mockResolvedValue({
    url: "https://wrong.org/",
    text: '<title>Wrong Company</title><img src="/logo.png">',
  });
  expect(await findOrganisationLogo("Nature Trust", "https://wrong.org")).toBeNull();
  expect(verifyPublicImage).not.toHaveBeenCalled();
});
it("uses a cached website icon for an advert-linked employer when the homepage is unavailable", async () => {
  vi.mocked(fetchPublicText).mockRejectedValue(new Error("Source HTTP 403"));
  vi.mocked(fetchWebsiteIcon).mockResolvedValue("data:image/svg+xml,verified-icon");
  expect(await findOrganisationLogo("Nature Trust", "https://nature.org", true)).toBe(
    "data:image/svg+xml,verified-icon",
  );
  expect(await findOrganisationLogo("Nature Trust", "https://unverified.org", false)).toBeNull();
});
it("accepts simple inline brand SVGs and excludes executable SVG content and platform favicons", () => {
  const valid = organisationLogoCandidates(
    '<title>Nature Trust</title><svg class="logo" viewBox="0 0 100 100"><path d="M0 0h100v100z"/></svg>',
    "https://nature.org",
    "Nature Trust",
  );
  expect(valid[0]).toMatch(/^data:image\/svg\+xml,/);
  expect(
    organisationLogoCandidates(
      '<title>Nature Trust</title><svg class="logo"><script>alert(1)</script></svg><link rel="icon" href="https://static.parastorage.com/client/pfavico.ico">',
      "https://nature.org",
      "Nature Trust",
    ),
  ).toEqual([]);
});

it("skips an inline white logo when pixel validation rejects it", async () => {
  vi.mocked(fetchPublicText).mockResolvedValue({
    url: "https://nature.org/",
    text: '<title>Nature Trust</title><svg class="logo" width="128" height="128"><circle cx="64" cy="64" r="40" fill="#FFFFFE"/></svg><img src="/logo-green.png" alt="Nature Trust logo">',
  });
  vi.mocked(verifyPublicImage)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce("https://nature.org/logo-green.png");
  expect(await findOrganisationLogo("Nature Trust", "https://nature.org")).toBe(
    "https://nature.org/logo-green.png",
  );
});
