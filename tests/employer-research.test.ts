import { describe, expect, it } from "vitest";
import { eligibleEmployerContent, extractEmployerPassages, groundEmployerClaims } from "../lib/employer-profile-content";
import { robotsAllows, type EmployerSource } from "../lib/employer-research-sources";

const sources: EmployerSource[] = [
  {
    kind: "about",
    title: "About",
    url: "https://trust.example/about",
    text: "We are a conservation charity restoring habitats for native wildlife in our county.",
  },
  {
    kind: "work",
    title: "Our work",
    url: "https://trust.example/projects",
    text: "The meadow recovery project restores species-rich grassland on three sites.",
  },
  {
    kind: "careers",
    title: "Careers",
    url: "https://trust.example/careers",
    text: "Flexible hours may be available, depending on the requirements of the job.",
  },
];
const draft = {
  claims: [
    {
      kind: "overview" as const,
      text: "The charity restores local habitats for native wildlife.",
      passage: 1,
    },
    {
      kind: "work" as const,
      text: "Its meadow project restores wildlife-rich grassland across three sites.",
      passage: 2,
    },
    {
      kind: "careers" as const,
      text: "Depending on the role, flexible hours may be available.",
      passage: 3,
    },
  ],
};

describe("employer evidence gate", () => {
  it("publishes only separately supported claims with official citations", () => {
    const grounded = groundEmployerClaims(draft, extractEmployerPassages(sources));
    const profile = eligibleEmployerContent(grounded, [1, 2]);
    expect(profile?.claims.map((claim) => claim.sourceUrl)).toEqual(
      sources.slice(0, 2).map(({ url }) => url),
    );
    expect(profile?.claims.every((claim) => !("excerpt" in claim))).toBe(true);
  });

  it("rejects missing passage ids and careers claims sourced from marketing material", () => {
    const [overview, work, careers] = draft.claims;
    const grounded = groundEmployerClaims(
      {
        claims: [
          overview,
          { ...work, passage: 4 },
          { ...careers, passage: 1 },
        ],
      },
      extractEmployerPassages(sources),
    );
    expect(grounded).toHaveLength(1);
    expect(eligibleEmployerContent(grounded, [1, 2, 3])).toBeNull();
  });

  it("requires two different official pages for the overview and work", () => {
    const [overview, work, careers] = draft.claims;
    const passages = extractEmployerPassages([
      { ...sources[0], text: sources[0].text + " " + sources[1].text },
      ...sources.slice(1),
    ]);
    const grounded = groundEmployerClaims({ claims: [overview, { ...work, passage: 1 }, careers] }, passages);
    expect(grounded).toHaveLength(3);
    expect(eligibleEmployerContent(grounded, [1, 2, 3])).toBeNull();
  });

  it("keeps original source text in bounded passages, including long passages without punctuation", () => {
    const page = { ...sources[1], text: `${"Project navigation ".repeat(65)}  ${sources[1].text}` };
    const passages = extractEmployerPassages([page]);
    expect(passages.length).toBeGreaterThan(1);
    for (const { excerpt } of passages) {
      expect(excerpt.length).toBeLessThanOrEqual(540);
      expect(page.text.replace(/\s+/g, " ")).toContain(excerpt);
    }
    expect(passages.at(-1)?.excerpt).toContain(sources[1].text);
  });
});

describe("employer research crawl restrictions", () => {
  it("uses the bot-specific group and the most specific matching rule", () => {
    const rules =
      "User-agent: *\nDisallow: /\nUser-agent: WildJobs\nDisallow: /careers/*\nAllow: /careers/about$";
    expect(robotsAllows(rules, new URL("https://trust.example/projects"))).toBe(true);
    expect(robotsAllows(rules, new URL("https://trust.example/careers/about"))).toBe(true);
    expect(robotsAllows(rules, new URL("https://trust.example/careers/about?all"))).toBe(false);
  });
});
