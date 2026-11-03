import type { CareerRoleSlug } from "./career-role-catalog";
// Public guide URLs and directory taxonomy are deliberately separate.
export const sectorGuideSlugs = [
  "carbon-climate-energy",
  "wildlife-conservation",
  "ecology",
  "environmental-education",
  "environmental-management",
  "food-farming-horticulture",
  "marine-conservation",
  "policy-campaigning",
  "rivers-water-hydrology",
  "sustainability",
  "sustainable-transport",
] as const;
export type SectorGuideSlug = (typeof sectorGuideSlugs)[number];
export const guideSectorLabels: Record<SectorGuideSlug, string> = {
  "wildlife-conservation": "Wildlife Conservation",
  "carbon-climate-energy": "Carbon, Climate & Energy",
  ecology: "Ecology",
  "environmental-education": "Environmental Education",
  "environmental-management": "Environmental Management",
  "food-farming-horticulture": "Food, Farming & Horticulture",
  "marine-conservation": "Marine Conservation",
  "policy-campaigning": "Policy & Campaigning",
  "rivers-water-hydrology": "Rivers, Water & Hydrology",
  sustainability: "Sustainability",
  "sustainable-transport": "Sustainable Transport",
};
export function guideSectorMatchSlug(slug: SectorGuideSlug) {
  return slug === "wildlife-conservation" ? "conservation-wildlife" : slug;
}
export const relatedGuideSlugs: Record<
  SectorGuideSlug | CareerRoleSlug,
  readonly (SectorGuideSlug | CareerRoleSlug)[]
> = {
  "wildlife-conservation": ["ecologist", "ecology"],
  "carbon-climate-energy": ["sustainability", "sustainable-transport"],
  ecology: ["ecologist", "wildlife-conservation"],
  "environmental-education": ["wildlife-conservation", "policy-campaigning"],
  "environmental-management": ["sustainability", "ecology"],
  "food-farming-horticulture": ["wildlife-conservation", "ecology"],
  "marine-conservation": ["rivers-water-hydrology", "wildlife-conservation"],
  "policy-campaigning": ["sustainability", "environmental-management"],
  "rivers-water-hydrology": ["ecology", "marine-conservation"],
  sustainability: ["environmental-management", "carbon-climate-energy"],
  "sustainable-transport": ["carbon-climate-energy", "policy-campaigning"],
  ecologist: ["ecology", "wildlife-conservation"],
  "project-manager": ["project-officer", "wildlife-conservation"],
  "project-officer": ["project-manager", "environmental-management"],
  "environmental-educator": ["environmental-education", "wildlife-conservation"],
  biologist: ["ecologist", "marine-conservation"],
  "chief-executive": ["policy-campaigning", "project-manager"],
};
