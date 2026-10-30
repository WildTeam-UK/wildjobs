import { describe, expect, it } from "vitest";

import { compactJobLocation } from "../lib/jobs";

describe("compact job locations", () => {
  it("uses a structured locality and country code when available", () => {
    expect(
      compactJobLocation({
        countryCode: "GB",
        location: "The Quays, Neath, Neath Port Talbot, SA11 2GG, GB",
        locationLocality: "Neath",
        locationRegion: "Neath Port Talbot",
        locationType: "On-site",
      }),
    ).toBe("Neath, GB");
  });

  it("uses the region as a safe fallback without parsing the advertised address", () => {
    expect(
      compactJobLocation({
        countryCode: "GB",
        location: "Highland",
        locationRegion: "Highland",
        locationType: "On-site",
      }),
    ).toBe("Highland, GB");
  });

  it("labels remote work without exposing an irrelevant office address", () => {
    expect(
      compactJobLocation({
        countryCode: "GB",
        location: "United Kingdom",
        locationType: "Remote",
      }),
    ).toBe("Remote, GB");
  });
});
