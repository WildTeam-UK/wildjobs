export type LocationType = "Hybrid" | "Not specified" | "On-site" | "Remote";
export type EmploymentType =
  | "Apprenticeship"
  | "Fixed term"
  | "Flexible"
  | "Full time"
  | "Internship"
  | "Not stated"
  | "Part time"
  | "Permanent"
  | "Temporary";
export type EngagementType = "Paid" | "Volunteer";

export type Job = Readonly<{
  id?: number;
  availability?: "current" | "expired" | "unavailable" | "withdrawn";
  slug: string;
  applicationUrl?: string;
  applicationLabel?: string;
  title: string;
  organisation: string;
  location: string;
  locationLocality?: string;
  locationRegion?: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  engagementType?: EngagementType;
  contractType?: string;
  experienceLevel?: string;
  hoursType?: string;
  category: string;
  careerAreas?: readonly string[];
  salary: string;
  salaryMinimum?: number;
  summary: string;
  summarySource?: "ai" | "excerpt" | "source";
  description: readonly string[];
  responsibilities: readonly string[];
  requirements: readonly string[];
  postedAt: string;
  closesAt?: string;
  sourceName: string;
  sourceUrl?: string;
  employerSlug?: string;
  employerLogoUrl?: string;
  employerOverview: readonly string[];
  employerOverviewIsAi?: boolean;
  employerWebsiteUrl?: string;
  countryCode?: string;
  postalCode?: string;
  publishedAt?: string;
  relatedCourseSlugs: readonly string[];
}>;

export function compactJobLocation(
  job: Pick<Job, "countryCode" | "location" | "locationLocality" | "locationRegion" | "locationType">,
) {
  const rawAddressParts = job.location
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const inferredCountryCode = rawAddressParts.findLast((part) => /^[A-Z]{2}$/.test(part));
  const countryCode =
    job.countryCode ??
    inferredCountryCode ??
    (rawAddressParts.some((part) => /^(?:United Kingdom|UK)$/i.test(part)) ? "GB" : undefined);
  const addressParts = rawAddressParts.filter(
    (part) =>
      part &&
      !/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(part) &&
      ![countryCode, "United Kingdom", "UK", "GB"].filter(Boolean).includes(part),
  );
  const addressLocality = addressParts.length > 1 ? addressParts.at(-2) : addressParts[0] || undefined;
  const lead =
    job.locationType === "Remote"
      ? "Remote"
      : (job.locationLocality ?? job.locationRegion ?? addressLocality);
  return lead ? [lead, countryCode].filter(Boolean).join(", ") : job.location;
}

function daysFromToday(value: string, today: Date) {
  const target = new Date(`${value}T00:00:00Z`);
  const current = new Date(today);
  current.setUTCHours(0, 0, 0, 0);
  return Math.floor((target.valueOf() - current.valueOf()) / 86_400_000);
}

export function isNewJob(value: string, today = new Date()) {
  const daysOld = -daysFromToday(value, today);
  return daysOld >= 0 && daysOld < 7;
}

export function isClosingSoon(value: string, today = new Date()) {
  const daysRemaining = daysFromToday(value, today);
  return daysRemaining >= 0 && daysRemaining < 7;
}

