import { describe, expect, it } from "vitest";

import { extractVacancyDetails } from "../lib/admin/vacancy-detail-extraction";

describe("vacancy detail extraction", () => {
  it("extracts the labelled details from the live Staffordshire format", () => {
    expect(
      extractVacancyDetails(
        "Salary: £26,250 Contract Type: Permanent At The Wolseley Centre. We are looking for an experienced and motivated conservation professional.",
      ),
    ).toEqual({
      contractType: "permanent",
      experienceLevel: "experienced",
      hoursType: undefined,
      salaryText: "£26,250",
      workplaceType: undefined,
    });
  });

  it("extracts fixed-term, part-time and hybrid details without swallowing the location", () => {
    expect(
      extractVacancyDetails(
        "Part Time – 24 Hours per Week / Fixed Term Contract Until 31 March 2030 Salary: Up to £33,000 pro rata gross per annum (up to £22,628 actual salary for 0.68 FTE) depending on skills and experience Location: Hook (with hybrid working available)",
      ),
    ).toEqual({
      contractType: "fixed_term",
      experienceLevel: undefined,
      hoursType: "part_time",
      salaryText:
        "Up to £33,000 pro rata gross per annum (up to £22,628 actual salary for 0.68 FTE) depending on skills and experience",
      workplaceType: "hybrid",
    });
  });

  it("uses flexible when both full-time and part-time arrangements are offered", () => {
    expect(
      extractVacancyDetails(
        "Contract: Permanent / Hours: Full time but will consider part time and flexible working Salary details: Project Officer: from £28,383 / Senior Project Officer: from £34,367 Do you want to make a difference?",
      ),
    ).toEqual({
      contractType: "permanent",
      experienceLevel: undefined,
      hoursType: "flexible",
      salaryText: "Project Officer: from £28,383 / Senior Project Officer: from £34,367",
      workplaceType: undefined,
    });
  });

  it("keeps uncertain details empty rather than inferring them", () => {
    expect(extractVacancyDetails("Help restore habitats with local partners.")).toEqual({
      contractType: undefined,
      experienceLevel: undefined,
      hoursType: undefined,
      salaryText: undefined,
      workplaceType: undefined,
    });
  });

  it("captures an unlabelled salary at the start of a feed description", () => {
    expect(
      extractVacancyDetails(
        "£28,000 to £30,000 pa, dependent on experience Hybrid working with office bases in Pirbright and Nower Wood.",
      ).salaryText,
    ).toBe("£28,000 to £30,000 pa, dependent on experience");
  });
});
