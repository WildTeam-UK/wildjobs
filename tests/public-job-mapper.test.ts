import { describe, expect, it } from "vitest";
import { mapPublicJob, type PublicJobRecord } from "../lib/public-job-mapper";

const record: PublicJobRecord = {
  application_url: "https://example.org/jobs/wetland-researcher",
  closes_at: "2026-11-01",
  contract_type: "fixed_term",
  country_code: "GB",
  created_at: "2026-10-27T12:00:00Z",
  description: "First paragraph.\r\n\r\nSecond paragraph.",
  employers: {
    name: "Wetland Trust",
    short_name: "WT",
    slug: "wetland-trust",
    website_url: "https://example.org",
  },
  hours_type: "full_time",
  job_career_areas: [
    { career_areas: { slug: "fieldwork", title: "Fieldwork" }, is_primary: false },
    {
      career_areas: { slug: "science-and-research", title: "Science and research" },
      is_primary: true,
    },
  ],
  location_text: "Gloucestershire, United Kingdom",
  posted_at: null,
  published_at: "2026-10-28T16:14:13Z",
  region: null,
  requirements: "- Ecology background\r\n• Valid driving licence",
  responsibilities: "Run field surveys\r\nManage monitoring data",
  salary_text: "£25,985 per annum",
  slug: "wetland-researcher",
  summary: "Support an ecological monitoring programme.",
  title: "Wetland Researcher",
  workplace_type: "on_site",
};

describe("public job mapping", () => {
  it("maps database labels, paragraphs and the primary career area", () => {
    const job = mapPublicJob(record);

    expect(job).toMatchObject({
      category: "Science and research",
      contractType: "Fixed term",
      employmentType: "Full time",
      hoursType: "Full time",
      locationType: "On-site",
      organisation: "WT",
      postedAt: "2026-10-28",
    });
    expect(job.description).toEqual(["First paragraph.", "Second paragraph."]);
    expect(job.requirements).toEqual(["Ecology background", "Valid driving licence"]);
  });

  it("uses clear fallbacks when optional publishing fields are empty", () => {
    const job = mapPublicJob({
      ...record,
      contract_type: null,
      description: null,
      employers: null,
      hours_type: null,
      job_career_areas: [],
      location_text: null,
      salary_text: null,
      summary: null,
      workplace_type: null,
    });

    expect(job).toMatchObject({
      category: "Conservation",
      employmentType: "Not stated",
      location: "Location not stated",
      locationType: "Not specified",
      organisation: "Employer not stated",
      salary: "Salary not stated",
    });
    expect(job.description).toEqual(["View the full vacancy details."]);
  });
});
