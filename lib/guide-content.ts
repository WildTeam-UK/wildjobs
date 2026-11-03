import { z } from "zod";
import { guideSectorLabels, sectorGuideSlugs, type SectorGuideSlug } from "./guide-sectors";
import { additionalSectorGuides } from "./sector-guide-content";
import { additionalCareerGuides } from "./career-guide-content";
import { careerRoleSlugs, isCareerRoleSlug } from "./career-role-catalog";

const paragraph = z.object({ text: z.string().max(4000), sources: z.array(z.string()) });
const item = z.object({ title: z.string(), text: z.string() });
export const guideContentSchema = z.object({
  slug: z.enum([...sectorGuideSlugs, ...careerRoleSlugs]),
  kind: z.enum(["sector", "career"]),
  matchSlug: z.string(),
  version: z.number().int().positive(),
  title: z.string(),
  accent: z.string(),
  description: z.string(),
  image: z.string().startsWith("/images/"),
  imageAlt: z.string(),
  photoCredit: z.object({ label: z.string(), url: z.url().startsWith("https://") }).optional(),
  sources: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.url().startsWith("https://"),
      checkedAt: z.iso.date(),
      supports: z.string(),
    }),
  ),
  sections: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      title: z.string(),
      paragraphs: z.array(paragraph),
      cards: z.array(item).optional(),
      bullets: z.array(item).optional(),
      faqs: z.array(item).optional(),
      module: z.enum(["market", "jobs", "courses", "career-course", "roles"]).optional(),
    }),
  ),
});
export type GuideContent = z.infer<typeof guideContentSchema>;

const sources = {
  wildlife: {
    id: "wildlife-trusts",
    title: "The Wildlife Trusts · Careers",
    url: "https://www.wildlifetrusts.org/about-us/careers",
    checkedAt: "2026-11-03",
    supports: "The breadth of conservation careers, employer examples and work-experience routes",
  },
  green: {
    id: "green-jobs",
    title: "Green Jobs for Nature · Types of green jobs",
    url: "https://greenjobsfornature.org/careers/",
    checkedAt: "2026-11-03",
    supports: "Practical conservation, ecology, data, education, communications, policy and project roles",
  },
  officer: {
    id: "ncs-officer",
    title: "National Careers Service · Countryside officer",
    url: "https://nationalcareers.service.gov.uk/job-profiles/countryside-officer",
    checkedAt: "2026-11-03",
    supports: "Routes into countryside work and the variation in entry requirements",
  },
  ecologist: {
    id: "ncs-ecologist",
    title: "National Careers Service · Ecologist",
    url: "https://nationalcareers.service.gov.uk/job-profiles/ecologist",
    checkedAt: "2026-11-03",
    supports: "Ecologist duties, skills, education routes, working settings and progression",
  },
  cieem: {
    id: "cieem",
    title: "CIEEM · Careers in ecology and environmental management",
    url: "https://cieem.net/i-want-to-be/how-to-become-an-eem/careers/",
    checkedAt: "2026-11-03",
    supports: "Ecology careers across government, charities, consultancy, industry, research and teaching",
  },
} as const;

