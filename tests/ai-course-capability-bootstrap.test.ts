import { describe, expect, it } from "vitest";

import {
  capabilitySlug,
  normaliseCapabilityName,
  validateGeneratedCourseCapabilities,
} from "../lib/admin/course-capability-validation";

const course = {
  id: 7,
  public_url: "https://training.example/course/project-planning",
  summary: "Build a conservation strategy and assess progress towards measurable impact.",
  title: "Project Planning",
};

const generated = {
  aliases: ["Conservation planning"],
  confidence: 91,
  course_id: 7,
  coverage_score: 88,
  description: "Plan conservation projects around a coherent strategy and intended impact.",
  evidence: "Build a conservation strategy",
  existing_capability_id: null,
  is_primary: true,
  outcome: "Learner can build a conservation strategy around intended impact.",
  rationale: "The catalogue explicitly says learners build a conservation strategy.",
  title: "Conservation project planning",
};

describe("course capability generation safeguards", () => {
  it("normalises reusable capability names and stable slugs", () => {
    expect(normaliseCapabilityName("  Monitoring & Évaluation  ")).toBe("monitoring evaluation");
    expect(capabilitySlug("Monitoring & Évaluation")).toBe("monitoring-evaluation");
  });

  it("keeps strong capabilities with exact catalogue evidence", () => {
    expect(validateGeneratedCourseCapabilities([generated], [course], [])).toEqual([generated]);
  });

  it("rejects invented evidence, weak scores and unknown existing IDs", () => {
    expect(
      validateGeneratedCourseCapabilities(
        [
          { ...generated, evidence: "Not in the course" },
          { ...generated, confidence: 60 },
          { ...generated, existing_capability_id: 999 },
        ],
        [course],
        [],
      ),
    ).toEqual([]);
  });

  it("limits each course to four generated capabilities", () => {
    const items = Array.from({ length: 6 }, (_, index) => ({
      ...generated,
      title: `${generated.title} ${index}`,
    }));
    expect(validateGeneratedCourseCapabilities(items, [course], [])).toHaveLength(4);
  });
});
