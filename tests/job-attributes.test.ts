import { expect, it } from "vitest";
import { groundedJobAttributes, jobSkills, jobBenefits } from "../lib/job-attributes";

it("groups equivalent skill and benefit wording into short controlled labels", () => {
  const advert =
    "Use QGIS to map habitats. Prepare funding bids for restoration. We offer flexitime and a pension scheme.";
  const result = groundedJobAttributes(
    [
      { slug: "gis", evidence: "Use QGIS to map habitats" },
      { slug: "grant-writing", evidence: "Prepare funding bids for restoration" },
      { slug: "gis", evidence: "QGIS to map habitats" },
    ],
    [
      { slug: "flexible-working", evidence: "We offer flexitime" },
      { slug: "pension", evidence: "a pension scheme" },
    ],
    advert,
  );
  expect(result.skill_slugs).toEqual(["gis", "grant-writing"]);
  expect(result.benefit_slugs).toEqual(["flexible-working", "pension"]);
  expect(result.attribute_evidence.skills.gis).toBe("QGIS to map habitats");
  expect(jobSkills.every(({ title }) => title.length < 32 && !title.endsWith("."))).toBe(true);
  expect(jobBenefits).toHaveLength(15);
});
it("rejects invented labels, unsupported or negative evidence and incidental mismatches", () => {
  const advert = "No visa sponsorship is available. Maintain equipment and records. We offer annual leave.";
  const result = groundedJobAttributes(
    [
      { slug: "made-up", evidence: "Maintain equipment" },
      { slug: "gis", evidence: "Maintain equipment and records" },
    ],
    [
      { slug: "visa-support", evidence: "No visa sponsorship is available" },
      { slug: "health-cover", evidence: "private healthcare" },
      { slug: "paid-leave", evidence: "We offer annual leave" },
    ],
    advert,
  );
  expect(result.skill_slugs).toEqual([]);
  expect(result.benefit_slugs).toEqual(["paid-leave"]);
});
it("safely handles a partial legacy result without guessing attributes", () => {
  expect(groundedJobAttributes(undefined, null, "Project management")).toMatchObject({
    skill_slugs: [],
    benefit_slugs: [],
  });
});

it("rejects a cropped quote which hides an exclusion in its source sentence", () => {
  expect(
    groundedJobAttributes(
      [],
      [{ slug: "visa-support", evidence: "visa sponsorship" }],
      "No visa sponsorship is available.",
    ).benefit_slugs,
  ).toEqual([]);
  expect(
    groundedJobAttributes(
      [],
      [{ slug: "health-cover", evidence: "private healthcare" }],
      "Private healthcare is not offered.",
    ).benefit_slugs,
  ).toEqual([]);
});
