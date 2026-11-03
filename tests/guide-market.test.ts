import { describe, expect, it } from "vitest";
import { buildGuideMarket, guideWindowStart, type GuideJob } from "../lib/guide-market";
import { matchCareerRole, normalizeRoleTitle } from "../lib/career-role-matching";
import { pilotGuides, validateGuideContent } from "../lib/guide-content";
const now = new Date("2026-11-03T12:00:00Z");
const scope = { kind: "career", matchSlug: "ecologist" } as const;
function job(id: number, overrides: Partial<GuideJob> = {}): GuideJob {
  return {
    id,
    title: "Assistant Ecologist",
    organisation_name: `Employer ${id % 2}`,
    source_url: `https://example.test/jobs/${id}`,
    source_name: "Test board",
    sector_slugs: ["conservation-wildlife"],
    feed_text:
      "Full time. Survey habitats and species, analyse the findings, prepare ecological reports, and explain the evidence to colleagues. Work under supervision on ecological assessments. Maintain clear records of methods and limitations.",
    salary_text: "£30,000 – £35,000 per year",
    country_code: "GB",
    hours_type: "Full time",
    engagement_type: "Paid",
    posted_at: "2026-10-01T12:00:00Z",
    first_seen_at: "2026-11-01T14:00:00Z",
    closes_at: "2026-12-01T12:00:00Z",
    is_active: true,
    merged_into: null,
    ...overrides,
  };
}
describe("canonical ecologist matching", () => {
  it.each(["Ecologist", "Senior Ecologist", "Ecologists - All Grades", "Wetland Restoration Ecologist"])(
    "matches the occupation in %s",
    (title) => expect(matchCareerRole(title).roleSlug).toBe("ecologist"),
  );
  it("accepts a consultant variant only with ecology duties", () => {
    expect(
      matchCareerRole("Ecological Consultant", "Survey habitats and prepare ecological reports.").roleSlug,
    ).toBe("ecologist");
    expect(matchCareerRole("Ecological Consultant").status).toBe("review");
    expect(matchCareerRole("Ecological Consultants", "Survey habitats and species.").roleSlug).toBe(
      "ecologist",
    );
  });
  it.each([
    "Environment and Design Manager (Ecology)",
    "Agroecology Programme Coordinator",
    "Ecology Project Officer",
  ])("does not turn a departmental reference into a role: %s", (title) =>
    expect(matchCareerRole(title).roleSlug).toBeNull(),
  );
  it("flags misspellings and multi-occupation adverts, then reuses reviewed mappings", () => {
    expect(matchCareerRole("Senior Ecologst").status).toBe("review");
    expect(matchCareerRole("Ecologist / Ranger").status).toBe("review");
    expect(matchCareerRole("Project Manager / Ecologist").status).toBe("review");
    expect(matchCareerRole("Assistant to the Chief Ecologist").status).toBe("review");
    expect(
      matchCareerRole("Senior Ecologst", "", [
        { normalized_title: normalizeRoleTitle("Senior Ecologst"), role_slug: "ecologist" },
      ]).roleSlug,
    ).toBe("ecologist");
    expect(
      matchCareerRole("Ecologist", "", [{ normalized_title: "ecologist", role_slug: null }]).roleSlug,
    ).toBeNull();
  });
  it("keeps early, senior and mixed grades distinct", () => {
    expect(matchCareerRole("Assistant Ecologist").seniority).toBe("early-career");
    expect(matchCareerRole("Principal Ecologist").seniority).toBe("senior");
    expect(matchCareerRole("Ecologist / Senior Ecologist").seniority).toBe("mixed");
    expect(
      matchCareerRole("Ecological Consultant / Senior Ecological Consultant", "Survey habitats.").seniority,
    ).toBe("mixed");
  });
});
describe("guide evidence and salary samples", () => {
  it("counts canonical vacancies once and keeps expired jobs in history", () => {
    const expired = job(2, { is_active: false });
    const market = buildGuideMarket(
      [
        job(1),
        job(1),
        expired,
        job(3, { merged_into: 1 }),
        job(4, { posted_at: "2025-10-01T12:00:00Z" }),
        job(5, { posted_at: "2026-12-01T12:00:00Z" }),
      ],
      scope,
      [],
      now,
    );
    expect(market.history.map((j) => j.id)).toEqual([1, 2]);
    expect(market.current.map((j) => j.id)).toEqual([1, 4]);
    expect(market.observedFrom).toBe("2026-11-01T14:00:00Z");
  });
  it("requires ten detailed distinct vacancies and at least two named employers", () => {
    const sample = Array.from({ length: 10 }, (_, i) => job(i));
    expect(buildGuideMarket(sample, scope, [], now).draftEligible).toBe(true);
    expect(buildGuideMarket(sample.slice(1), scope, [], now).draftEligible).toBe(false);
    expect(
      buildGuideMarket(
        sample.map((j) => ({ ...j, organisation_name: "One employer" })),
        scope,
        [],
        now,
      ).draftEligible,
    ).toBe(false);
    expect(
      buildGuideMarket(
        sample.map((j) => ({ ...j, feed_text: "Too little information" })),
        scope,
        [],
        now,
      ).draftEligible,
    ).toBe(false);
  });
  it("excludes non-comparable pay and does not treat defaults as full-time evidence", () => {
    const valid = Array.from({ length: 5 }, (_, i) =>
      job(i, { salary_text: `£${30000 + i * 1000} per year` }),
    );
    const excluded = [
      job(10, { salary_text: "£80,000 per year (pro rata)" }),
      job(11, { salary_text: "£25 per hour" }),
      job(12, { salary_text: "USD 80,000 per year" }),
      job(13, { country_code: "US" }),
      job(14, { engagement_type: "Volunteer" }),
      job(15, { feed_text: "Survey habitats, working hours not stated." }),
      job(16, { title: "Ecologist / Senior Ecologist" }),
      job(17, { salary_text: "£100,000" }),
      job(18, { hours_type: "Part time" }),
    ];
    const market = buildGuideMarket([...valid, ...excluded], scope, [], now);
    expect(market.salaryCount).toBe(5);
    expect(market.salaryMedian).toBe(32000);
    expect(market.salaryGroups).toEqual([{ level: "early-career", count: 5, median: 32000 }]);
    expect(buildGuideMarket(valid.slice(1), scope, [], now).salaryMedian).toBeNull();
  });
  it("uses exact sector membership, not a matching word in the title", () => {
    expect(
      buildGuideMarket(
        [job(1), job(2, { sector_slugs: ["ecology"] })],
        { kind: "sector", matchSlug: "conservation-wildlife" },
        [],
        now,
      ).history,
    ).toHaveLength(1);
  });
  it("excludes mixed grades from the broad sector salary too", () => {
    const sample = Array.from({ length: 5 }, (_, i) => job(i));
    const market = buildGuideMarket(
      [...sample, job(10, { title: "Ecologist / Senior Ecologist", salary_text: "£100,000 per year" })],
      { kind: "sector", matchSlug: "conservation-wildlife" },
      [],
      now,
    );
    expect(market.salaryCount).toBe(5);
    expect(market.salaryMedian).toBe(30000);
  });
  it("accepts retained original full-time evidence only for the current advert hash", () => {
    const sample = Array.from({ length: 5 }, (_, i) =>
      job(i, {
        feed_text: "Survey habitats. Hours not stated in the feed.",
        feed_hash: "new",
        salary_full_time_evidence: true,
        salary_evidence_hash: "new",
      }),
    );
    expect(buildGuideMarket(sample, scope, [], now).salaryCount).toBe(5);
    expect(
      buildGuideMarket(
        sample.map((j) => ({ ...j, salary_evidence_hash: "old" })),
        scope,
        [],
        now,
      ).salaryCount,
    ).toBe(0);
  });
  it("clamps leap-day lookbacks", () =>
    expect(guideWindowStart(new Date("2024-02-29T12:00:00Z"))).toBe("2023-02-28T12:00:00.000Z"));
});
it("both pilot contents have resolvable citations and unique sections", () => {
  for (const guide of pilotGuides) expect(validateGuideContent(guide).slug).toBe(guide.slug);
  expect(() =>
    validateGuideContent({
      ...pilotGuides[0],
      sections: [{ ...pilotGuides[0].sections[0], paragraphs: [{ text: "Claim", sources: ["missing"] }] }],
    }),
  ).toThrow("citations");
});
