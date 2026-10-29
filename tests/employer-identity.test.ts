import { describe, expect, it } from "vitest";

import {
  employerIdentityConflicts,
  employerIdentityMatches,
  employerNamesMatch,
  employerWebsitesMatch,
} from "../lib/admin/employer-identity";

describe("employer identity", () => {
  it("does not treat different government organisations as the same employer", () => {
    expect(
      employerWebsitesMatch(
        "https://www.gov.uk/government/organisations/environment-agency",
        "https://www.gov.uk/government/organisations/natural-england",
      ),
    ).toBe(false);
  });

  it("matches different pages on an ordinary employer website", () => {
    expect(employerWebsitesMatch("https://example.org/about", "https://www.example.org/jobs")).toBe(true);
  });

  it("recognises common acronym forms", () => {
    expect(employerNamesMatch("RSPB", "Royal Society for the Protection of Birds")).toBe(true);
  });

  it("rejects an existing employer when the source identity conflicts", () => {
    const source = {
      name: "Regional Flood & Coastal Committees",
      websiteUrl: "https://www.gov.uk/government/organisations/environment-agency",
    };
    const candidate = {
      name: "Natural England",
      websiteUrl: "https://www.gov.uk/government/organisations/natural-england",
    };

    expect(employerIdentityConflicts(source, candidate)).toBe(true);
    expect(employerIdentityMatches(source, candidate)).toBe(false);
  });
});
