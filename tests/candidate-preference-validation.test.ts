import { describe, expect, it } from "vitest";

import { validateCandidatePreferences } from "../lib/candidate-preference-validation";

function preferenceForm(values: Record<string, string | readonly string[]> = {}) {
  const formData = new FormData();
  Object.entries(values).forEach(([name, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(name, item));
    } else {
      formData.set(name, value as string);
    }
  });
  return formData;
}

describe("candidate preference validation", () => {
  it("normalises inspectable preference choices", () => {
    expect(
      validateCandidatePreferences(
        preferenceForm({
          careerAreaIds: ["3", "4", "3"],
          contractTypes: ["fixed_term"],
          experienceLevel: "developing",
          hoursTypes: ["full_time", "part_time"],
          preferredLocation: "  Bristol  ",
          workplaceTypes: ["remote", "hybrid"],
        }),
      ),
    ).toEqual({
      data: {
        careerAreaIds: [3, 4],
        contractTypes: ["fixed_term"],
        experienceLevel: "developing",
        hoursTypes: ["full_time", "part_time"],
        preferredLocation: "Bristol",
        workplaceTypes: ["remote", "hybrid"],
      },
    });
  });

  it("rejects values outside the approved preference vocabulary", () => {
    expect(
      validateCandidatePreferences(preferenceForm({ experienceLevel: "open", workplaceTypes: ["anywhere"] })),
    ).toEqual({ error: "Choose only the available working arrangements." });
  });

  it("turns the clear action into an empty preference set", () => {
    expect(validateCandidatePreferences(preferenceForm({ intent: "clear" }))).toEqual({
      data: {
        careerAreaIds: [],
        contractTypes: [],
        experienceLevel: "open",
        hoursTypes: [],
        preferredLocation: null,
        workplaceTypes: [],
      },
    });
  });
});
