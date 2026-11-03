// Occupation families are deliberately reviewed, rather than generated from
// arbitrary title words such as "officer" or "manager".
export const careerRoleSlugs = [
  "ecologist",
  "project-manager",
  "project-officer",
  "environmental-educator",
  "biologist",
  "chief-executive",
] as const;
export type CareerRoleSlug = (typeof careerRoleSlugs)[number];
export const careerRoleLabels: Record<CareerRoleSlug, string> = {
  ecologist: "Ecologist",
  "project-manager": "Project Manager",
  "project-officer": "Project Officer",
  "environmental-educator": "Environmental Educator",
  biologist: "Biologist",
  "chief-executive": "Chief Executive",
};
export function isCareerRoleSlug(value: string): value is CareerRoleSlug {
  return careerRoleSlugs.some((slug) => slug === value);
}
