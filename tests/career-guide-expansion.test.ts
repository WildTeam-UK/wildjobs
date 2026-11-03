import { expect, it } from "vitest";
import { matchCareerRole, normalizeRoleTitle } from "../lib/career-role-matching";
import { additionalCareerGuides } from "../lib/career-guide-content";
import { guideJobsPath, validateGuideContent } from "../lib/guide-content";

it.each([
  ["Senior Conservation Project Manager", "project-manager"],
  ["Project Officer / Senior Project Officer", "project-officer"],
  ["Environmental Science Educator", "environmental-educator"],
  ["Education and Community Engagement Officer", "environmental-educator"],
  ["Education & Engagement Officer", "environmental-educator"],
  ["Outdoor Education/Field Study Instructor/Naturalist", "environmental-educator"],
  ["Fish & Wildlife Biologist", "biologist"],
  ["Natural Resources Specialist (WMA Biologist)", "biologist"],
  ["Executive Director", "chief-executive"],
  ["Chief Executive Officer", "chief-executive"],
  ["CEO", "chief-executive"],
])("maps explicit occupation variants: %s", (title, slug) =>
  expect(matchCareerRole(title).roleSlug).toBe(slug),
);

it.each([
  "Modeshift STARS Programme Manager (Education)",
  "Monitoring, Evaluation and Learning Officer",
  "Director of Education",
  "Corporate Engagement Director",
  "Educational Farm Manager",
  "Naturalist",
])("does not turn a related title into an occupation match: %s", (title) =>
  expect(matchCareerRole(title).roleSlug).toBeNull(),
);

it.each([
  "Project Manger",
  "Senior Biologst",
  "Environmental Edcuator",
  "Cheif Executive",
  "Project Manager / Ecologist",
  "Field Supervisor/Project Manager",
  "Associate or Senior Biologist/Regulatory Specialist",
  "Executive Assistant to the CEO",
  "Non-Executive Director",
  "Executive Director of Communications",
  "Personal Assistant Chief Executive",
  "Biologist Support Technician",
  "Community Garden Project Lead",
])("holds ambiguous or misspelt titles for review: %s", (title) =>
  expect(matchCareerRole(title).status).toBe("review"),
);
it("reuses a reviewed spelling correction only for the exact normalized title", () => {
  const aliases = [{ normalized_title: normalizeRoleTitle("Project Manger"), role_slug: "project-manager" }];
  expect(matchCareerRole("PROJECT MANGER", "", aliases).roleSlug).toBe("project-manager");
  expect(matchCareerRole("Project Officer", "", aliases).roleSlug).toBe("project-officer");
  expect(matchCareerRole("Ecologist", "", aliases).roleSlug).toBe("ecologist");
});
it("keeps multi-grade biologist and officer salaries out of level comparisons", () => {
  expect(matchCareerRole("Wildlife Biologist I, II, or III").seniority).toBe("mixed");
  expect(matchCareerRole("Project Officer / Senior Project Officer").seniority).toBe("mixed");
});
it.each(additionalCareerGuides)("gives $slug researched content and its own exact job filter", (guide) => {
  expect(validateGuideContent(guide)).toEqual(guide);
  expect(new URL(guideJobsPath(guide), "https://example.test").searchParams.get("role")).toBe(guide.slug);
  expect(guide.sources.every((source) => source.checkedAt === "2026-11-03")).toBe(true);
  expect(guide.sources.length).toBeGreaterThanOrEqual(2);
});
