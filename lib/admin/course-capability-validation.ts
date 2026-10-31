export type CourseCapabilityCandidate = {
  aliases: string[];
  confidence: number;
  course_id: number;
  coverage_score: number;
  description: string;
  evidence: string;
  existing_capability_id: number | null;
  is_primary: boolean;
  outcome: string;
  rationale: string;
  title: string;
};

type CourseInput = { id: number; public_url: string; summary: string; title: string };
type ExistingCapability = { id: number };

export function normaliseCapabilityName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-GB")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function capabilitySlug(value: string) {
  return normaliseCapabilityName(value).replaceAll(" ", "-").slice(0, 100) || "capability";
}

export function validateGeneratedCourseCapabilities<T extends CourseCapabilityCandidate>(
  generated: readonly T[],
  courses: readonly CourseInput[],
  existingCapabilities: readonly ExistingCapability[],
) {
  const coursesById = new Map(courses.map((course) => [course.id, course]));
  const existingIds = new Set(existingCapabilities.map((capability) => capability.id));
  const counts = new Map<number, number>();

  return generated.filter((item) => {
    const course = coursesById.get(item.course_id);
    const count = (counts.get(item.course_id) ?? 0) + 1;
    counts.set(item.course_id, count);
    return Boolean(
      course &&
      count <= 4 &&
      course.summary.includes(item.evidence) &&
      item.confidence >= 75 &&
      item.coverage_score >= 50 &&
      (item.existing_capability_id === null || existingIds.has(item.existing_capability_id)),
    );
  });
}
