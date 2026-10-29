import { describe, expect, it } from "vitest";

import { validateEmployerProfile } from "../lib/admin/employer-profile-validation";

function employerForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    mission: "Protect wildlife and help communities restore resilient habitats together.",
    overview:
      "Example Wildlife Trust is a conservation charity working across its county with communities and partners.",
    websiteUrl: "https://example.org",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("employer profile validation", () => {
  it("normalises a complete employer profile", () => {
    expect(validateEmployerProfile(employerForm()).data).toEqual({
      mission: "Protect wildlife and help communities restore resilient habitats together.",
      overview:
        "Example Wildlife Trust is a conservation charity working across its county with communities and partners.",
      websiteUrl: "https://example.org",
    });
  });

  it("requires a secure employer website", () => {
    expect(validateEmployerProfile(employerForm({ websiteUrl: "http://example.org" }))).toEqual({
      error: "Enter the employer’s HTTPS website.",
    });
  });

  it("rejects placeholder employer copy", () => {
    expect(validateEmployerProfile(employerForm({ overview: "A charity." }))).toEqual({
      error: "Add an employer overview between 40 and 1,200 characters.",
    });
  });
});
