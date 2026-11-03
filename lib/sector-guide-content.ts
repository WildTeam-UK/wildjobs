import type { GuideContent } from "./guide-content";
import { guideSectorLabels, guideSectorMatchSlug, type SectorGuideSlug } from "./guide-sectors";

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
  energy: source(
    "energy-institute",
    "Energy Institute · Careers",
    "https://energyinst.org/membership-and-careers/careers",
    "The range of energy occupations and routes through study, company training and career changes",
  ),
  engineer: source(
    "ncs-energy",
    "National Careers Service · Renewable energy engineer",
    "https://nationalcareers.service.gov.uk/job-profiles/energy-engineer",
    "The purpose and degree-based entry routes of renewable energy engineering, rather than every climate role",
  ),
  ecology: source(
    "ncs-ecologist",
    "National Careers Service · Ecologist",
    "https://nationalcareers.service.gov.uk/job-profiles/ecologist",
    "Ecological duties, working environments, skills and occupation-specific entry routes",
  ),
  cieem: source(
    "cieem-careers",
    "CIEEM · Careers in ecology and environmental management",
    "https://cieem.net/i-want-to-be/how-to-become-an-eem/careers/",
    "Careers across statutory agencies, NGOs, consultancy, industry, research, media and teaching",
  ),
  educator: source(
    "nature-educator",
    "Green Jobs for Nature · Environmental educator",
    "https://greenjobsfornature.org/careers/environment-educator/",
    "Environmental learning with children and adults, site-based and visiting education work, and different employer settings",
  ),
  adviser: source(
    "nature-adviser",
    "Green Jobs for Nature · Environmental adviser",
    "https://greenjobsfornature.org/careers/adviser/",
    "Land-management advice, surveys and management plans, collaboration and examples of different career routes",
  ),
  consultant: source(
    "ncs-consultant",
    "National Careers Service · Environmental consultant",
    "https://nationalcareers.service.gov.uk/job-profiles/environmental-consultant",
    "Environmental consultancy topics and university and apprenticeship routes for that occupation",
  ),
  farmer: source(
    "ncs-farmer",
    "National Careers Service · Farmer",
    "https://nationalcareers.service.gov.uk/job-profiles/farmer",
    "Crop and livestock production, farm management responsibilities and study, apprenticeship and work-based routes",
  ),
  horticulture: source(
    "ncs-horticulture",
    "National Careers Service · Horticultural manager",
    "https://nationalcareers.service.gov.uk/job-profiles/horticultural-manager",
    "Horticultural settings and routes through study, apprenticeships and work experience",
  ),
  marine: source(
    "mba-work",
    "Marine Biological Association · Working with us",
    "https://www.mba.ac.uk/about-us/working-with-us/",
    "A concrete marine-research employer example, including scientific, technical and organisational work",
  ),
  practical: source(
    "nature-conservation-worker",
    "Green Jobs for Nature · Conservation worker",
    "https://greenjobsfornature.org/careers/conservation-worker/",
    "Practical conservation in coastal and other habitats, visitor work and examples of varied entry routes",
  ),
  policy: source(
    "nature-policy",
    "Green Jobs for Nature · Policy and law roles",
    "https://greenjobsfornature.org/careers/policy/",
    "Evidence-based environmental policy in government, statutory bodies and NGOs",
  ),
  communications: source(
    "nature-comms",
    "Green Jobs for Nature · Media and communications roles",
    "https://greenjobsfornature.org/careers/media-and-communications/",
    "Environmental communications, public engagement and NGO campaign work",
  ),
  hydrology: source(
    "ncs-hydrologist",
    "National Careers Service · Hydrologist",
    "https://nationalcareers.service.gov.uk/job-profiles/hydrologist",
    "Water-system research, flood and drought analysis, working environments and hydrologist entry routes",
  ),
  sustainabilityManager: source(
    "hub-sustainability-manager",
    "Green Careers Hub · Sustainability manager and head of sustainability",
    "https://www.greencareershub.com/find-your-green-role/job-profiles/sustainability-manager-head-of-sustainability/",
    "Organisational sustainability responsibilities, collaboration and the distinction between project and strategic leadership",
  ),
  sustainabilityAnalyst: source(
    "hub-sustainability-analyst",
    "Green Careers Hub · Sustainability analyst",
    "https://www.greencareershub.com/find-your-green-role/job-profiles/sustainability-analyst/",
    "Analysis, reporting and communication in sustainability work, and role-specific routes through qualifications or experience",
  ),
  transport: source(
    "tps-careers",
    "Transport Planning Society · Careers",
    "https://tps.org.uk/profession/careers",
    "Transport planning, sustainable travel, multidisciplinary skills, employers and professional development",
  ),
  planner: source(
    "ncs-transport",
    "National Careers Service · Transport planner",
    "https://nationalcareers.service.gov.uk/job-profiles/transport-planner",
    "University and apprenticeship routes for transport planning, and professional development organisations",
  ),
};

type SectorDraft = {
  slug: Exclude<SectorGuideSlug, "wildlife-conservation">;
  title: string;
  accent: string;
  description: string;
  sources: GuideContent["sources"];
  overviewTitle: string;
  overview: Paragraph[];
  workTitle: string;
  work: Paragraph[];
  areas: Item[];
  routeTitle: string;
  routes: Paragraph[];
  skillsTitle: string;
  skills: Item[];
  questions: Item[];
};