export const sectorGuide: GuideContent = {
  slug: "wildlife-conservation",
  kind: "sector",
  matchSlug: "conservation-wildlife",
  version: 1,
  title: "Wildlife",
  accent: "Conservation",
  description:
    "Many skills. One living planet. Find your place in the work to protect species, restore habitats and help people and nature thrive together.",
  image: "/images/design/wildlife-deer.jpg",
  imageAlt: "Deer among trees in a woodland",
  photoCredit: {
    label: "Unleashed Agency / Unsplash",
    url: "https://unsplash.com/photos/brown-deer-on-forest-during-daytime-SXczrJECIEo",
  },
  sources: [sources.wildlife, sources.green, sources.officer, sources.cieem],
  sections: [
    {
      id: "sector-overview",
      label: "The sector at a glance",
      title: "Conservation takes more than one kind of person",
      paragraphs: [
        {
          text: "Protecting wildlife involves practical habitat work, ecological evidence and the people who make projects possible. The Wildlife Trusts describes careers in reserves, ecology, data, finance, communications and community events: there is no single conservation job.",
          sources: ["wildlife-trusts"],
        },
        {
          text: "Start with the contribution you want to make. Would you rather work on a site, interpret evidence, bring people together or organise delivery? Use that question to compare actual vacancies rather than choosing a sector label alone.",
          sources: [],
        },
      ],
    },
    {
      id: "the-work",
      label: "Where the work happens",
      title: "From a single species to a whole landscape",
      paragraphs: [
        {
          text: "Green Jobs for Nature groups nature-related work into practical conservation, ecology, mapping, education, communications, policy and project management, among other careers. These are overlapping routes, not fixed boundaries.",
          sources: ["green-jobs"],
        },
      ],
      cards: [
        {
          title: "Habitats and species",
          text: "Explore practical conservation work and ecological survey roles.",
        },
        {
          title: "Evidence and mapping",
          text: "Look at how ecological information is collected, analysed and communicated.",
        },
        {
          title: "People and participation",
          text: "Consider education, communications and community-facing work.",
        },
        {
          title: "Projects and decisions",
          text: "Explore delivery, policy and the coordination behind conservation activity.",
        },
      ],
    },
    {
      id: "career-routes",
      label: "Roles and routes in",
      title: "Find a route that fits your starting point",
      paragraphs: [
        {
          text: "Entry routes depend on the occupation. The National Careers Service lists university, college, apprenticeship and work-based routes for countryside officers. That does not mean every route is available for every conservation role: check each vacancy and the relevant provider.",
          sources: ["ncs-officer"],
        },
        {
          text: "CIEEM describes ecology-related careers in public bodies, charities, consultancy, industry, research and teaching. A sector guide helps you explore that breadth; a career guide should help you investigate one occupation in more detail.",
          sources: ["cieem"],
        },
      ],
      bullets: [
        {
          title: "Explore ecology",
          text: "Read the ecologist guide, then compare the duties of current openings.",
        },
        {
          title: "Investigate local routes",
          text: "Ask employers about accessible work experience, traineeships and entry-level opportunities.",
        },
      ],
    },
    {
      id: "sector-skills",
      label: "Skills that connect the work",
      title: "Build evidence of what you can contribute",
      paragraphs: [
        {
          text: "The capabilities you need depend on the work. Compare person specifications and distinguish essential requirements from desirable experience. Do not assume that a requirement in one advert applies throughout conservation.",
          sources: [],
        },
        {
          text: "Our suggested approach is to keep a short evidence bank: a task you completed, what you did, the result and what you learned. Choose examples that relate directly to the role you want.",
          sources: [],
        },
      ],
    },
    {
      id: "sector-pay",
      label: "Pay and working patterns",
      title: "Read the figures in context",
      paragraphs: [
        {
          text: "The figures below describe the vacancies collected by WildJobs, not everyone working in conservation or every vacancy in the market. The sample will change as the directory grows. Different occupations and levels can have very different pay.",
          sources: [],
        },
      ],
      module: "market",
    },
    {
      id: "sector-training",
      label: "Develop your skills",
      title: "Build the skills behind the impact",
      paragraphs: [
        {
          text: "Choose development around a task you want to do better. WildTeam training can support professional skills, but it does not replace occupation-specific qualifications, licences or supervised experience required by an employer.",
          sources: [],
        },
      ],
      module: "courses",
    },
    {
      id: "career-plan",
      label: "Plan your next step",
      title: "Your next chapter starts with a plan",
      paragraphs: [],
      module: "career-course",
    },
    {
      id: "jobs",
      label: "Current opportunities",
      title: "Find your place in conservation",
      paragraphs: [
        {
          text: "These are live vacancies assigned to Wildlife Conservation in the directory. A vacancy can belong to more than one sector. Always check the original advert before applying.",
          sources: [],
        },
      ],
      module: "jobs",
    },
    {
      id: "sector-faq",
      label: "Questions and next steps",
      title: "Make your next move a manageable one",
      paragraphs: [],
      faqs: [
        {
          title: "Do I need a conservation degree?",
          text: "There is no single requirement for this whole sector. Compare the requirements of the occupation and vacancies that interest you; some paths are technical, while others use skills from different disciplines.",
        },
        {
          title: "Can I move across from another career?",
          text: "Start by comparing your existing experience with actual role requirements. Identify both transferable strengths and any knowledge or practical experience you still need.",
        },
        {
          title: "Where should I start?",
          text: "Our suggestion is to choose one kind of work, read several adverts and identify one realistic next step. Treat this as a planning exercise rather than a promise of a particular outcome.",
        },
      ],
    },
  ],
};

