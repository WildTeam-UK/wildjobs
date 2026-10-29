import { describe, expect, it } from "vitest";

import {
  evidenceAppearsInText,
  isAllowedEmployerWebsite,
  isReturnedSearchSource,
  normaliseResearchUrl,
  sameWebsiteHost,
} from "../lib/admin/employer-research-validation";

describe("employer research validation", () => {
  it("accepts clean public employer websites and normalises tracking", () => {
    expect(normaliseResearchUrl("https://www.example.org/about?utm_source=jobs#team")).toBe(
      "https://www.example.org/about",
    );
    expect(isAllowedEmployerWebsite("https://www.example.org/")).toBe(true);
  });

  it("rejects job boards, social sites and unsafe addresses", () => {
    expect(isAllowedEmployerWebsite("https://www.countryside-jobs.com/jobs/employer/example")).toBe(false);
    expect(isAllowedEmployerWebsite("https://linkedin.com/company/example")).toBe(false);
    expect(isAllowedEmployerWebsite("http://example.org")).toBe(false);
    expect(isAllowedEmployerWebsite("not-a-url")).toBe(false);
  });

  it("requires the model source to match a returned search source exactly", () => {
    const sources = ["https://example.org/about/", "https://another.org/"];
    expect(isReturnedSearchSource("https://example.org/about", sources)).toBe(true);
    expect(isReturnedSearchSource("https://example.org/other", sources)).toBe(false);
  });

  it("compares hosts without treating www as a different employer", () => {
    expect(sameWebsiteHost("https://example.org/", "https://www.example.org/about")).toBe(true);
    expect(sameWebsiteHost("https://example.org/", "https://example.com/")).toBe(false);
  });

  it("verifies exact evidence despite harmless whitespace differences", () => {
    expect(
      evidenceAppearsInText(
        "We protect rivers for people and wildlife.",
        "About us\n\nWe protect rivers   for people and wildlife. Our work continues.",
      ),
    ).toBe(true);
    expect(evidenceAppearsInText("We protect oceans.", "We protect rivers.")).toBe(false);
  });
});
