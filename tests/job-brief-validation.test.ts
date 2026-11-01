import { describe, expect, it } from "vitest";
import {
  briefOutputSchema,
  copiedWordFraction,
  evidencePresent,
  normalizeVacancyUrl,
  validateJobBrief,
} from "../lib/admin/job-brief-validation";

const source =
  "Habitat Officer. Our nature charity restores wetlands with local communities. You will plan habitat restoration projects and coordinate volunteers. Essential: experience of ecological surveys and partnership working. Salary: £30,000 per year. Based in Bristol, United Kingdom. Hybrid working is available.";
const catalogues = {
  occupations: [{ id: 1, title: "Conservation officer" }],
  careerAreas: [{ id: 2, title: "Habitat restoration" }],
  capabilities: [],
  benefits: [],
};
function brief() {
  return briefOutputSchema.parse({
    relevance: "relevant",
    summary: {
      text: "Support wetland recovery through a community-facing conservation post.",
      evidence: "Our nature charity restores wetlands with local communities.",
    },
    overview: {
      text: "The officer brings together practical project planning and volunteer coordination.",
      evidence: "You will plan habitat restoration projects and coordinate volunteers.",
    },
    conservationContext: {
      text: "This post supports wetland recovery alongside local residents.",
      evidence: "Our nature charity restores wetlands with local communities.",
    },
    responsibilities: [
      { text: "Plan work that restores habitats.", evidence: "plan habitat restoration projects" },
      { text: "Coordinate the volunteers involved in delivery.", evidence: "coordinate volunteers" },
    ],
    essential: [
      {
        text: "Bring experience of ecological surveying and working with partners.",
        evidence: "experience of ecological surveys and partnership working",
      },
    ],
    desirable: [],
    practical: [],
    applicationChecklist: [],
    fields: {
      engagement_type: { value: "paid", evidence: "Salary: £30,000 per year." },
      workplace_type: { value: "hybrid", evidence: "Hybrid working is available." },
      country_code: { value: "GB", evidence: "United Kingdom" },
      location_text: { value: "Bristol, United Kingdom", evidence: "Bristol, United Kingdom" },
      salary_text: { value: "£30,000 per year", evidence: "Salary: £30,000 per year." },
      hours_type: { value: null, evidence: null },
      contract_type: { value: null, evidence: null },
      experience_level: { value: null, evidence: null },
    },
    occupations: [{ termId: 1, evidence: "Habitat Officer" }],
    careerAreas: [{ termId: 2, evidence: "habitat restoration projects" }],
    capabilities: [],
    benefits: [],
  });
}
describe("original job brief quality gates", () => {
  it("accepts an original evidenced brief without inventing unstated optional facts", () =>
    expect(validateJobBrief(brief(), source, catalogues)).toEqual([]));
  it("rejects a quote that is not in the advert", () => {
    const b = brief();
    b.essential[0].evidence = "A postgraduate degree is essential";
    expect(validateJobBrief(b, source, catalogues)).toContain("unsupported_claim");
  });
  it("rejects changed salary numbers in an otherwise real quote", () => {
    const b = brief();
    b.summary = { text: "Salary for this post is £35,000 annually.", evidence: "Salary: £30,000 per year." };
    expect(validateJobBrief(b, source, catalogues)).toContain("unsupported_number");
  });
  it("rejects altered salary facts and a changed location despite a real quote", () => {
    const b = brief();
    b.fields.salary_text.value = "£35,000 per year";
    b.fields.location_text.value = "London";
    expect(validateJobBrief(b, source, catalogues)).toEqual(
      expect.arrayContaining(["changed_salary_text", "changed_location_text"]),
    );
  });
  it("rejects invented taxonomy IDs and uncertain conservation relevance", () => {
    const b = brief();
    b.careerAreas[0].termId = 999;
    b.relevance = "uncertain";
    expect(validateJobBrief(b, source, catalogues)).toEqual(
      expect.arrayContaining(["invalid_careerAreas", "conservation_relevance_uncertain"]),
    );
  });
  it("detects long copied passages while allowing names and short technical terms", () => {
    expect(copiedWordFraction(source, source)).toBe(1);
    expect(copiedWordFraction("Ecological surveys in Bristol", source)).toBe(0);
  });
  it("normalizes typography without accepting invented evidence", () => {
    expect(evidencePresent("Our nature charity", "Our  nature charity")).toBe(true);
    expect(evidencePresent("Our marine charity", source)).toBe(false);
    expect(evidencePresent("“Our nature charity”", source)).toBe(true);
    expect(evidencePresent('"Our nature charity"', source)).toBe(true);
    expect(evidencePresent("“Our marine charity”", source)).toBe(false);
  });
  it("normalizes tracking parameters without dropping vacancy identifiers", () =>
    expect(normalizeVacancyUrl("https://example.org/job?id=12&utm_source=rss#apply")).toBe(
      "https://example.org/job?id=12",
    ));
});
