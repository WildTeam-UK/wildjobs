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
  locality: "Gloucester",
  postal_code: "GL1",
  posted_at: null,
  published_at: "2026-10-28T16:14:13Z",
  region: "Gloucestershire",
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
      locationLocality: "Gloucester",
      locationRegion: "Gloucestershire",
      organisation: "WT",
      postedAt: "2026-10-28",
      postalCode: "GL1",
    });
    expect(job.description).toEqual(["First paragraph.", "Second paragraph."]);
    expect(job.requirements).toEqual(["Ecology background", "Valid driving licence"]);
  });

  it("maps reviewed job capabilities to related course filters without duplicates", () => {
    const projectManagement = {
      availability_status: "available",
      is_active: true,
      is_filter_visible: true,
      public_url: "https://training.wildteam.org.uk/course/project-management",
      short_title: "Project management",
      slug: "project-management",
      theme_colour: "#5A287F",
    };
    const monitoringAndEvaluation = {
      availability_status: "available",
      is_active: true,
      is_filter_visible: true,
      public_url: "https://training.wildteam.org.uk/course/monitoring-and-evaluation",
      short_title: "Monitoring and evaluation",
      slug: "monitoring-and-evaluation",
      theme_colour: null,
    };
    const job = mapPublicJob({
      ...record,
      job_capabilities: [
        {
          importance: "essential",
          relevance_score: 92,
          capabilities: {
            description: "Plan and deliver conservation projects.",
            slug: "project-management",
            title: "Project management",
            course_capabilities: [{ courses: projectManagement }, { courses: monitoringAndEvaluation }],
          },
        },
        {
          importance: "useful",
          relevance_score: 75,
          capabilities: {
            description: "Engage people affected by conservation work.",
            slug: "stakeholder-engagement",
            title: "Stakeholder engagement",
            course_capabilities: [{ courses: projectManagement }],
          },
        },
      ],
    });

    expect(job.relatedCourseSlugs).toEqual(["project-management", "monitoring-and-evaluation"]);
    expect(job.relatedCourses).toEqual([
      {
        shortTitle: "Project management",
        slug: "project-management",
        themeColour: "#5A287F",
        trainingUrl: "https://training.wildteam.org.uk/course/project-management",
      },
      {
        shortTitle: "Monitoring and evaluation",
        slug: "monitoring-and-evaluation",
        themeColour: "#e60088",
        trainingUrl: "https://training.wildteam.org.uk/course/monitoring-and-evaluation",
      },
    ]);
  });

  it("maps public role enrichment without exposing internal evidence or scores", () => {
    const job = mapPublicJob({
      ...record,
      job_benefits: [
        {
          benefits: {
            description: "Employer contributions towards retirement.",
            slug: "pension",
            title: "Pension",
          },
        },
      ],
      job_capabilities: [
        {
          capabilities: {
            course_capabilities: [],
            description: "Plan and deliver conservation projects.",
            slug: "project-management",
            title: "Project management",
          },
          importance: "essential",
          relevance_score: 91,
        },
      ],
      job_locations: [
        {
          address_line_1: "Wetland Centre",
          address_line_2: null,
          country_code: "GB",
          is_primary: true,
          locality: "Gloucester",
          postal_code: "GL1",
          raw_text: "Wetland Centre, Gloucester",
          region: "Gloucestershire",
        },
      ],
      job_occupations: [
        {
          is_primary: true,
          occupations: {
            description: "Coordinates environmental projects.",
            slug: "project-manager",
            title: "Project manager",
          },
        },
      ],
    });

    expect(job).toMatchObject({
      benefits: [{ slug: "pension", title: "Pension" }],
      capabilities: [{ slug: "project-management", title: "Project management" }],
      locations: [{ isPrimary: true, label: "Wetland Centre, Gloucester" }],
      occupations: [{ slug: "project-manager", title: "Project manager" }],
    });
  });

  it("keeps the public heading to the job title when a source appends the employer", () => {
    expect(mapPublicJob({ ...record, title: "Wetland Researcher with Wetland Trust" }).title).toBe(
      "Wetland Researcher",
    );
  });

  it("uses clear fallbacks when optional publishing fields are empty", () => {
    const job = mapPublicJob({
      ...record,
      contract_type: null,
      description: null,
      employers: null,
      hours_type: null,
      job_career_areas: [],
      locality: null,
      location_text: null,
      postal_code: null,
      region: null,
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

  it("does not repeat a summary when source whitespace differs", () => {
    const job = mapPublicJob({
      ...record,
      description: "Support an ecological\nmonitoring programme.",
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