// Only the recurring editorial structure is shared. Sector advice and citations
// are authored separately; statistics and advert examples always come from data.
function sector(draft: SectorDraft): GuideContent {
  const label = guideSectorLabels[draft.slug];
  return {
    slug: draft.slug,
    kind: "sector",
    matchSlug: guideSectorMatchSlug(draft.slug),
    version: 1,
    title: draft.title,
    accent: draft.accent,
    description: draft.description,
    image: `/images/sectors/${draft.slug}.png`,
    imageAlt: `Illustration representing ${label.toLowerCase()}`,
    sources: draft.sources,
    sections: [
      {
        id: "sector-overview",
        label: "The sector at a glance",
        title: draft.overviewTitle,
        paragraphs: draft.overview,
      },
      {
        id: "the-work",
        label: "Where you could contribute",
        title: draft.workTitle,
        paragraphs: draft.work,
        cards: draft.areas,
      },
      {
        id: "roles",
        label: "Roles in the advert sample",
        title: "See the work behind the sector label",
        paragraphs: [
          p(
            "The examples below come from matching adverts in our collected sample. Sector tags describe the work or organisation, rather than one occupation: specialist and support roles can appear together. These are examples, not a ranking of the most common careers. Read each original advert for its location, duties and requirements.",
          ),
        ],
        module: "roles",
      },
      { id: "routes-in", label: "Routes into the sector", title: draft.routeTitle, paragraphs: draft.routes },
      {
        id: "skills",
        label: "Build relevant experience",
        title: draft.skillsTitle,
        paragraphs: [
          p(
            "Our suggested approach is to choose the kind of work first, then build evidence of the tasks you can do. Use the ideas below as application and development prompts, rather than a universal person specification.",
          ),
        ],
        bullets: draft.skills,
      },
      {
        id: "sector-pay",
        label: "Pay and working patterns",
        title: "Put advertised pay in context",
        paragraphs: [
          p(
            `This ${label} sample includes different occupations, levels and countries. Its salary figure uses only comparable UK full-time annual pay. A sector median is a broad summary, not a starting salary for every role; where fewer than five salaries qualify, we withhold it rather than fill the gap with estimates.`,
          ),
        ],
        module: "market",
      },
      {
        id: "training",
        label: "Develop your skills",
        title: "Choose learning that helps with the work",
        paragraphs: [
          p(
            "Use the original person specification to identify what you need to learn. WildTeam training can support project, planning and communication skills, but does not replace technical training, professional qualifications, licences or supervised practice required for a particular job. Check course content against your own development goal.",
          ),
        ],
        module: "courses",
      },
      {
        id: "career-plan",
        label: "Plan your next step",
        title: "Turn your interest into a practical plan",
        paragraphs: [],
        module: "career-course",
      },
      {
        id: "jobs",
        label: "Current opportunities",
        title: `Explore ${label.toLowerCase()} jobs`,
        paragraphs: [
          p(
            `These are currently open directory listings tagged ${label}. The source adverts remain authoritative for pay, working arrangements, eligibility and how to apply. Follow the filtered directory link to compare all matching openings.`,
          ),
        ],
        module: "jobs",
      },
      {
        id: "questions",
        label: "Questions and next steps",
        title: "Make an informed next move",
        paragraphs: [],
        faqs: draft.questions,
      },
    ],
  };
}

