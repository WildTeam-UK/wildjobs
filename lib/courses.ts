export type Course = Readonly<{
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  trainingUrl: string;
}>;

export const courses: readonly Course[] = [
  {
    slug: "project-management",
    title: "Project Management for Wildlife Conservation",
    shortTitle: "Project management",
    summary: "Plan delivery, support teams and keep conservation work on track.",
    trainingUrl: "https://training.wildteam.org.uk/course/project-management-for-wildlife-conservation",
  },
  {
    slug: "project-planning",
    title: "Project Planning for Wildlife Conservation",
    shortTitle: "Project planning",
    summary: "Turn conservation needs into practical, evidence-led project plans.",
    trainingUrl: "https://training.wildteam.org.uk/courses",
  },
  {
    slug: "monitoring-and-evaluation",
    title: "Monitoring and Evaluation for Wildlife Conservation",
    shortTitle: "Monitoring and evaluation",
    summary: "Track progress, evaluate outcomes and communicate conservation impact.",
    trainingUrl:
      "https://training.wildteam.org.uk/course/monitoring-and-evaluation-for-wildlife-conservation",
  },
  {
    slug: "stakeholder-engagement",
    title: "Stakeholder Engagement for Wildlife Conservation",
    shortTitle: "Stakeholder engagement",
    summary: "Build the relationships needed for durable conservation outcomes.",
    trainingUrl: "https://training.wildteam.org.uk/courses",
  },
  {
    slug: "grant-writing",
    title: "Grant Writing for Wildlife Conservation",
    shortTitle: "Grant writing",
    summary: "Develop clear, credible proposals that connect action with impact.",
    trainingUrl: "https://training.wildteam.org.uk/course/grant-writing",
  },
  {
    slug: "launching-your-career",
    title: "Launching Your Career in Wildlife Conservation",
    shortTitle: "Launching your career",
    summary: "Explore roles, build evidence and approach conservation applications with confidence.",
    trainingUrl: "https://training.wildteam.org.uk/course/launching-your-career-in-wildlife-conservation",
  },
];

export function courseBySlug(slug: string) {
  return courses.find((course) => course.slug === slug);
}
