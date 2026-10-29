import { describe, expect, it } from "vitest";

import { selectEmployerLogo } from "../lib/admin/employer-logo-selection";

describe("employer logo selection", () => {
  it("keeps an existing verified logo and its matching source over a feed fallback", () => {
    expect(
      selectEmployerLogo({
        candidateLogoSourceUrl: "https://jobs.example.org/role",
        candidateLogoUrl: "https://jobs.example.org/listing-logo.jpg",
        existingLogoSourceUrl: "https://employer.example.org/",
        existingLogoUrl: "https://employer.example.org/brand.svg",
      }),
    ).toEqual({
      logoSourceUrl: "https://employer.example.org/",
      logoUrl: "https://employer.example.org/brand.svg",
    });
  });

  it("upgrades a favicon to a verifiable brand logo", () => {
    expect(
      selectEmployerLogo({
        candidateLogoSourceUrl: "https://employer.example.org/",
        candidateLogoUrl: "https://employer.example.org/brand.svg",
        existingLogoSourceUrl: "https://employer.example.org/",
        existingLogoUrl: "https://employer.example.org/favicon.ico",
      }),
    ).toEqual({
      logoSourceUrl: "https://employer.example.org/",
      logoUrl: "https://employer.example.org/brand.svg",
    });
  });

  it("does not store an unverifiable logo without its source page", () => {
    expect(
      selectEmployerLogo({
        candidateLogoSourceUrl: null,
        candidateLogoUrl: "https://employer.example.org/brand.svg",
        existingLogoSourceUrl: null,
        existingLogoUrl: null,
      }),
    ).toEqual({ logoSourceUrl: null, logoUrl: null });
  });
});