export const ecologistGuide: GuideContent = {
  slug: "ecologist",
  kind: "career",
  matchSlug: "ecologist",
  version: 1,
  title: "Become an",
  accent: "ecologist",
  description:
    "Turn your curiosity about wildlife into evidence that helps protect it. Explore the work, the routes in and the skills that can help you take your next step.",
  image: "/images/design/woodland.jpg",
  imageAlt: "Morning sunlight falling through woodland trees",
  photoCredit: { label: "Darren Bockman / Unsplash", url: "https://unsplash.com/photos/pN3Z2usSIQw" },
  sources: [sources.ecologist, sources.cieem, sources.green],
  sections: [
    {
      id: "the-role",
      label: "The work and who it suits",
      title: "Give nature a voice in the decisions that matter",
      paragraphs: [
        {
          text: "Ecologists study living things and their environment. Work can involve gathering ecological information, assessing human impacts and advising on protection or restoration. The exact mix depends on the employer and specialism.",
          sources: ["ncs-ecologist"],
        },
        {
          text: "CIEEM describes opportunities across local government, statutory agencies, charities, consultancy, business, research and teaching. Compare the setting as well as the title when deciding what interests you.",
          sources: ["cieem"],
        },
      ],
    },
    {
      id: "day-to-day",
      label: "A working day",
      title: "Turn observations into useful decisions",
      paragraphs: [
        {
          text: "Surveying and assessing possible impacts are common themes in Green Jobs for Nature’s ecologist overview. Some jobs emphasise fieldwork; others focus on analysis, advice or reports. An advert is a better guide to one employer’s needs than a single description of a typical day.",
          sources: ["green-jobs"],
        },
      ],
      cards: [
        { title: "Observe", text: "Check which surveys, habitats or species the role covers." },
        { title: "Interpret", text: "Look for the analysis and judgement expected at that level." },
        {
          title: "Communicate",
          text: "Find out who uses the evidence and what reports or advice you would produce.",
        },
      ],
    },
    {
      id: "routes-in",
      label: "Routes into ecology",
      title: "Choose a route with the role in mind",
      paragraphs: [
        {
          text: "The National Careers Service describes relevant university study and an ecologist degree apprenticeship as routes into the profession. Availability and entry requirements vary. Check the current guidance and individual providers before choosing a qualification.",
          sources: ["ncs-ecologist"],
        },
        {
          text: "Our suggestion is to compare several suitable vacancies before committing to training. Note the repeated requirements, then ask providers how their course helps you demonstrate those capabilities.",
          sources: [],
        },
      ],
    },
    {
      id: "skills",
      label: "Skills and experience",
      title: "Make your capabilities visible",
      paragraphs: [
        {
          text: "The National Careers Service highlights scientific and analytical skills, care with detail and written communication. Some fieldwork roles may also require driving. Individual adverts determine which skills and requirements apply to a particular vacancy.",
          sources: ["ncs-ecologist"],
        },
      ],
      bullets: [
        {
          title: "Keep a practical record",
          text: "Record your contribution, methods, supervision and what you learned from relevant work.",
        },
        {
          title: "Explain your reasoning",
          text: "Prepare examples that show how you interpret evidence and communicate limitations.",
        },
        {
          title: "Be clear about your level",
          text: "Distinguish tasks you can perform independently from those where you need training or supervision.",
        },
      ],
    },
    {
      id: "salary",
      label: "Pay and working life",
      title: "Compare like with like",
      paragraphs: [
        {
          text: "Assistant, senior and multi-grade opportunities belong to the same career family here, but they are kept separate when examining pay. Our figures are advertised starting salaries from the directory, not a prediction of what you will earn.",
          sources: [],
        },
      ],
      module: "market",
    },
    {
      id: "progression",
      label: "Where it can take you",
      title: "Let your experience shape your direction",
      paragraphs: [
        {
          text: "The National Careers Service describes progression into senior ecology, consultancy, biodiversity advice and specialist work. These are possible directions, not guaranteed steps or a fixed timetable.",
          sources: ["ncs-ecologist"],
        },
      ],
    },
    {
      id: "applications",
      label: "Prepare your application",
      title: "Show how your experience fits the work",
      paragraphs: [
        {
          text: "Our suggested approach is to work through the person specification, choose a relevant example for each requirement and explain your own contribution. Be accurate about your technical competence and any experience you are still developing.",
          sources: [],
        },
      ],
    },
    {
      id: "training",
      label: "Useful WildTeam training",
      title: "Choose development with a purpose",
      paragraphs: [
        {
          text: "Consider WildTeam training when it supports a task in your target role, such as organising a project or working with stakeholders. It is professional development, not a substitute for technical ecology training or a guarantee of employment.",
          sources: [],
        },
      ],
      module: "courses",
    },
    {
      id: "next-steps",
      label: "Your next steps",
      title: "Turn exploration into a small plan",
      paragraphs: [],
      bullets: [
        {
          title: "Compare",
          text: "Read several vacancies at a realistic level and record their requirements.",
        },
        {
          title: "Check",
          text: "Use professional careers guidance and ask employers about anything unclear.",
        },
        {
          title: "Practise",
          text: "Choose one manageable way to strengthen an evidence gap, then review what you learned.",
        },
      ],
    },
    {
      id: "jobs",
      label: "Current opportunities",
      title: "Explore ecology roles open now",
      paragraphs: [
        {
          text: "These jobs match the ecologist career family, including supported ecological-consultant variants. Possible misspellings and ambiguous titles stay out until reviewed. Read the original advert for the employer’s precise role and level.",
          sources: [],
        },
      ],
      module: "jobs",
    },
    {
      id: "questions",
      label: "Questions and further reading",
      title: "Keep asking useful questions",
      paragraphs: [],
      faqs: [
        {
          title: "Are all ecology jobs outdoors?",
          text: "No. Ecology roles can combine fieldwork with office, laboratory or research settings. Check the advertised duties, location and working arrangements.",
        },
        {
          title: "Will a course get me an ecology job?",
          text: "No course guarantees employment. Choose learning that addresses a relevant skills gap and check the employer’s technical requirements.",
        },
        {
          title: "Does this guide include senior jobs?",
          text: "Yes, the career family includes different levels. Salary samples identify levels separately, and mixed-grade adverts are excluded from the salary calculation.",
        },
      ],
    },
  ],
};

