import type { GuideContent } from "./guide-content";
import type { CareerRoleSlug } from "./career-role-catalog";

type Section = GuideContent["sections"][number];
type Paragraph = Section["paragraphs"][number];
type Item = { title: string; text: string };
const p = (text: string, ...sources: string[]): Paragraph => ({ text, sources });
const source = (
  id: string,
  title: string,
  url: string,
  supports: string,
): GuideContent["sources"][number] => ({ id, title, url, supports, checkedAt: "2026-11-03" });
const research = {
  apm: source(
    "apm-careers",
    "Association for Project Management · A career in project management",
    "https://www.apm.org.uk/jobs-and-careers/career-path/",
    "Project-manager responsibilities for scope, schedule, finance, risk, quality and resources, and varied career routes",
  ),
  ncsProject: source(
    "ncs-project",
    "National Careers Service · Business project manager",
    "https://nationalcareers.service.gov.uk/job-profiles/business-project-manager",
    "UK project-management entry routes, project-support experience and progression; specialist industries have their own requirements",
  ),
  natureProject: source(
    "nature-project",
    "Green Jobs for Nature · Project manager",
    "https://greenjobsfornature.org/careers/project-manager/",
    "Environmental project settings, stakeholder work and time-limited and permanent contracts",
  ),
  education: source(
    "nature-education",
    "Green Jobs for Nature · Environmental educator",
    "https://greenjobsfornature.org/careers/environment-educator/",
    "Nature-based education with children and adults, on-site and visiting work, and employer settings",
  ),
  lantra: source(
    "lantra-education",
    "Lantra · Education officer",
    "https://www.lantra.co.uk/careers/JobProfile/JobProfileDetails/51",
    "Environmental education as a land-based career and occupation-specific training information; not a universal teaching qualification",
  ),
  natureBridge: source(
    "naturebridge-educators",
    "NatureBridge · Environmental science educators",
    "https://naturebridge.org/careers/environmental-science-educators",
    "A US employer example of residential environmental science education; its requirements are specific to that employer",
  ),
  biology: source(
    "ncs-biologist",
    "National Careers Service · Biologist",
    "https://nationalcareers.service.gov.uk/job-profiles/biologist",
    "The breadth of biological work, UK study and work-based routes, scientific skills and specialisation",
  ),
  wildlifeBiology: source(
    "bls-wildlife",
    "US Bureau of Labor Statistics · Zoologists and wildlife biologists",
    "https://www.bls.gov/ooh/life-physical-and-social-science/zoologists-and-wildlife-biologists.htm",
    "US wildlife-biologist tasks and working settings; US education guidance is not presented as a UK requirement",
  ),
  onet: source(
    "onet-wildlife",
    "O*NET · Zoologists and wildlife biologists",
    "https://www.onetonline.org/link/summary/19-1023.00",
    "Examples of aquatic, fisheries, habitat and wildlife-biologist titles and conservation-related tasks",
  ),
  ncvo: source(
    "ncvo-chief",
    "NCVO · Working with the chief executive",
    "https://www.ncvo.org.uk/help-and-guidance/governance/responsibilities-for-boards/helping-your-board-meet-their-responsibilities/managing-people/",
    "The UK charity chief executive's staff leadership, accountability to the board and variation with organisational size",
  ),
  nonprofits: source(
    "nonprofits-board",
    "National Council of Nonprofits · Board roles and responsibilities",
    "https://www.councilofnonprofits.org/running-nonprofit/governance-leadership/board-roles-and-responsibilities",
    "US nonprofit CEO/executive-director terminology and the distinction between management and board oversight",
  ),
};

type CareerDraft = {
  slug: Exclude<CareerRoleSlug, "ecologist">;
  name: string;
  article: "a" | "an";
  description: string;
  image: string;
  imageAlt: string;
  sources: GuideContent["sources"];
  overviewTitle: string;
  overview: Paragraph[];
  workTitle: string;
  work: Paragraph[];
  tasks: Item[];
  routes: Paragraph[];
  skills: Item[];
  progression: Paragraph[];
  scope: string;
  questions: Item[];
};

