import { describe, expect, it } from "vitest";
import { cleanJobTitle } from "../lib/job-title";
import { basicEmployerSlug, employerPageSlugs } from "../lib/employer-page-slug";
import { compareRecommendedJobs } from "../lib/job-ranking";
import type { Job } from "../lib/jobs";

describe("public title quality", () => {
  it("cleans the reported recruitment headings without losing the role", () => {
    expect(cleanJobTitle("We are hiring! Become our new nature-based solutions officer")).toBe(
      "Nature-based solutions officer",
    );
    expect(cleanJobTitle("Role: Unit Supervisor - Taronga Wildlife Hospital.")).toBe(
      "Unit Supervisor - Taronga Wildlife Hospital",
    );
    expect(cleanJobTitle("Job title: Senior GIS Officer (0.8 FTE).")).toBe("Senior GIS Officer (0.8 FTE)");
  });
  it("preserves meaningful qualifiers, acronyms and empty-source protection", () => {
    for (const title of ["Senior GIS Officer – £35,000", "Director, U.S.", "We are hiring!"]) {
      expect(cleanJobTitle(title)).toBe(title);
    }
    expect(cleanJobTitle("Role: ")).toBe("Role:");
  });
});

describe("immediate employer pages", () => {
  it("provides stable distinct routes for employers with the same readable slug", () => {
    expect(basicEmployerSlug("A & B")).not.toBe(basicEmployerSlug("A B"));
    expect(basicEmployerSlug("A & B")).toMatch(/^organisation-a-b-[a-f0-9]{12}$/);
    expect(basicEmployerSlug("Nature Trust")).toBe(basicEmployerSlug("Nature Trust"));
    expect(basicEmployerSlug("Very long ".repeat(30)).length).toBeLessThanOrEqual(100);
  });
  it("uses a published profile when present and never creates an unknown employer page", () => {
    const slugs = employerPageSlugs(
      [{ name: "Nature Trust" }, { name: "Wildlife Trust" }, { name: "Organisation not stated" }],
      [{ organisation_name: "Nature Trust", slug: "nature-trust" }],
    );
    expect(slugs.get("Nature Trust")).toBe("nature-trust");
    expect(slugs.get("Wildlife Trust")).toBe(basicEmployerSlug("Wildlife Trust"));
    expect(slugs.has("Organisation not stated")).toBe(false);
  });
});

describe("recommended job ordering", () => {
  const job = (slug: string, title: string, summary: string, postedAt = "2026-11-01T00:00:00Z") =>
    ({ slug, title, summary, postedAt, organisation: "Nature Trust" }) as Job;
  it("ranks an advertised role above incidental summary mentions, then uses recency", () => {
    const exact = job("exact", "Project Officer", "Support conservation projects");
    const incidental = job(
      "incidental",
      "Office Administrator",
      "Support the project officer",
      "2026-11-09T00:00:00Z",
    );
    expect([incidental, exact].toSorted((a, b) => compareRecommendedJobs(a, b, "project officer"))[0]).toBe(
      exact,
    );
    expect([exact, incidental].toSorted((a, b) => compareRecommendedJobs(a, b, ""))[0]).toBe(incidental);
  });
  it("uses deterministic ties and does not reward missing or longer summaries", () => {
    const a = job("a", "Ranger", ""),
      b = job("b", "Ranger", "");
    expect(compareRecommendedJobs(a, b, "ranger")).toBeLessThan(0);
  });
});
