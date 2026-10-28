import { jobs } from "./jobs";

export type Employer = Readonly<{
  slug: string;
  name: string;
  shortName: string;
  focus: string;
  locations: readonly string[];
  mission: string;
  overview: readonly string[];
  culture: string;
  benefits: readonly string[];
  reviewedAt: string;
}>;

export const employers: readonly Employer[] = [
  {
    slug: "example-habitat-partnership",
    name: "Example Habitat Partnership",
    shortName: "EHP",
    focus: "Community conservation",
    locations: ["Bristol", "South West England"],
    mission: "Help communities restore the habitats on their doorstep through practical, locally led action.",
    overview: [
      "This fictional organisation demonstrates how WildJobs can give candidates useful context before they decide whether to apply.",
      "The partnership brings community groups, land managers and conservation specialists together around shared habitat plans.",
    ],
    culture:
      "A collaborative team that values clear communication, shared ownership and time spent with local partners.",
    benefits: ["Flexible hybrid working", "Structured learning budget", "Paid volunteering days"],
    reviewedAt: "2026-10-28",
  },
  {
    slug: "example-coastal-trust",
    name: "Example Coastal Trust",
    shortName: "ECT",
    focus: "Marine conservation",
    locations: ["Plymouth", "South West coast"],
    mission: "Restore resilient coastal habitats with communities, volunteers and evidence-led field teams.",
    overview: [
      "This fictional trust represents a practical marine conservation employer working across coastal habitats.",
      "Its teams combine field monitoring, restoration activity, volunteer coordination and public engagement.",
    ],
    culture:
      "A field-focused organisation where safe working, practical learning and dependable teamwork matter.",
    benefits: [
      "Field equipment provided",
      "Flexible time after survey work",
      "Professional membership support",
    ],
    reviewedAt: "2026-10-28",
  },
  {
    slug: "example-nature-evidence-lab",
    name: "Example Nature Evidence Lab",
    shortName: "NEL",
    focus: "Science and research",
    locations: ["United Kingdom", "Remote"],
    mission: "Make conservation evidence easier to trust, understand and use in real-world decisions.",
    overview: [
      "This fictional evidence team demonstrates a remote-first conservation employer profile.",
      "The lab supports charities and project teams with ecological analysis, reproducible reporting and accessible explanations.",
    ],
    culture:
      "A calm, curious and documentation-led environment with protected focus time and regular peer review.",
    benefits: ["Remote-first working", "Home-working allowance", "Dedicated research and development time"],
    reviewedAt: "2026-10-28",
  },
  {
    slug: "example-forest-alliance",
    name: "Example Forest Alliance",
    shortName: "EFA",
    focus: "Programme management",
    locations: ["Edinburgh", "Scotland"],
    mission:
      "Support long-term forest recovery by helping specialist teams and communities work as one programme.",
    overview: [
      "This fictional alliance represents a multi-partner conservation programme with teams working across Scotland.",
      "Its work connects ecological restoration, community participation and long-term programme delivery.",
    ],
    culture:
      "An outcomes-focused workplace that gives teams autonomy while maintaining clear plans, risks and learning loops.",
    benefits: ["Hybrid working", "Enhanced pension contribution", "Annual team learning retreat"],
    reviewedAt: "2026-10-28",
  },
  {
    slug: "example-species-network",
    name: "Example Species Network",
    shortName: "ESN",
    focus: "Communications",
    locations: ["London", "United Kingdom"],
    mission:
      "Connect species recovery evidence with the people and organisations able to turn it into action.",
    overview: [
      "This fictional network demonstrates how a distributed membership organisation could explain its work to candidates.",
      "It brings researchers, practitioners and supporters together through evidence, events and public communication.",
    ],
    culture:
      "A supportive, editorially rigorous team that values accuracy, accessibility and respectful challenge.",
    benefits: ["Flexible part-time patterns", "Hybrid working", "Training and conference allowance"],
    reviewedAt: "2026-10-28",
  },
  {
    slug: "example-wetland-initiative",
    name: "Example Wetland Initiative",
    shortName: "EWI",
    focus: "Early careers",
    locations: ["Norfolk", "East of England"],
    mission:
      "Restore thriving wetlands while creating practical and inclusive routes into conservation work.",
    overview: [
      "This fictional initiative demonstrates the extra clarity an early-career applicant should receive from an employer profile.",
      "Its small team combines habitat monitoring, volunteer activity and structured learning placements.",
    ],
    culture:
      "A practical learning environment with regular supervision, clear feedback and no expectation of prior sector contacts.",
    benefits: ["Named placement supervisor", "Travel expenses for field days", "Protected learning time"],
    reviewedAt: "2026-10-28",
  },
];

export function employerBySlug(slug: string) {
  return employers.find((employer) => employer.slug === slug);
}

export function employerByName(name: string) {
  return employers.find((employer) => employer.name === name);
}

export function jobsForEmployer(name: string) {
  return jobs.filter((job) => job.organisation === name);
}