// The recurring structure is shared; occupation advice and citations are authored
// separately. Live samples never become unsupported claims about the whole market.
function career(draft: CareerDraft): GuideContent {
  return {
    slug: draft.slug,
    kind: "career",
    matchSlug: draft.slug,
    version: 1,
    title: `Become ${draft.article}`,
    accent: draft.name,
    description: draft.description,
    image: draft.image,
    imageAlt: draft.imageAlt,
    sources: draft.sources,
    sections: [
      {
        id: "the-role",
        label: "The work and who it suits",
        title: draft.overviewTitle,
        paragraphs: draft.overview,
      },
      {
        id: "day-to-day",
        label: "A working day",
        title: draft.workTitle,
        paragraphs: [
          ...draft.work,
          p(
            "Use these prompts to compare individual adverts. They are a way to investigate the work, rather than a checklist that every employer will require.",
          ),
        ],
        cards: draft.tasks,
      },
      {
        id: "routes-in",
        label: "Routes into the work",
        title: "Choose a route that fits the responsibility",
        paragraphs: draft.routes,
      },
      {
        id: "skills",
        label: "Skills and experience",
        title: "Build evidence of what you can contribute",
        paragraphs: [
          p(
            "Our suggested approach is to match your examples to the actual person specification. Distinguish essential requirements from desirable experience, and be clear about where you still need training or supervision.",
          ),
        ],
        bullets: draft.skills,
      },
      {
        id: "salary",
        label: "Pay and working life",
        title: "Read the figures in context",
        paragraphs: [
          p(
            "The headline median combines comparable advertised starting salaries in this career family. The detail below separates career levels. It is not a promise of earnings or an estimate for every location. Vacancy counts cover all countries in the matching directory sample; salary medians use qualifying UK adverts only.",
          ),
        ],
        module: "market",
      },
      {
        id: "progression",
        label: "Where it can take you",
        title: "Plan your next step around the work",
        paragraphs: draft.progression,
      },
      {
        id: "applications",
        label: "Prepare your application",
        title: "Make your contribution easy to understand",
        paragraphs: [
          p(
            "Our suggested approach is to select a relevant example for each requirement, explain what you personally did and describe the result. Keep figures and claims accurate. Explain the context, the limits of your responsibility and what you learned, rather than relying on your previous job title alone.",
          ),
        ],
      },
      {
        id: "training",
        label: "Useful WildTeam training",
        title: "Choose development with a purpose",
        paragraphs: [
          p(
            "Consider WildTeam training when it helps with a task in your target role, such as organising a project, working with stakeholders or preparing a funding proposal. It supports professional development; it does not replace technical qualifications, regulated training or an employer's experience requirements, and it cannot guarantee employment.",
          ),
        ],
        module: "courses",
      },
      {
        id: "next-steps",
        label: "Your next steps",
        title: "Turn exploration into a manageable plan",
        paragraphs: [],
        bullets: [
          {
            title: "Compare",
            text: "Read several relevant vacancies, including their location, level and working pattern. Separate repeated requirements from one employer's preferences.",
          },
          {
            title: "Check",
            text: "Use the linked professional sources and ask employers about unclear requirements before committing time or money to a qualification.",
          },
          {
            title: "Practise",
            text: "Choose one realistic way to strengthen an evidence gap, record what you learn and review whether it takes you closer to the work you want.",
          },
        ],
      },
      {
        id: "jobs",
        label: "Current opportunities",
        title: `Explore ${draft.name} roles open now`,
        paragraphs: [p(draft.scope)],
        module: "jobs",
      },
      {
        id: "questions",
        label: "Questions and further reading",
        title: "Keep asking useful questions",
        paragraphs: [],
        faqs: [
          ...draft.questions,
          {
            title: "Where should I start?",
            text: "Our suggestion is to compare the responsibilities in a few suitable adverts, identify one useful next step and make a practical plan for it.",
          },
        ],
      },
    ],
  };
}

