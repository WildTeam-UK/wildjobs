import { describe, expect, it } from "vitest";

import { extractVacancyDetails, extractVacancyFieldEvidence } from "../lib/admin/vacancy-detail-extraction";

describe("vacancy detail extraction", () => {
  it("extracts the labelled details from the live Staffordshire format", () => {
    expect(
      extractVacancyDetails(
        "Salary: £26,250 Contract Type: Permanent At The Wolseley Centre. We are looking for an experienced and motivated conservation professional.",
      ),
    ).toEqual({
      contractType: "permanent",
      engagementType: "paid",
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
      engagementType: "paid",
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
      engagementType: "paid",
      experienceLevel: undefined,
      hoursType: "flexible",
      salaryText: "Project Officer: from £28,383 / Senior Project Officer: from £34,367",
      workplaceType: undefined,
    });
  });

  it("keeps uncertain details empty rather than inferring them", () => {
    expect(extractVacancyDetails("Help restore habitats with local partners.")).toEqual({
      contractType: undefined,
      engagementType: undefined,
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

  it("reads a salary label joined to a source reference", () => {
    expect(
      extractVacancyDetails(
        "Reference: REQ1254Salary: £36987 - £39459 per annum + 28.97% employer pension contributionsType: Permanent",
      ).salaryText,
    ).toBe("£36987 - £39459 per annum + 28.97% employer pension contributions");
  });

  it("does not mistake remote terrain for a remote working arrangement", () => {
    expect(
      extractVacancyDetails(
        "Manage construction projects in challenging environments, including remote, steep or environmentally sensitive areas.",
      ).workplaceType,
    ).toBeUndefined();
  });

  it.each([
    [
      "£30,977.00 - £33,073.00 Per Annum The project protects globally important wildlife.",
      "£30,977.00 - £33,073.00 Per Annum",
    ],
    [
      "Salary: £36,987 - £39,459 per annum + 28.97% employer pension contributions Description: Manage forest infrastructure.",
      "£36,987 - £39,459 per annum + 28.97% employer pension contributions",
    ],
    [
      "Salary: £40,000 - £50,000 dependent on experience Help restore peatlands with regional partners.",
      "£40,000 - £50,000 dependent on experience",
    ],
    [
      "Salary: Up to £33,000 pro rata depending on skills and experience Fixed Term Contract Until 31 March 2030",
      "Up to £33,000 pro rata depending on skills and experience",
    ],
    ["Salary: £27,952.67 Working Hours: 37", "£27,952.67"],
  ])("stops salary evidence before following vacancy copy", (source, expected) => {
    expect(extractVacancyDetails(source).salaryText).toBe(expected);
  });

  it("records evidence and confidence without inventing missing facts", () => {
    const evidence = extractVacancyFieldEvidence(
      "Salary: £26,250 Contract Type: Permanent. We need an experienced conservation professional.",
    );

    expect(evidence.find((item) => item.fieldName === "salary_text")).toMatchObject({
      confidence: 95,
      evidenceText: "£26,250",
      resolutionStatus: "extracted",
      value: "£26,250",
    });
    expect(evidence.find((item) => item.fieldName === "workplace_type")).toMatchObject({
      confidence: 0,
      evidenceText: null,
      resolutionStatus: "unresolved",
      value: null,
    });
  });
});
