import { describe, expect, it } from "vitest";
import { mapPublicJob, type PublicJobRecord } from "../lib/public-job-mapper";

const record: PublicJobRecord = {
  id: 42,
  application_url: "https://example.org/jobs/wetland-researcher",
  closes_at: "2026-11-01",
  contract_type: "fixed_term",
  country_code: "GB",
  created_at: "2026-10-27T12:00:00Z",
  description: "First paragraph.\r\n\r\nSecond paragraph.",
  engagement_type: "paid",
  employers: {
    ai_summary: null,
    logo_url: "https://example.org/logo.svg",
    name: "Wetland Trust",
    overview: "Wetland Trust restores wetlands and supports nature recovery.",
    short_name: "WT",
    slug: "wetland-trust",
    website_url: "https://example.org",
  },
  experience_level: "developing",
  expires_at: "2026-11-01",
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
  salary_min: null,
  slug: "wetland-researcher",
  source_name: "Example Jobs Feed",
  source_url: "https://example.org/jobs/wetland-researcher",
  status: "published",
  summary: "Support an ecological monitoring programme.",
  summary_source: "source",
  title: "Wetland Researcher",
  withdrawn_at: null,
  workplace_type: "on_site",
};

describe("public job mapping", () => {
  it("maps database labels, paragraphs and the primary career area", () => {
    const job = mapPublicJob(record);

    expect(job).toMatchObject({
      careerAreas: ["Science and research", "Fieldwork"],
      category: "Science and research",
      contractType: "Fixed term",
      applicationLabel: "Apply on Example Jobs Feed",
      engagementType: "Paid",
      employmentType: "Full time",
      employerLogoUrl: "https://example.org/logo.svg",
      employerOverview: ["Wetland Trust restores wetlands and supports nature recovery."],
      employerWebsiteUrl: "https://example.org",
      experienceLevel: "developing",
      hoursType: "Full time",
      id: 42,
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
    expect(job.description).toEqual([]);
  });

  it("does not repeat the short summary as a second description block", () => {
    const job = mapPublicJob({
      ...record,
      description: "Support an ecological monitoring programme.",
      summary: "Support an ecological monitoring programme.",
    });

    expect(job.description).toEqual([]);
  });

  it("uses a clearly identified AI employer overview when official copy is unavailable", () => {
    const job = mapPublicJob({
      ...record,
      employers: {
        ...record.employers!,
        ai_summary: "An evidence-backed overview of the employer.",
        overview: null,
      },
    });

    expect(job).toMatchObject({
      employerOverview: ["An evidence-backed overview of the employer."],
      employerOverviewIsAi: true,
    });
  });

  it("preserves an AI summary label and an unknown closing date", () => {
    const job = mapPublicJob({
      ...record,
      closes_at: null,
      expires_at: "2026-11-27",
      summary_source: "ai",
    });

    expect(job).toMatchObject({ closesAt: undefined, summarySource: "ai" });
  });

  it("marks saved roles that are no longer available", () => {
    expect(
      mapPublicJob({ ...record, status: "withdrawn", withdrawn_at: "2026-10-29T09:00:00Z" }),
    ).toMatchObject({
      availability: "withdrawn",
    });

    expect(mapPublicJob({ ...record, closes_at: null, expires_at: "2026-10-28" })).toMatchObject({
      availability: "expired",
    });
  });
});