export const pilotGuides = [sectorGuide, ecologistGuide] as const;
export const guideCatalog: readonly GuideContent[] = [
  ...pilotGuides,
  ...additionalSectorGuides,
  ...additionalCareerGuides,
];
export const careerGuides = guideCatalog.filter((guide) => guide.kind === "career");
export const sectorGuides = guideCatalog.filter(
  (guide): guide is GuideContent & { slug: SectorGuideSlug; kind: "sector" } =>
    guide.kind === "sector" && !isCareerRoleSlug(guide.slug),
);
export function guidePath(guide: Pick<GuideContent, "slug" | "kind">) {
  return `/${guide.kind === "sector" ? "conservation-sector" : "conservation-career-guides"}/${guide.slug}`;
}
export function guideJobsPath(guide: Pick<GuideContent, "kind" | "slug" | "matchSlug">) {
  if (guide.kind === "career") return `/?role=${encodeURIComponent(guide.matchSlug)}`;
  if (isCareerRoleSlug(guide.slug)) throw new Error("A career slug cannot identify a sector guide.");
  return `/?sector=${encodeURIComponent(guideSectorLabels[guide.slug])}`;
}
export function validateGuideContent(value: unknown) {
  const guide = guideContentSchema.parse(value);
  if ((guide.kind === "career") !== isCareerRoleSlug(guide.slug))
    throw new Error("Guide kind and occupation identity do not match.");
  const ids = new Set(guide.sources.map((s) => s.id));
  if (
    ids.size !== guide.sources.length ||
    new Set(guide.sections.map((s) => s.id)).size !== guide.sections.length ||
    guide.sections.some((s) => s.paragraphs.some((p) => p.sources.some((id) => !ids.has(id))))
  )
    throw new Error("Guide citations or section identifiers are invalid.");
  return guide;
}