export const additionalSectorGuides: readonly GuideContent[] = [
  sector({
    slug: "carbon-climate-energy",
    title: "Carbon, Climate &",
    accent: "Energy",
    description:
      "Help turn climate ambition into practical change. Explore technical, analytical and people-focused work across carbon, climate and energy.",
    sources: [research.energy, research.engineer],
    overviewTitle: "Find your contribution to a lower-carbon future",
    overview: [
      p(
        "Energy careers extend beyond generation equipment. The Energy Institute describes engineering, energy management, scientific research and environmental work, with people entering from education or moving across from other careers. Treat this as a collection of different specialisms, not a single job ladder.",
        "energy-institute",
      ),
      p(
        "Our suggestion is to decide which part of the problem interests you: understanding energy use, developing a project, engaging a community or supporting a technical team. Then check what the employer actually delivers. A climate-related title alone does not tell you the role’s responsibilities or environmental outcomes.",
      ),
    ],
    workTitle: "Connect technical solutions with people and delivery",
    work: [
      p(
        "The National Careers Service describes renewable energy engineers developing ways to generate power from resources including wind and solar. That is one technical occupation within this broader sector; its education requirements should not be applied to outreach, policy, administration or project posts.",
        "ncs-energy",
      ),
    ],
    areas: [
      {
        title: "Energy projects",
        text: "Compare posts supporting the design, coordination or operation of energy projects; check the technical responsibility attached to each.",
      },
      {
        title: "Carbon and evidence",
        text: "Look for the data, methods and reporting outputs the employer expects, and how those outputs support decisions.",
      },
      {
        title: "Communities and delivery",
        text: "Investigate roles that connect energy services with households, partners and project teams.",
      },
    ],
    routeTitle: "Choose a route for the contribution you want to make",
    routes: [
      p(
        "The Energy Institute points to university programmes, apprenticeships and company training, as well as career changes. In contrast, the National Careers Service’s renewable energy engineer profile focuses on relevant engineering or science degrees. The appropriate route depends on the occupation and employer, not the sector label.",
        "energy-institute",
        "ncs-energy",
      ),
      p(
        "Our approach is to compare a technical vacancy with a delivery or engagement vacancy before investing in training. Identify which existing skills transfer and which technical gaps need formal study or supervised experience. Ask providers what practical work their programme covers, rather than choosing on its title alone.",
      ),
    ],
    skillsTitle: "Show how you turn a complex problem into useful action",
    skills: [
      {
        title: "Explain your evidence",
        text: "Prepare an example showing where your data came from, the assumptions you used and the limits of your conclusion. Be precise about which tools or methods you have actually used.",
      },
      {
        title: "Make delivery visible",
        text: "Describe your part in coordinating a budget, timetable, partner relationship or service. Explain what changed because of your work and what you would improve next time.",
      },
      {
        title: "Understand the audience",
        text: "For community-facing work, show how you listened, adapted information and checked understanding. For technical work, explain how you communicated findings to the people making decisions.",
      },
    ],
    questions: [
      {
        title: "Do I need an engineering degree?",
        text: "The renewable energy engineer profile describes degree-based entry, but that does not establish a requirement for the whole sector. Compare the specific occupation and person specification for the work you want.",
      },
      {
        title: "Does a climate-related title prove a role’s impact?",
        text: "No. Ask what the organisation is trying to change, what the role contributes and how outcomes are assessed. Our sector tag is a discovery aid, rather than a verification of an employer’s environmental claims.",
      },
    ],
  }),
  sector({
    slug: "ecology",
    title: "Careers in",
    accent: "Ecology",
    description:
      "Turn observations into evidence for nature. Explore the organisations, specialisms and practical routes that make up the ecology sector.",
    sources: [research.ecology, research.cieem],
    overviewTitle: "Understand nature and help people act on the evidence",
    overview: [
      p(
        "Ecology studies how living things relate to their environment. The National Careers Service describes work that can include analysing ecological data, investigating the effects of development and farming, and advising on conservation. Field observations are part of a wider process of interpretation and communication.",
        "ncs-ecologist",
      ),
      p(
        "An Ecology sector search is broader than a search for the occupation Ecologist. It can include people coordinating ecological projects, managing teams or supporting research and delivery. Use the ecologist career guide when you want to examine that particular occupation and its different levels.",
      ),
    ],
    workTitle: "Explore the setting as well as the specialism",
    work: [
      p(
        "CIEEM identifies career settings including statutory agencies, local government, NGOs, consultancy, industry, research and teaching. The National Careers Service also describes office, laboratory, university and countryside environments. Work in ecology is not necessarily an entirely outdoor job.",
        "cieem-careers",
        "ncs-ecologist",
      ),
    ],
    areas: [
      {
        title: "Survey and interpretation",
        text: "Compare the habitats, species, methods and level of independent judgement described in technical adverts.",
      },
      {
        title: "Advice and projects",
        text: "Look at who commissions the work, who uses the evidence and how recommendations become practical decisions.",
      },
      {
        title: "Research and coordination",
        text: "Explore scientific, data, project and team-support opportunities alongside posts with Ecologist in the title.",
      },
    ],
    routeTitle: "Match your development to a particular ecology role",
    routes: [
      p(
        "The National Careers Service describes relevant university study and an ecology apprenticeship route for ecologists. Those are occupation-specific pathways. Check provider availability, the employer’s entry requirements and the support offered for developing practical competence before choosing a route.",
        "ncs-ecologist",
      ),
      p(
        "Our suggestion is to keep a record of surveys, analysis or project work you have contributed to, including your supervision and limitations. If you are changing careers, compare your existing analytical, communication or coordination experience with the exact requirements of several suitable openings.",
      ),
    ],
    skillsTitle: "Demonstrate care with evidence and clarity about your level",
    skills: [
      {
        title: "Record methods and limits",
        text: "Describe what you observed, how you collected the information and any uncertainty. Keep examples that make your reasoning visible, rather than listing only the name of a survey or software package.",
      },
      {
        title: "Communicate a conclusion",
        text: "Practise explaining a finding to a non-specialist audience. Show how you distinguish the evidence from an assumption and how your advice relates to the decision being made.",
      },
      {
        title: "Identify appropriate supervision",
        text: "Be clear about tasks you can do independently and those requiring guidance or further training. Compare the actual responsibilities of assistant, consultant and senior openings before deciding which level fits.",
      },
    ],
    questions: [
      {
        title: "Is the sector guide the same as the Ecologist guide?",
        text: "No. This page covers the wider Ecology sector and its organisations and work. The Ecologist career guide follows a specific family of job titles, with a more focused advert and salary sample.",
      },
      {
        title: "Will every ecology vacancy involve field surveys?",
        text: "No. Read the advertised balance of fieldwork, analysis, reporting, research and management. Job location, travel and working hours should be checked in the original advert.",
      },
    ],
  }),
  sector({
    slug: "environmental-education",
    title: "Environmental",
    accent: "Education",
    description:
      "Help people understand and care for the natural world. Explore environmental learning, engagement and outreach work, and the skills behind it.",
    sources: [research.educator, research.cieem],
    overviewTitle: "Make nature understandable, relevant and accessible",
    overview: [
      p(
        "Environmental educators help children and adults learn about nature and its protection. Green Jobs for Nature describes work on reserves and protected sites, as well as visiting schools or delivering education on land managed by others. The setting and audience shape what the role involves.",
        "nature-educator",
      ),
      p(
        "Start by asking who you want to work with and what you want them to understand or do. Teaching a field session, coordinating a volunteer programme and developing public engagement materials involve different responsibilities, even when they sit within the same organisation.",
      ),
    ],
    workTitle: "Think about the learner, the place and the programme",
    work: [
      p(
        "Green Jobs for Nature gives examples of educators in NGOs, public bodies and private organisations, including outreach and site-based programmes. CIEEM also lists teaching among the careers connected with ecology and environmental management. These sources describe possibilities, rather than a requirement to follow one teaching route.",
        "nature-educator",
        "cieem-careers",
      ),
    ],
    areas: [
      {
        title: "Learning and activities",
        text: "Look for the age groups, session formats and environmental subjects covered by a learning or education post.",
      },
      {
        title: "Community participation",
        text: "Explore work connecting volunteers, local groups and environmental projects, and check what responsibility the role has for those relationships.",
      },
      {
        title: "Programme support",
        text: "Consider how planning, bookings, resources and evaluation help learning activities run well, alongside the people delivering sessions.",
      },
    ],
    routeTitle: "Investigate the requirements of your chosen setting",
    routes: [
      p(
        "Our suggested approach is to compare several adverts for the same audience or setting. Record whether they request teaching qualifications, environmental knowledge, activity-delivery experience or particular checks. Do not assume that requirements for a school post apply unchanged to a visitor centre or community project.",
      ),
      p(
        "If you are new to this work, look for a manageable way to help plan, support or evaluate a learning activity with appropriate supervision. If you already teach or facilitate groups, identify the environmental subject knowledge and outdoor delivery experience your target role asks for.",
      ),
    ],
    skillsTitle: "Show how you help other people learn",
    skills: [
      {
        title: "Plan for an audience",
        text: "Prepare an example with a clear purpose, suitable activities and accessible language. Explain how you would adapt it for different needs or levels of prior knowledge, rather than simply repeating the same presentation.",
      },
      {
        title: "Reflect on delivery",
        text: "Describe how you checked understanding and responded when an activity did not work as expected. Show what feedback or observations informed your next session.",
      },
      {
        title: "Organise with care",
        text: "Use examples of planning resources, communicating with partners and following the relevant procedures for your setting. Be accurate about your own responsibility and supervision when working with groups.",
      },
    ],
    questions: [
      {
        title: "Do all environmental educators work in schools?",
        text: "No. The cited careers guidance includes reserves, outreach and services delivered to other organisations. Compare the audience and working environment in the original advert.",
      },
      {
        title: "Do I need a teaching qualification?",
        text: "There is no single answer for every post grouped here. Check the employer’s essential requirements, the type of learning being delivered and any professional requirements relevant to that setting.",
      },
    ],
  }),
  sector({
    slug: "environmental-management",
    title: "Environmental",
    accent: "Management",
    description:
      "Help organisations understand their impacts and make better decisions. Explore environmental advice, project delivery and practical management careers.",
    sources: [research.consultant, research.adviser],
    overviewTitle: "Connect environmental understanding with everyday decisions",
    overview: [
      p(
        "Environmental consultancy can address topics such as waste, flood risk and climate impacts, according to the National Careers Service. The broader Environmental Management sector also brings together different kinds of advice and delivery. Compare the subject area and the decisions a post supports, rather than assuming every vacancy is a management position.",
        "ncs-consultant",
      ),
      p(
        "Our suggestion is to separate subject knowledge from responsibility. A role may ask you to collect information, recommend actions, coordinate implementation or lead other specialists. Identify which of those tasks you want to develop before choosing a job title or qualification.",
      ),
    ],
    workTitle: "Move from evidence to plans that people can use",
    work: [
      p(
        "Green Jobs for Nature describes environmental advisers visiting sites, working with landowners and other partners, and preparing reports and management plans. That illustrates how technical evidence and relationships can sit within the same role; the exact balance depends on the employer and project.",
        "nature-adviser",
      ),
    ],
    areas: [
      {
        title: "Environmental advice",
        text: "Compare the questions an employer needs answered and the technical topics its advisers are expected to cover.",
      },
      {
        title: "Plans and delivery",
        text: "Investigate how recommendations become work programmes, and who coordinates priorities, resources and progress.",
      },
      {
        title: "Organisational practice",
        text: "Look for the responsibilities attached to processes, records, reporting and working with colleagues across an organisation.",
      },
    ],
    routeTitle: "Choose a route into a defined area of work",
    routes: [
      p(
        "The National Careers Service describes relevant university study and an Environmental Practitioner apprenticeship for environmental consultants. Green Jobs for Nature presents varied routes into environmental advice. These are examples for particular roles; they do not mean that all management, technical and support posts share the same entry requirements.",
        "ncs-consultant",
        "nature-adviser",
      ),
      p(
        "Our approach is to take a small group of realistic vacancies and separate technical requirements from transferable skills. Ask what training and supervision are provided. If you are moving from operations, research or project work, explain the environmental context you still need to learn alongside the experience you already bring.",
      ),
    ],
    skillsTitle: "Demonstrate sound judgement and dependable delivery",
    skills: [
      {
        title: "Turn information into a recommendation",
        text: "Use an example that explains the evidence, the options considered and why a particular action made sense. Be clear about uncertainty and when you sought specialist advice.",
      },
      {
        title: "Follow an action through",
        text: "Show how you agreed responsibilities, kept records and checked whether an action happened. Distinguish a written plan from the practical work needed to implement it.",
      },
      {
        title: "Work across perspectives",
        text: "Prepare a case where you listened to different priorities and made technical information usable. Explain your contribution to the decision without claiming responsibility for the whole team’s work.",
      },
    ],
    questions: [
      {
        title: "Does environmental management always mean managing staff?",
        text: "No. This sector groups subject matter and organisational work. Check whether a particular role manages people, projects, sites, systems or a specialist technical area.",
      },
      {
        title: "Is environmental management the same as sustainability?",
        text: "The categories overlap in our directory. Compare the actual focus and responsibilities of each vacancy; a sector tag is a discovery aid, not a fixed professional definition.",
      },
    ],
  }),
  sector({
    slug: "food-farming-horticulture",
    title: "Food, Farming &",
    accent: "Horticulture",
    description:
      "Work with plants, productive landscapes and the people who care for them. Explore the different careers connecting growing, farming and horticulture.",
    sources: [research.farmer, research.horticulture],
    overviewTitle: "Find your place between growing and land stewardship",
    overview: [
      p(
        "The National Careers Service distinguishes farming, involving crop or livestock production and business management, from horticultural management in settings such as nurseries, crop facilities, parks and gardens. These are different occupations within a broad group of land-based opportunities.",
        "ncs-farmer",
        "ncs-horticulture",
      ),
      p(
        "Our approach is to ask what is being grown or managed, how the land is used and what the role contributes. Do not assume that every food or farming post has the same environmental purpose. Read the organisation’s aims and the tasks you would actually undertake.",
      ),
    ],
    workTitle: "Explore the scale, setting and purpose of the work",
    work: [
      p(
        "Farm management can involve production, budgets, equipment and staff, while horticultural management spans several growing and visitor-facing settings. The National Careers Service profiles show why practical land-based skills and operational responsibilities need to be considered separately when comparing roles.",
        "ncs-farmer",
        "ncs-horticulture",
      ),
    ],
    areas: [
      {
        title: "Plants and growing spaces",
        text: "Compare the plants, sites, seasonal tasks and maintenance responsibilities described in gardening and horticultural adverts.",
      },
      {
        title: "Farms and land use",
        text: "Look at the balance of production, land care, advice and business responsibilities in each farming-related role.",
      },
      {
        title: "People and operations",
        text: "Explore how education, community work, coordination and leadership connect with the practical care of land and plants.",
      },
    ],
    routeTitle: "Build a route around the practical work you want to do",
    routes: [
      p(
        "Both National Careers Service profiles describe routes involving study, apprenticeships and working towards the occupation. Horticultural management also includes graduate training possibilities. Availability and entry requirements differ between programmes and employers; those examples do not create a single qualification requirement for the whole sector.",
        "ncs-farmer",
        "ncs-horticulture",
      ),
      p(
        "Our suggestion is to record the tasks, supervision and conditions in your practical experience. If you are considering a course, ask how much relevant practical work it includes. If you already have business or people-management experience, compare it with the land-based knowledge your target role requests.",
      ),
    ],
    skillsTitle: "Show care, observation and reliable organisation",
    skills: [
      {
        title: "Keep a practical record",
        text: "Describe what you cared for, the work you completed and how you monitored the result. Explain the season, site or production context where it matters, and the level of supervision you had.",
      },
      {
        title: "Connect a task with its purpose",
        text: "Explain why a growing or land-management decision was made and what evidence informed it. Separate outcomes you observed from benefits you hope might happen.",
      },
      {
        title: "Plan work realistically",
        text: "Use examples of coordinating time, tools, materials or people. Check each vacancy’s working conditions, travel and scheduling requirements before deciding whether it fits your circumstances.",
      },
    ],
    questions: [
      {
        title: "Are all farming and horticulture roles conservation jobs?",
        text: "No. This directory category brings related opportunities together, but their purposes vary. Examine the employer’s work and the duties of the role rather than treating the tag as proof of a conservation outcome.",
      },
      {
        title: "Can practical experience form part of my route in?",
        text: "The cited occupational profiles include work-based routes alongside formal study and apprenticeships. Check what your target employer accepts and which capabilities need further training or supervision.",
      },
    ],
  }),
  sector({
    slug: "marine-conservation",
    title: "Marine",
    accent: "Conservation",
    description:
      "Help protect life in our seas and along our coasts. Explore marine science, practical conservation and the people and projects supporting the work.",
    sources: [research.marine, research.practical],
    overviewTitle: "Look beyond a single picture of working at sea",
    overview: [
      p(
        "Marine research is one part of this field. The Marine Biological Association provides a concrete employer example involving scientific research, technical support and organisational work. A marine organisation needs people with different contributions; not every post is a marine biologist role or involves working aboard a vessel.",
        "mba-work",
      ),
      p(
        "Our suggested starting point is to choose between investigating marine systems, supporting practical conservation, working with people or coordinating delivery. Then compare where that work happens. A coastal base, field site, laboratory and home-based project office can imply very different working arrangements.",
      ),
    ],
    workTitle: "Connect science, coastal places and project delivery",
    work: [
      p(
        "Green Jobs for Nature includes coastal locations among practical conservation settings, with tasks such as habitat care, monitoring, visitor engagement and volunteer activities. Read this alongside marine-research examples rather than assuming that one list of tasks describes every marine career.",
        "nature-conservation-worker",
        "mba-work",
      ),
    ],
    areas: [
      {
        title: "Science and evidence",
        text: "Compare the subjects, methods and qualifications specified in marine research, monitoring and technical posts.",
      },
      {
        title: "Coastal conservation",
        text: "Explore what the role does for a site or habitat and whether it involves practical work, coordination or public engagement.",
      },
      {
        title: "Projects and support",
        text: "Look at the administration, partnerships and delivery work supporting marine organisations, alongside specialist posts.",
      },
    ],
    routeTitle: "Investigate the route into a specific marine occupation",
    routes: [
      p(
        "Green Jobs for Nature describes several pathways into practical conservation, including vocational study, apprenticeships and applied degrees. Those examples should not be taken as the entry requirements for marine research, fisheries enforcement or other specialist occupations. Check the original person specification and the relevant training provider.",
        "nature-conservation-worker",
      ),
      p(
        "Our approach is to compare the working conditions as carefully as the subject matter. Ask about travel, time away, supervision and any practical qualifications needed for the advertised duties. Do not assume you need diving or vessel qualifications unless the role actually requires them.",
      ),
    ],
    skillsTitle: "Demonstrate a contribution that fits the setting",
    skills: [
      {
        title: "Record evidence carefully",
        text: "For science or monitoring work, describe your methods, data quality checks and limitations. Be accurate about your role in collecting information and what you can interpret independently.",
      },
      {
        title: "Coordinate across partners",
        text: "Prepare an example of organising information, schedules or relationships. Explain how you helped others carry out their work, rather than presenting a whole programme as your individual achievement.",
      },
      {
        title: "Check practical requirements",
        text: "Match your actual training and experience to the advertised environment. Ask about supervision and access requirements early, and be clear about any experience you still need to develop.",
      },
    ],
    questions: [
      {
        title: "Do all marine conservation jobs involve diving?",
        text: "No. The sector includes different kinds of scientific, practical, engagement and support work. Check the duties and any specific qualifications in the original advert.",
      },
      {
        title: "Why might this guide not show a salary median?",
        text: "The sample can include overseas, part-time and differently paid opportunities. We only show a median from at least five comparable UK full-time annual salaries, so a useful advert sample can still have too little comparable pay data.",
      },
    ],
  }),
  sector({
    slug: "policy-campaigning",
    title: "Policy &",
    accent: "Campaigning",
    description:
      "Help turn environmental evidence into decisions and public action. Explore policy, advocacy and campaigning work, and the skills each contribution needs.",
    sources: [research.policy, research.communications],
    overviewTitle: "Understand who you want to influence and why",
    overview: [
      p(
        "Green Jobs for Nature distinguishes policy work in government and statutory bodies from NGO work seeking to influence decision-makers. Both use evidence, but their responsibilities and priorities differ. Researching a policy option, advising an institution and mobilising supporters are related contributions rather than identical jobs.",
        "nature-policy",
      ),
      p(
        "Our approach is to begin with the decision or change a team is trying to achieve. Ask who the audience is, what the role contributes and how its work is assessed. Then compare whether your strengths fit analysis, relationships, public communications or organising delivery.",
      ),
    ],
    workTitle: "Connect evidence, communication and participation",
    work: [
      p(
        "The communications profiles on Green Jobs for Nature include public information, media content, social channels and NGO campaigns. Its policy profiles describe drawing on research and practical evidence to shape environmental decisions. A post may combine these activities, but a campaigning role should not automatically be treated as a legal profession.",
        "nature-comms",
        "nature-policy",
      ),
    ],
    areas: [
      {
        title: "Research and policy",
        text: "Compare the subjects, audiences and written outputs expected in policy and public-affairs posts.",
      },
      {
        title: "Campaigns and communications",
        text: "Explore how a team develops messages, reaches an audience and organises activities around a stated objective.",
      },
      {
        title: "Partnerships and participation",
        text: "Look at roles connecting supporters, communities and organisations, and the responsibility attached to those relationships.",
      },
    ],
    routeTitle: "Separate subject expertise from professional requirements",
    routes: [
      p(
        "Our suggestion is to compare several adverts within one function, such as policy research or digital campaigning. Record the requested subject knowledge, writing, analytical tools and relationship experience. If a role is a qualified legal position, check the professional requirements for its jurisdiction rather than applying general campaigning advice.",
      ),
      p(
        "For a career change, identify a piece of work you can explain clearly: a briefing, a consultation response, a communications plan or a coordinated activity. Show how you used reliable evidence, understood the audience and reflected on the result. Be clear about which parts were your own contribution.",
      ),
    ],
    skillsTitle: "Make a clear case without overstating the evidence",
    skills: [
      {
        title: "Write for a decision",
        text: "Practise a concise briefing that identifies the issue, evidence, options and limitations. Check the source of a claim and distinguish a finding from an opinion or recommendation.",
      },
      {
        title: "Understand an audience",
        text: "Explain how you adapted a message or activity to the people you wanted to reach. Describe how you listened and checked the response rather than relying only on the volume of content produced.",
      },
      {
        title: "Coordinate and learn",
        text: "Use an example of planning work across people or channels, reviewing progress and changing an approach. Treat response figures as evidence to interpret, not proof that one activity caused a policy change.",
      },
    ],
    questions: [
      {
        title: "Do I need a law degree to work in this sector?",
        text: "Policy, campaigning, communications and qualified legal roles are different occupations. Read each person specification; do not assume either that a law degree is universal or that a regulated legal post has no professional entry requirements.",
      },
      {
        title: "Can I move from communications or research?",
        text: "Compare your existing work with the role’s actual outputs and subject knowledge. Prepare examples that show both relevant transferable skills and how you would address any environmental-policy knowledge gaps.",
      },
    ],
  }),
  sector({
    slug: "rivers-water-hydrology",
    title: "Rivers, Water &",
    accent: "Hydrology",
    description:
      "Work with water, catchments and the communities connected to them. Explore hydrology, freshwater projects and practical environmental advice.",
    sources: [research.hydrology, research.adviser],
    overviewTitle: "Explore the connection between water, places and people",
    overview: [
      p(
        "Hydrologists investigate rainfall, rivers and groundwater to support water management. The National Careers Service describes work on flooding and drought, data and water samples, engineering projects and advice. That is a defined technical occupation within a broader set of water-related opportunities.",
        "ncs-hydrologist",
      ),
      p(
        "Our suggestion is to distinguish understanding water systems from coordinating a catchment project, advising land managers or engaging volunteers. These contributions can work together, but they ask for different evidence of competence. Use the role’s duties to decide what you want to develop.",
      ),
    ],
    workTitle: "Think across a catchment and across disciplines",
    work: [
      p(
        "Green Jobs for Nature includes rivers among the areas in which environmental advisers may specialise, with site visits, management plans and collaboration. The hydrologist profile also describes office, laboratory and countryside settings. Water-related work is therefore not confined to one kind of outdoor activity.",
        "nature-adviser",
        "ncs-hydrologist",
      ),
    ],
    areas: [
      {
        title: "Water evidence",
        text: "Compare the collection, analysis or modelling tasks expected in hydrology and monitoring posts.",
      },
      {
        title: "Catchment projects",
        text: "Look at the objectives, partners and delivery responsibilities in freshwater conservation and land-management projects.",
      },
      {
        title: "Advice and participation",
        text: "Explore how a role connects technical information with landowners, communities, volunteers or decision-makers.",
      },
    ],
    routeTitle: "Choose between technical specialism and wider project work",
    routes: [
      p(
        "The National Careers Service describes relevant degree study, apprenticeships followed by specialisation and work-based development for hydrology. Check current programme availability and employer requirements. These technical pathways should not be assumed to apply to every administration, engagement or delivery post in a water organisation.",
        "ncs-hydrologist",
      ),
      p(
        "Our approach is to compare the tasks and working conditions of a few suitable adverts. Ask what fieldwork, data skills, travel and supervision are involved. If you are new to a method or environment, look for a clear learning route rather than presenting an interest as practical competence.",
      ),
    ],
    skillsTitle: "Show how evidence supports a practical decision",
    skills: [
      {
        title: "Explain a dataset",
        text: "Describe what was measured, how records were checked and the limits of what they show. Keep collection, analysis and interpretation distinct when describing your contribution.",
      },
      {
        title: "See the project context",
        text: "Prepare an example of coordinating work across a place or group of partners. Explain how you identified dependencies, communicated progress and dealt with something that changed.",
      },
      {
        title: "Make information useful",
        text: "Practise explaining a technical finding to a non-specialist audience. Show how you understood their question and made the information relevant without removing important uncertainty.",
      },
    ],
    questions: [
      {
        title: "Is every water-related job a hydrologist role?",
        text: "No. This sector includes technical, practical, engagement and support opportunities. Compare the occupation and duties rather than relying on the sector title.",
      },
      {
        title: "Will I spend all my time outdoors?",
        text: "The cited hydrologist profile includes office, laboratory and countryside settings. The balance for your role depends on its methods, responsibilities and advertised working arrangements.",
      },
    ],
  }),
  sector({
    slug: "sustainability",
    title: "Careers in",
    accent: "Sustainability",
    description:
      "Help organisations turn sustainability goals into everyday decisions. Explore analytical, project and leadership work, and the skills behind it.",
    sources: [research.sustainabilityManager, research.sustainabilityAnalyst],
    overviewTitle: "Make organisational change concrete and measurable",
    overview: [
      p(
        "The Green Careers Hub describes sustainability analysts interpreting information about an organisation’s impacts and communicating recommendations. Its management profile describes working across teams and connecting sustainability with organisational decisions. The work can combine technical understanding with the ability to help others act.",
        "hub-sustainability-analyst",
        "hub-sustainability-manager",
      ),
      p(
        "Our suggested starting point is to identify the employer’s priorities and the role’s actual outputs. A broad sustainability title can conceal very different tasks. Ask what information, decisions or projects you would own, and how the organisation checks the quality of its claims and progress.",
      ),
    ],
    workTitle: "Compare analysis, implementation and leadership",
    work: [
      p(
        "The Green Careers Hub distinguishes managers responsible for particular projects from heads of sustainability with wider strategic oversight, while noting that scope varies with the organisation. Its analyst profile emphasises data, reports and accessible communication. Compare responsibility and independence as well as the title.",
        "hub-sustainability-manager",
        "hub-sustainability-analyst",
      ),
    ],
    areas: [
      {
        title: "Analysis and reporting",
        text: "Look for the data, methods and reporting outputs a role uses to understand impacts and inform decisions.",
      },
      {
        title: "Projects and collaboration",
        text: "Explore how sustainability work is carried out with colleagues, suppliers, customers and other partners.",
      },
      {
        title: "Strategy and coordination",
        text: "Compare the scope of a post: a defined project, a specialist subject, a programme or an organisation-wide responsibility.",
      },
    ],
    routeTitle: "Match your starting point to the level of responsibility",
    routes: [
      p(
        "The Green Careers Hub profiles discuss relevant qualifications, apprenticeship possibilities and experience in sustainability or business-related work. Their examples are role-specific rather than a single entry rule. Check the employer’s essential criteria and the precise content of a training programme before committing to it.",
        "hub-sustainability-analyst",
        "hub-sustainability-manager",
      ),
      p(
        "Our approach is to separate environmental subject knowledge from skills you may already use in analysis, operations, procurement or project work. Build a clear example of applying those skills to a relevant problem, and identify the methods or reporting knowledge you still need.",
      ),
    ],
    skillsTitle: "Combine careful analysis with the ability to work with others",
    skills: [
      {
        title: "Keep claims traceable",
        text: "Explain the source and boundaries of your information, what was measured and what remains uncertain. Avoid claiming a wider environmental outcome from a narrow activity measure.",
      },
      {
        title: "Build a useful recommendation",
        text: "Show how you moved from information to options and a practical next step. Relate your recommendation to the decision, constraints and audience involved.",
      },
      {
        title: "Make collaboration tangible",
        text: "Prepare an example of agreeing responsibilities, communicating progress or helping a team adopt a change. Explain your contribution and how you checked whether the approach was useful.",
      },
    ],
    questions: [
      {
        title: "Are sustainability roles only for environmental scientists?",
        text: "The cited profiles describe both technical and broader organisational capabilities. Check the actual role’s requirements and demonstrate relevant experience rather than assuming that any one degree either guarantees or prevents entry.",
      },
      {
        title: "Why can the advert count be much larger than the salary sample?",
        text: "Only paid UK adverts with comparable annual GBP salaries and explicit full-time evidence qualify for the median. International roles, pro rata pay and other pay periods can contribute useful job examples without contributing a comparable salary.",
      },
    ],
  }),
  sector({
    slug: "sustainable-transport",
    title: "Sustainable",
    accent: "Transport",
    description:
      "Help people make journeys that work better for communities and the environment. Explore transport planning, travel engagement and project delivery.",
    sources: [research.transport, research.planner],
    overviewTitle: "Connect better journeys with better places",
    overview: [
      p(
        "The Transport Planning Society describes work on policies, plans and projects for transport systems, including the relationship with land use and encouraging sustainable travel. It draws on several disciplines and involves communicating decisions to the public, stakeholders and decision-makers.",
        "tps-careers",
      ),
      p(
        "Our approach is to distinguish designing or assessing a transport proposal from helping people use different ways of travelling, or coordinating the work behind a project. These activities can share a goal while asking for different professional and practical experience.",
      ),
    ],
    workTitle: "Explore planning, participation and delivery",
    work: [
      p(
        "The Transport Planning Society describes employment across public, private, research and voluntary settings, with specialisms including modelling, travel planning and behaviour change. A sustainable-transport organisation can also advertise support roles. Read the function and responsibilities of each vacancy before choosing your route.",
        "tps-careers",
      ),
    ],
    areas: [
      {
        title: "Plans and evidence",
        text: "Compare posts assessing options, interpreting travel information or supporting the development of a transport proposal.",
      },
      {
        title: "People and journeys",
        text: "Explore engagement work and how a role helps a particular community or audience consider travel options.",
      },
      {
        title: "Project delivery",
        text: "Look at the coordination, partnerships and organisational support needed to turn a proposal or programme into practical work.",
      },
    ],
    routeTitle: "Find a route for the function you want to perform",
    routes: [
      p(
        "The National Careers Service describes university and apprenticeship routes into transport planning. The Transport Planning Society also explains employer-supported development and professional qualifications. Those pathways concern planning; they should not be applied automatically to engagement, administration, legal or other posts at a transport organisation.",
        "ncs-transport",
        "tps-careers",
      ),
      p(
        "Our suggestion is to compare the outputs of a few adverts before deciding on training. If you already work with communities, projects, data or place-based services, identify what transfers and which transport-specific knowledge your chosen role asks for. Ask employers about supervision and development support.",
      ),
    ],
    skillsTitle: "Explain how you connect evidence with people’s needs",
    skills: [
      {
        title: "Interpret an option",
        text: "Use a case that explains the problem, information available and options considered. Be clear about who a proposal affects and the limitations of the evidence used.",
      },
      {
        title: "Listen before proposing",
        text: "Describe how you learned about an audience’s needs and barriers, and adapted an activity or message. Explain how feedback changed your approach rather than assuming everyone experiences travel in the same way.",
      },
      {
        title: "Coordinate the next step",
        text: "Show how you organised work with colleagues or partners, recorded responsibilities and reviewed progress. Choose examples that match the scale and responsibility of the advertised post.",
      },
    ],
    questions: [
      {
        title: "Do I need a transport-planning qualification for every role?",
        text: "No. Planning, engagement, project support and qualified professional posts have different requirements. Check the exact occupation and person specification rather than treating the sector tag as an entry rule.",
      },
      {
        title: "Does a small sample mean there are few jobs in the whole sector?",
        text: "No. Our directory has limited feed coverage and a short collection history. A small number of collected adverts cannot establish the size of the market or a trend in demand.",
      },
    ],
  }),
];