export const additionalCareerGuides: readonly GuideContent[] = [
  career({
    slug: "project-manager",
    name: "project manager",
    article: "a",
    description:
      "Turn an ambition for nature into work that people can deliver. Explore conservation project management, the skills behind it and practical ways to build your experience.",
    image: "/images/sectors/environmental-management.png",
    imageAlt: "Illustration representing environmental project work",
    sources: [research.apm, research.ncsProject, research.natureProject],
    overviewTitle: "Help good ideas become organised action",
    overview: [
      p(
        "The Association for Project Management describes the project manager as responsible for day-to-day delivery, including scope, schedules, money, risk, quality and resources. The role is about coordinating decisions and people as well as maintaining a plan.",
        "apm-careers",
      ),
      p(
        "Green Jobs for Nature describes project management across environmental projects, campaigns and reserves. Some posts last for a particular funded project; others are permanent roles that move between projects. Read the contract and responsibilities before comparing opportunities.",
        "nature-project",
      ),
    ],
    workTitle: "Keep the purpose, people and plan connected",
    work: [
      p(
        "The National Careers Service describes planning tasks and resources, leading a project team, reporting progress and adapting when problems arise. In conservation, the technical setting still matters: a habitat-restoration project and a construction project can require different specialist experience.",
        "ncs-project",
      ),
    ],
    tasks: [
      {
        title: "Clarify delivery",
        text: "Check the outputs, timetable, budget and decisions you would own, and who can approve changes.",
      },
      {
        title: "Coordinate people",
        text: "Look for the partners, colleagues, communities and contractors you would need to work with.",
      },
      {
        title: "Learn and adapt",
        text: "Find out how the project tracks risks, progress and results, and how plans are changed when circumstances move.",
      },
    ],
    routes: [
      p(
        "The National Careers Service lists university, apprenticeship, work-based and direct-entry routes for business project management. It also describes moving from project support into management. Those routes are guidance for that occupation, not a guarantee that one qualification meets every conservation or engineering employer's needs.",
        "ncs-project",
      ),
      p(
        "Our suggestion is to build experience of a defined piece of delivery before seeking broader responsibility. Ask for opportunities to plan work, track commitments and report progress, then record what you learned.",
      ),
    ],
    skills: [
      {
        title: "Show delivery",
        text: "Prepare an example of work you planned and completed, including constraints, changes and the result.",
      },
      {
        title: "Explain judgement",
        text: "Show how you made priorities clear, raised risks and used evidence to support a decision.",
      },
      {
        title: "Respect the specialism",
        text: "Identify the environmental, construction, procurement or regulatory knowledge stated in the advert. General project skills do not replace it.",
      },
    ],
    progression: [
      p(
        "The National Careers Service describes possible moves into senior project management, consultancy and operations management. These are options rather than a fixed promotion ladder. Compare the responsibilities you want next, including technical leadership, people management and oversight of several projects.",
        "ncs-project",
      ),
    ],
    scope:
      "These openings explicitly name project-manager roles, including senior and specialist variants. Project Officers have a separate guide and filter. Ambiguous combined occupations remain outside this family until reviewed. Read the original advert for the employer's exact responsibilities and technical requirements.",
    questions: [
      {
        title: "Do I need to be an ecologist?",
        text: "There is no single answer for every project. Check whether the employer requires technical ecology expertise, general project delivery experience or both. Do not assume a management title removes specialist requirements.",
      },
      {
        title: "Does this include construction projects?",
        text: "An explicit project-manager title can belong to this family even when the project involves capital works. The guide does not imply that construction and habitat projects have identical entry requirements.",
      },
    ],
  }),
  career({
    slug: "project-officer",
    name: "project officer",
    article: "a",
    description:
      "Help conservation projects move from plans into practical work. Explore project-officer responsibilities, useful experience and ways to prepare for your next opportunity.",
    image: "/images/sectors/rivers-water-hydrology.png",
    imageAlt: "Illustration representing practical river-restoration work",
    sources: [research.natureProject, research.ncsProject, research.apm],
    overviewTitle: "Make a practical contribution to a shared goal",
    overview: [
      p(
        "Project Officer is a title used in our advert sample for work such as restoration, partnership development and community-facing delivery. It is not treated here as a synonym for Project Manager. Compare the authority, outputs and experience expected in each original advert before judging its level.",
      ),
    ],
    workTitle: "Understand the work behind the title",
    work: [
      p(
        "Green Jobs for Nature explains that environmental projects bring together defined outcomes and different stakeholders. That context helps you read an officer vacancy, but its project-manager profile does not establish the responsibilities of every officer post.",
        "nature-project",
      ),
    ],
    tasks: [
      {
        title: "Deliver a defined contribution",
        text: "Identify the activities, outputs or places you would be responsible for and the support available.",
      },
      {
        title: "Work with partners",
        text: "Check which landowners, volunteers, communities or organisations the project involves and what you would do with them.",
      },
      {
        title: "Keep useful records",
        text: "Look for the reporting, scheduling, evidence or administrative tasks needed alongside practical delivery.",
      },
    ],
    routes: [
      p(
        "There is no universal Project Officer entry route in the sources used here. Use the requirements of the actual conservation project to choose relevant technical study, practical experience or project-support work.",
      ),
      p(
        "The National Careers Service describes project-support experience as one possible route towards project management. It does not mean every officer job is an entry-level post, or that a particular qualification is compulsory for all of them.",
        "ncs-project",
      ),
    ],
    skills: [
      {
        title: "Make ownership clear",
        text: "Record a task you took responsibility for, the people involved and how you knew it was complete.",
      },
      {
        title: "Connect detail to purpose",
        text: "Explain how accurate records, practical work or partnership activities contributed to the wider project.",
      },
      {
        title: "Check the level",
        text: "Some officer adverts expect substantial specialist experience. Compare duties rather than assuming the title means junior.",
      },
    ],
    progression: [
      p(
        "Our suggested approach is to build competence in the work first, then decide whether you want deeper technical responsibility, coordination or project management. Ask a prospective employer about supervision and development rather than assuming the title guarantees a particular next step.",
      ),
    ],
    scope:
      "These roles explicitly name Project Officer or Senior Project Officer. Project Managers are listed separately. Mixed ecology or consultancy titles are held for review rather than silently added to this family. Read each advert for its actual level, duties and technical requirements.",
    questions: [
      {
        title: "Is Project Officer always an entry-level job?",
        text: "No. The original adverts can ask for different levels of experience. Read the responsibilities, essential criteria and reporting arrangements before deciding whether a role is suitable.",
      },
      {
        title: "Is this the same as Project Manager?",
        text: "We keep the two title families separate. Their work can overlap, but an advert's scope and authority matter more than assuming the words mean the same thing.",
      },
    ],
  }),
  career({
    slug: "environmental-educator",
    name: "environmental educator",
    article: "an",
    description:
      "Help people connect with the natural world and understand how to protect it. Explore environmental education, the settings you could work in and experience worth building.",
    image: "/images/sectors/environmental-education.png",
    imageAlt: "Illustration of nature-based learning outdoors",
    sources: [research.education, research.lantra, research.natureBridge],
    overviewTitle: "Make nature understandable and worth caring for",
    overview: [
      p(
        "Green Jobs for Nature describes environmental educators as helping people learn about nature, its importance and its protection. Work can be based at a reserve or delivered through visits to schools and other settings, with children or adults.",
        "nature-education",
      ),
    ],
    workTitle: "Start with the people who will be learning",
    work: [
      p(
        "The same professional guide describes public, charity and private-sector settings, including outreach, events and contracted education. This is a varied occupation: compare the audience, setting and learning purpose in each vacancy.",
        "nature-education",
      ),
      p(
        "NatureBridge provides one US employer example of residential environmental science education in national parks. Its programme and employment arrangements illustrate a setting, rather than requirements for every educator or for UK employment.",
        "naturebridge-educators",
      ),
    ],
    tasks: [
      {
        title: "Plan for the audience",
        text: "Check learners' ages, needs and interests, and how you would adapt an activity for them.",
      },
      {
        title: "Explain clearly",
        text: "Look for the environmental topics and practical activities you would teach, and the depth of knowledge expected.",
      },
      {
        title: "Reflect on learning",
        text: "Ask how sessions are evaluated and what evidence helps the team improve its teaching.",
      },
    ],
    routes: [
      p(
        "Lantra provides occupation-specific training information for environmental Education Officers. Use that alongside the actual person specification: an environmental qualification, a teaching credential and outdoor-activity training address different needs and are not interchangeable.",
        "lantra-education",
      ),
      p(
        "Our suggestion is to gain supervised experience with the audience and activities that interest you. Ask the organisation which safeguarding, first-aid or activity qualifications apply to its work, rather than assuming one course covers every setting.",
      ),
    ],
    skills: [
      {
        title: "Show inclusive communication",
        text: "Prepare an example of adapting an explanation or activity so different people could take part.",
      },
      {
        title: "Demonstrate subject knowledge",
        text: "Explain an environmental topic accurately and acknowledge where you would need further specialist support.",
      },
      {
        title: "Learn from delivery",
        text: "Keep a short record of feedback, changes you made and what improved for the learners.",
      },
    ],
    progression: [
      p(
        "Our suggested approach is to compare roles by the balance of teaching, programme design and team responsibility. Decide whether you want to deepen your practice with learners or take on coordination, while checking the experience expected for that particular move.",
      ),
    ],
    scope:
      "This family includes explicit environmental or conservation educator titles, relevant Education Officer variants and outdoor-education instructors. It excludes programme-management, research learning-and-evaluation and education-director titles. Ambiguous naturalist or visitor-service roles need review before inclusion.",
    questions: [
      {
        title: "Do I need to be a qualified teacher?",
        text: "Check the specific advert. A school teaching post, a reserve education role and an outdoor-activity instructor can have different requirements. This guide does not claim one teaching qualification is compulsory for all environmental education.",
      },
      {
        title: "Are all these jobs in schools?",
        text: "No. The professional sources describe nature reserves, outreach and other learning settings as well as schools. Look closely at the audience and location in the vacancy.",
      },
    ],
  }),
  career({
    slug: "biologist",
    name: "biologist",
    article: "a",
    description:
      "Use biological evidence to understand living things and inform conservation. Explore the science, practical experience and different settings behind nature-focused biology roles.",
    image: "/images/sectors/marine-conservation.png",
    imageAlt: "Illustration representing the study of wildlife and aquatic environments",
    sources: [research.biology, research.wildlifeBiology, research.onet],
    overviewTitle: "Connect scientific questions with living systems",
    overview: [
      p(
        "The National Careers Service describes biologists as studying living things and their environments. Biology is broader than conservation; this guide focuses on the nature-related vacancies collected by WildJobs, rather than treating medical, laboratory and wildlife posts as interchangeable.",
        "ncs-biologist",
      ),
    ],
    workTitle: "Check the organism, ecosystem and method",
    work: [
      p(
        "The US Bureau of Labor Statistics describes wildlife-biologist work involving biological data, animal populations, human impacts and conservation plans, in field, office or laboratory settings. This describes US occupations and is not evidence of UK demand or a universal UK entry requirement.",
        "bls-wildlife",
      ),
      p(
        "O*NET lists examples including aquatic, fisheries, habitat and wildlife biologists. These help explain the breadth of title variants; they do not make every specialism the same job.",
        "onet-wildlife",
      ),
    ],
    tasks: [
      {
        title: "Gather reliable evidence",
        text: "Check the species, habitats, methods and field or laboratory work covered by the advert.",
      },
      {
        title: "Analyse with care",
        text: "Look for the data, software and statistical skills expected, including how uncertainty should be handled.",
      },
      {
        title: "Explain the implications",
        text: "Identify who needs the findings and what decisions, plans or reports your work would support.",
      },
    ],
    routes: [
      p(
        "The National Careers Service describes relevant university study and some work-based or apprenticeship routes into biology, with requirements depending on the specialism. Its laboratory-focused apprenticeship examples should not be assumed to qualify someone for every wildlife or field-biologist post.",
        "ncs-biologist",
      ),
      p(
        "Our suggestion is to compare methods and essential qualifications across several target adverts before choosing study. Check local professional and employer requirements for overseas roles; the current sample includes international vacancies.",
      ),
    ],
    skills: [
      {
        title: "Keep a methods record",
        text: "Describe what you measured, the protocol, supervision and limitations, rather than listing fieldwork without context.",
      },
      {
        title: "Show analytical judgement",
        text: "Prepare a clear example of interpreting data and explaining what the evidence can and cannot support.",
      },
      {
        title: "Recognise specialist boundaries",
        text: "Be accurate about the organisms, habitats, licences and techniques you know and those you are still learning.",
      },
    ],
    progression: [
      p(
        "The National Careers Service describes developing a specialism and moving into research, management or teaching. These are possible directions, not a fixed ladder. Consider whether your next step should deepen technical practice or add responsibility for other people's work.",
        "ncs-biologist",
      ),
    ],
    scope:
      "These vacancies explicitly name biologist roles, including wildlife, fisheries and habitat-related variants. Ecologists have their own family and guide. Combined biologist/regulatory-specialist titles remain for review. Different countries and specialisms can have different requirements; mixed-grade adverts are excluded from comparable salary figures.",
    questions: [
      {
        title: "Is a biologist the same as an ecologist?",
        text: "The work can overlap, but our directory keeps explicit biologist and ecologist title families separate. Read the duties, study subject and methods before deciding whether your experience fits.",
      },
      {
        title: "Does the guide cover overseas jobs?",
        text: "The advert sample includes international vacancies. The National Careers Service source concerns UK routes, while the US sources are labelled as such. Only qualifying UK annual salaries contribute to the salary median.",
      },
    ],
  }),
  career({
    slug: "chief-executive",
    name: "chief executive",
    article: "a",
    description:
      "Lead an organisation with a clear purpose for nature. Explore charity chief-executive and executive-director roles, the responsibilities involved and how to assess your readiness.",
    image: "/images/sectors/policy-campaigning.png",
    imageAlt: "Illustration representing people working together for environmental change",
    sources: [research.ncvo, research.nonprofits],
    overviewTitle: "Take responsibility for the organisation's purpose",
    overview: [
      p(
        "NCVO describes the chief executive as a charity's most senior member of staff, leading day-to-day work, managing the team and reporting to the board. The role varies with the organisation's size, income and activities.",
        "ncvo-chief",
      ),
    ],
    workTitle: "Connect leadership with accountability",
    work: [
      p(
        "NCVO emphasises agreeing what the board delegates, setting expectations and reporting progress against strategy. Chief-executive leadership is distinct from the board's oversight; read the actual reporting and decision-making arrangements.",
        "ncvo-chief",
      ),
      p(
        "The US National Council of Nonprofits uses CEO and executive director for the senior manager appointed and supervised by a nonprofit board. That supports the terminology used in this international sample, rather than making every director or trustee a chief executive.",
        "nonprofits-board",
      ),
    ],
    tasks: [
      {
        title: "Understand the mandate",
        text: "Check the organisation's purpose, current priorities and the authority delegated to the role.",
      },
      {
        title: "Assess the scale",
        text: "Look at the team, funding, partnerships and operational responsibilities you would lead.",
      },
      {
        title: "Explain accountability",
        text: "Ask what the board expects to see, how progress is evaluated and where decisions need approval.",
      },
    ],
    routes: [
      p(
        "There is no universal chief-executive qualification established by the sources used here. Our suggestion is to compare the leadership record and sector knowledge required by real adverts, and distinguish experience of one function from responsibility for an entire organisation.",
      ),
      p(
        "For a move into conservation leadership, prepare evidence of how you connect organisational decisions with the mission and the people affected. Ask what specialist support and governance arrangements are in place, rather than assuming the chief executive personally supplies every technical skill.",
      ),
    ],
    skills: [
      {
        title: "Show leadership in context",
        text: "Explain the team, budget or responsibility you held and a decision for which you were accountable.",
      },
      {
        title: "Connect strategy to delivery",
        text: "Prepare an example of turning a priority into practical work and using evidence to assess progress.",
      },
      {
        title: "Ask informed questions",
        text: "Investigate the organisation's expectations, resources and working relationships as carefully as you prepare your application.",
      },
    ],
    progression: [
      p(
        "Our suggested approach is to assess the scope of the role rather than chase a larger title. An organisation's size, funding and purpose can change the work considerably. Consider the responsibilities you want and where your leadership experience is relevant, including whether a different functional or operational role is a better next step.",
      ),
    ],
    scope:
      "This family groups Chief Executive, CEO and Executive Director titles used for organisational leadership. Other directors, board trustees and executive assistants are not automatically included. Read each advert to confirm its authority and reporting line, especially across countries.",
    questions: [
      {
        title: "Are all director jobs included?",
        text: "No. A director can lead a department or serve on a board. This guide groups explicit chief-executive and executive-director titles, and uncertain titles need a role-mapping review.",
      },
      {
        title: "Is this an entry-level conservation role?",
        text: "Treat it as an organisational leadership opportunity and assess the experience the employer asks for. A career course can help you plan a move, but does not substitute for a relevant leadership record.",
      },
    ],
  }),
];