export const jobs: readonly Job[] = [
  {
    slug: "community-conservation-coordinator",
    title: "Community Conservation Coordinator",
    organisation: "Example Habitat Partnership",
    location: "Bristol, United Kingdom",
    locationType: "Hybrid",
    employmentType: "Full time",
    category: "Community conservation",
    salary: "£31,000–£35,000",
    summary:
      "Coordinate community-led habitat projects and help local partners turn practical plans into measurable action.",
    description: [
      "This demonstration vacancy shows how a future WildJobs listing could present a conservation role clearly and consistently.",
      "The successful candidate would coordinate partners, support delivery planning and make project information accessible to communities.",
    ],
    responsibilities: [
      "Coordinate delivery plans with community and conservation partners.",
      "Support workshops, reporting and practical habitat activities.",
      "Maintain clear records of actions, risks and outcomes.",
    ],
    requirements: [
      "Experience supporting community or environmental projects.",
      "Clear written and verbal communication.",
      "Confidence coordinating several partners and deadlines.",
    ],
    postedAt: "2026-10-24",
    closesAt: "2026-11-28",
    sourceName: "Demonstration data",
    employerOverview: [],
    relatedCourseSlugs: ["project-management", "project-planning", "stakeholder-engagement"],
  },
  {
    slug: "marine-restoration-officer",
    title: "Marine Restoration Officer",
    organisation: "Example Coastal Trust",
    location: "Plymouth, United Kingdom",
    locationType: "On-site",
    employmentType: "Fixed term",
    category: "Marine conservation",
    salary: "£29,500–£33,500",
    summary:
      "Support coastal restoration surveys, volunteer activity and evidence-led delivery across priority marine habitats.",
    description: [
      "This demonstration listing represents a field-based marine restoration position.",
      "The role combines practical monitoring, volunteer coordination and accessible reporting for partners.",
    ],
    responsibilities: [
      "Help deliver ecological surveys and restoration activities.",
      "Coordinate volunteers and maintain safe field procedures.",
      "Prepare monitoring records and partner updates.",
    ],
    requirements: [
      "Practical experience in marine or coastal conservation.",
      "Comfort working outdoors in variable conditions.",
      "Ability to organise accurate field data.",
    ],
    postedAt: "2026-10-22",
    closesAt: "2026-11-24",
    sourceName: "Demonstration data",
    employerOverview: [],
    relatedCourseSlugs: ["project-planning", "monitoring-and-evaluation"],
  },
  {
    slug: "biodiversity-data-analyst",
    title: "Biodiversity Data Analyst",
    organisation: "Example Nature Evidence Lab",
    location: "United Kingdom",
    locationType: "Remote",
    employmentType: "Full time",
    category: "Science and research",
    salary: "£36,000–£42,000",
    summary:
      "Turn ecological datasets into reliable evidence for conservation teams, funders and decision-makers.",
    description: [
      "This demonstration vacancy shows a remote technical role in the conservation sector.",
      "The analyst would work with monitoring data, reproducible methods and clear visual explanations.",
    ],
    responsibilities: [
      "Clean, analyse and document ecological datasets.",
      "Build reproducible reports for programme teams.",
      "Explain uncertainty and limitations to non-technical audiences.",
    ],
    requirements: [
      "Experience analysing environmental or ecological data.",
      "Working knowledge of reproducible analysis methods.",
      "Strong written communication and attention to detail.",
    ],
    postedAt: "2026-10-20",
    closesAt: "2026-12-01",
    sourceName: "Demonstration data",
    employerOverview: [],
    relatedCourseSlugs: ["monitoring-and-evaluation"],
  },
  {
    slug: "forest-programme-manager",
    title: "Forest Programme Manager",
    organisation: "Example Forest Alliance",
    location: "Edinburgh, United Kingdom",
    locationType: "Hybrid",
    employmentType: "Full time",
    category: "Programme management",
    salary: "£43,000–£49,000",
    summary:
      "Lead a portfolio of collaborative forest projects, supporting teams to deliver durable ecological and community outcomes.",
    description: [
      "This demonstration vacancy represents a senior programme-delivery role.",
      "The role would hold delivery oversight while helping specialist teams collaborate effectively.",
    ],
    responsibilities: [
      "Lead programme planning, budgets, risks and reporting.",
      "Support project leads and external delivery partners.",
      "Maintain a clear view of progress and outcomes across the portfolio.",
    ],
    requirements: [
      "Substantial experience managing multi-partner programmes.",
      "Strong financial, risk and stakeholder-management skills.",
      "An understanding of conservation programme delivery.",
    ],
    postedAt: "2026-10-18",
    closesAt: "2026-11-21",
    sourceName: "Demonstration data",
    employerOverview: [],
    relatedCourseSlugs: ["project-management", "project-planning", "monitoring-and-evaluation"],
  },
  {
    slug: "wildlife-communications-officer",
    title: "Wildlife Communications Officer",
    organisation: "Example Species Network",
    location: "London, United Kingdom",
    locationType: "Hybrid",
    employmentType: "Part time",
    category: "Communications",
    salary: "£30,000 pro rata",
    summary:
      "Create clear, useful communications that connect wildlife evidence with supporters, communities and partners.",
    description: [
      "This demonstration vacancy represents a part-time communications position.",
      "The role would translate technical work into accurate and engaging content across several channels.",
    ],
    responsibilities: [
      "Plan and produce digital and supporter communications.",
      "Work with specialists to check accuracy and context.",
      "Measure performance and improve future content.",
    ],
    requirements: [
      "Professional communications or editorial experience.",
      "Ability to explain technical subjects clearly.",
      "Careful fact-checking and project organisation.",
    ],
    postedAt: "2026-10-16",
    closesAt: "2026-11-18",
    sourceName: "Demonstration data",
    employerOverview: [],
    relatedCourseSlugs: ["stakeholder-engagement", "grant-writing"],
  },
  {
    slug: "conservation-project-intern",
    title: "Conservation Project Intern",
    organisation: "Example Wetland Initiative",
    location: "Norfolk, United Kingdom",
    locationType: "On-site",
    employmentType: "Internship",
    category: "Early careers",
    salary: "£24,000 pro rata",
    summary:
      "Build practical experience supporting wetland monitoring, volunteer days and project administration.",
    description: [
      "This demonstration vacancy shows how an accessible early-career opportunity could be presented.",
      "The internship would combine structured learning with practical project support.",
    ],
    responsibilities: [
      "Support field monitoring and volunteer activities.",
      "Organise project information and equipment.",
      "Take part in regular learning and feedback sessions.",
    ],
    requirements: [
      "An interest in practical conservation work.",
      "Reliability and willingness to learn.",
      "Ability to work respectfully with volunteers and colleagues.",
    ],
    postedAt: "2026-10-14",
    closesAt: "2026-11-16",
    sourceName: "Demonstration data",
    employerOverview: [],
    relatedCourseSlugs: ["launching-your-career", "project-planning"],
  },
];

export function jobBySlug(slug: string) {
  return jobs.find((job) => job.slug === slug);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${value}T12:00:00Z`),
  );
}

export function listingAgeLabel(value: string, today = new Date()) {
  const listed = new Date(`${value}T00:00:00Z`);
  const current = new Date(today);
  current.setUTCHours(0, 0, 0, 0);
  const days = Math.max(0, Math.floor((current.valueOf() - listed.valueOf()) / 86_400_000));
  return `Unknown · listing is ${days} ${days === 1 ? "day" : "days"} old`;
}
