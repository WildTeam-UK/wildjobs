import type { Metadata } from "next";
import Link from "next/link";
import {
  ComparisonList,
  CourseTiles,
  ExampleJobs,
  ExampleStats,
  GuideContents,
  GuideSection,
  TemplatePhoto,
  TrainingBanner,
} from "@/components/templates/template-parts";

export const metadata: Metadata = {
  title: "How to become an ecologist — career guide",
  description:
    "Explore the work of an ecologist: the work, routes in, skills, salary context and practical next steps.",
};

const contents = [
  { id: "the-role", label: "The work & who it suits" },
  { id: "day-to-day", label: "A working day" },
  { id: "routes-in", label: "Routes into ecology" },
  { id: "skills", label: "Skills & experience" },
  { id: "salary", label: "Pay & working life" },
  { id: "progression", label: "Where it can take you" },
  { id: "applications", label: "Getting your application ready" },
  { id: "training", label: "Useful WildTeam training" },
  { id: "next-steps", label: "Your next three months" },
  { id: "jobs", label: "Current opportunities" },
  { id: "questions", label: "Questions & further reading" },
];

export default function EcologistGuideTemplate() {
  return (
    <main>
      <section className="tpl-hero shell">
        <div className="tpl-hero__grid">
          <div>
            <h1>
              Become an <span className="tpl-gradient">ecologist.</span>
            </h1>
            <p className="tpl-hero__lead">
              Turn your curiosity about wildlife into evidence that helps protect it. Explore the work, the
              routes in and the skills that can help you take your next step.
            </p>
            <div className="tpl-actions">
              <a className="action" href="#the-role">
                Find your route in <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <TemplatePhoto priority />
        </div>
      </section>

      <div className="shell">
        <ExampleStats
          items={[
            { value: "£34,500", label: "Median advertised salary", detail: "76 annual salaries" },
            { value: "286", label: "Jobs advertised in a year", detail: "Across the directory" },
            { value: "18", label: "Opportunities open now", detail: "Open for applications" },
            { value: "64", label: "Different employers", detail: "Charities, consultancies & more" },
          ]}
        />
      </div>

      <div className="shell tpl-editorial">
        <GuideContents items={contents} />
        <article className="tpl-article">
          <GuideSection
            id="the-role"
            number="01 · Understand the career"
            title="Give nature a voice in the decisions that matter."
          >
            <p>
              Ecologists investigate how living things interact with one another and with their environment.
              In practice, the work is often about turning observations into decisions: understanding a
              habitat, assessing a change, or helping a team decide where restoration will do the most good.
            </p>
            <p>
              Your workplace could be a consultancy, a conservation charity, a public body, a university or a
              land-management organisation in the{" "}
              <Link href="/conservation-sector/wildlife-conservation">Wildlife Conservation sector</Link>. Two
              people with the same job title may have very different weeks. One might be surveying a proposed
              development site; another could be analysing how a wetland is recovering or advising a reserve
              manager.
            </p>
            <div className="tpl-intro-note">
              <strong>Look beyond the job title.</strong>
              <p>
                Read what an employer actually needs you to deliver. “Ecologist” can describe field research,
                consultancy, habitat management and specialist advisory work. The responsibilities tell you
                more about the fit than the title alone.
              </p>
            </div>
            <h3>Would you enjoy the work?</h3>
            <p>
              This career may suit you if you enjoy asking careful questions, noticing detail and working with
              evidence. An interest in wildlife helps, but so does a willingness to write clearly, organise
              information and explain uncertainty. You may spend as much time preparing a report as you do
              collecting the observations behind it.
            </p>
            <p>
              Consider the practical side too. Some roles involve travelling between sites, changing plans
              with the weather, or working around seasonal survey windows. Others are more office-based. Think
              about the combination of tasks and working conditions that would be sustainable for you.
            </p>
          </GuideSection>

          <GuideSection
            id="day-to-day"
            number="02 · The everyday work"
            title="A field notebook. A spreadsheet. A conversation that changes a plan."
          >
            <p>
              There is no single typical day. A useful way to picture the role is as a cycle: prepare a
              question, gather reliable information, interpret what it means and help someone act on it.
            </p>
            <div className="tpl-feature-grid">
              <div className="tpl-feature-card">
                <span>01</span>
                <h3>Prepare & observe</h3>
                <p>
                  Review existing records, plan a visit, prepare equipment and record the habitats or species
                  relevant to the question.
                </p>
              </div>
              <div className="tpl-feature-card">
                <span>02</span>
                <h3>Analyse & explain</h3>
                <p>
                  Check records, work with maps or datasets, write up findings and explain their limitations
                  to colleagues or clients.
                </p>
              </div>
            </div>
            <p>
              Ecologists also work with people. You might discuss access with a landowner, coordinate with
              contractors, explain a finding to a project manager or contribute to a wider conservation plan.
              Clear notes, good communication and dependable follow-through are part of the science.
            </p>
            <h3>What to ask before you apply</h3>
            <ul>
              <li>How much of the role is fieldwork, analysis, reporting or project coordination?</li>
              <li>Which locations will you cover, and how will you travel between them?</li>
              <li>Who will supervise your work and help you build new competencies?</li>
              <li>How does the team plan for seasonal workloads and work outside usual hours?</li>
            </ul>
          </GuideSection>

          <GuideSection
            id="routes-in"
            number="03 · Find a route that fits"
            title="Build the foundations. Then make them practical."
          >
            <p>
              A relevant degree is a common route into professional ecology. Subjects can include ecology,
              environmental science, zoology, conservation biology or another closely related discipline. Some
              positions ask for postgraduate study; others place more emphasis on the practical competencies
              needed for the work.
            </p>
            <p>
              The right route depends on the kind of ecologist you want to become. Start by comparing a small
              set of actual entry-level adverts. Separate requirements that appear repeatedly from preferences
              that are specific to one employer. That gives you a more useful learning plan than trying to
              collect every possible qualification.
            </p>
            <div className="tpl-feature-grid">
              <div className="tpl-feature-card">
                <h3>Starting from study</h3>
                <p>
                  Use projects, placements and supervised fieldwork to connect your subject knowledge to
                  practical survey, analysis and reporting tasks. Keep evidence of your contribution.
                </p>
              </div>
              <div className="tpl-feature-card tpl-feature-card--pink">
                <h3>Changing careers</h3>
                <p>
                  Map what you already bring: data analysis, project delivery, writing, GIS or working with
                  communities. Then identify the ecology-specific knowledge and experience you still need.
                </p>
              </div>
            </div>
            <p>
              Apprenticeship routes may also be available, with entry requirements tied to the particular
              programme. Availability and eligibility change, so check current provider information rather
              than assuming that every route is open at every stage.
            </p>
            <p>
              A short professional course can complement your development. It is not a substitute for a
              qualification, technical competence or supervised experience that an employer explicitly
              requires. Look for learning that solves a clear gap in your plan.
            </p>
          </GuideSection>

          <GuideSection
            id="skills"
            number="04 · Turn interest into evidence"
            title="Skills you can show, not just list."
          >
            <p>
              Employers need to understand what you can do and how you work. Build a few strong accounts of
              your work that show how you have gathered information, checked its quality, explained your
              findings and worked responsibly with other people.
            </p>
            <ul className="tpl-pill-list">
              <li>Species & habitat knowledge</li>
              <li>Survey planning</li>
              <li>Data handling</li>
              <li>GIS & mapping</li>
              <li>Report writing</li>
              <li>Working with people</li>
            </ul>
            <h3>Develop your technical foundations</h3>
            <p>
              Choose a manageable focus. Practise identifying a group of species or describing a local
              habitat, and seek feedback from someone with relevant experience. Learn how records are
              organised and why consistent methods matter. A small, well-documented exercise is more useful
              than a broad claim that you are “good at fieldwork”.
            </p>
            <p>
              For analytical skills, practise turning a dataset into a clear question, checking it for errors
              and presenting an answer without overstating what the information can tell you. Mapping and
              spreadsheet skills can be developed through supervised projects, study or appropriately scoped
              personal work.
            </p>
            <h3>Find experience you can afford to sustain</h3>
            <p>
              Volunteering, paid seasonal work, placements and local recording groups can all provide
              opportunities to learn. Be clear about the supervision, time commitment, travel costs and
              responsibilities involved. More unpaid hours are not automatically better; focused experience
              with feedback can be more valuable than a long list of disconnected activities.
            </p>
            <p>
              Keep an evidence log. For each activity, record the task, your role, the method, what you
              produced and what you learnt. Ask before sharing any project material, site information or
              personal data in a portfolio.
            </p>
          </GuideSection>

          <TrainingBanner />

          <GuideSection id="salary" number="05 · Pay & working life" title="Understand the whole offer.">
            <p>
              Salary is one part of a role’s value. The work location, hours, contract length, travel
              expectations, supervision and development opportunities also shape what the job will be like.
              Compare roles at a similar level and with a similar working pattern.
            </p>
            <ComparisonList
              label="Annual advertised salaries by career stage"
              items={[
                {
                  title: "Assistant / early career",
                  description: "Build experience through supported surveys, mapping and reporting.",
                  valueLabel: "Advertised annual salary",
                  value: "£25,000–£30,000",
                },
                {
                  title: "Ecologist",
                  description:
                    "Take responsibility for independent delivery, analysis and ecological advice.",
                  valueLabel: "Advertised annual salary",
                  value: "£30,000–£39,000",
                },
                {
                  title: "Senior / specialist",
                  description: "Guide complex work, support colleagues and lead specialist decisions.",
                  valueLabel: "Advertised annual salary",
                  value: "£39,000–£50,000",
                },
              ]}
            />
            <p className="tpl-small">
              Compare annual advertised pay alongside working hours, experience and responsibilities. A median
              of published pay is not the average earnings of everyone working in ecology.
            </p>
            <h3>Questions worth asking at interview</h3>
            <p>
              Ask how the team handles seasonal peaks, overtime, travel time and fieldwork expenses. Find out
              what “hybrid” means for that particular job, rather than assuming it means the same number of
              home-working days each week. Clarify the support available for any technical skill you are still
              developing.
            </p>
          </GuideSection>

          <GuideSection
            id="progression"
            number="06 · Look beyond the first role"
            title="A career can branch in more than one direction."
          >
            <p>
              As you build experience, you may choose to deepen a technical specialism, take responsibility
              for projects or move towards managing people. Ecology can also connect with policy, education,
              environmental management and wider conservation work.
            </p>
            <ol className="tpl-steps">
              <li>
                <strong>Assistant ecologist</strong>
                <p>
                  Build confidence through supported fieldwork, record keeping, mapping and reporting. Seek
                  regular feedback on both technical work and professional judgement.
                </p>
              </li>
              <li>
                <strong>Ecologist / specialist</strong>
                <p>
                  Take ownership of defined work, coordinate tasks and communicate advice. A growing
                  understanding of your limits is as important as growing independence.
                </p>
              </li>
              <li>
                <strong>Senior, principal or project lead</strong>
                <p>
                  Guide more complex decisions, support colleagues and balance technical quality with budgets,
                  deadlines and relationships.
                </p>
              </li>
            </ol>
            <p>
              Job titles vary between employers, so progression is not always a neat ladder. Look for
              increasing responsibility, a stronger body of evidence and work that fits your interests, rather
              than chasing a title in isolation.
            </p>
          </GuideSection>

          <GuideSection
            id="applications"
            number="07 · Make your experience legible"
            title="Help an employer see how you could contribute."
          >
            <p>
              A convincing application connects your experience to the work described in the advert. Start
              with the essential criteria. For each one, choose a specific piece of evidence, describe your
              contribution and explain the result or learning.
            </p>
            <p>
              If you are early in your career, evidence can come from study, supervised volunteering, paid
              work in another field or a carefully scoped project. Be accurate about the level of
              responsibility you held. Supporting a survey is worthwhile experience; you do not need to imply
              that you led it.
            </p>
            <div className="tpl-intro-note">
              <strong>Try an evidence-first sentence.</strong>
              <p>
                “I checked and mapped habitat records for a supervised field project, identified inconsistent
                entries and produced a short findings report” tells an employer more than “I have excellent
                attention to detail”.
              </p>
            </div>
            <p>
              At interview, be ready to explain how you approached a task, what you would do differently and
              when you would seek advice. Prepare questions about supervision, the team’s projects and what
              good performance looks like in the first few months.
            </p>
          </GuideSection>

          <GuideSection
            id="training"
            number="08 · Build useful professional skills"
            title="Ecological knowledge, with the skills to put it to work."
          >
            <p>
              Alongside technical development, you may need to coordinate a project, work with different
              stakeholders or contribute to a funding proposal. WildTeam courses offer a way to explore these
              professional skills in a conservation context.
            </p>
            <CourseTiles />
            <p className="tpl-small">
              Choose learning that fits your next step. These are complementary skills, not substitutes for
              required ecological qualifications, technical training or experience.{" "}
              <Link href="/course-recommendations">How our course recommendations work →</Link>
            </p>
          </GuideSection>

          <GuideSection
            id="next-steps"
            number="09 · Make the next step manageable"
            title="Your next three months."
          >
            <ol className="tpl-steps">
              <li>
                <strong>Month one · Find your focus</strong>
                <p>
                  Compare five roles you could genuinely see yourself doing. Note the repeated requirements
                  and decide which type of ecology work you want to explore first.
                </p>
              </li>
              <li>
                <strong>Month two · Close one useful gap</strong>
                <p>
                  Arrange a realistic opportunity to practise a skill, with feedback where possible. Keep a
                  record of what you did and what changed in your understanding.
                </p>
              </li>
              <li>
                <strong>Month three · Test your application</strong>
                <p>
                  Build an evidence-based CV, ask for focused feedback and prepare evidence for the criteria
                  you see most often. Keep refining your plan as you learn.
                </p>
              </li>
            </ol>
            <p>
              You do not have to do everything at once. A specific, affordable next step is more useful than
              an ambitious plan that depends on unlimited time, money or unpaid work.
            </p>
          </GuideSection>

          <GuideSection id="jobs" number="10 · Picture your next move" title="Find your next opportunity.">
            <p>Explore ecology roles and see how your skills could contribute to the work.</p>
            <ExampleJobs />
          </GuideSection>

          <GuideSection
            id="questions"
            number="11 · A few useful answers"
            title="Before you take the next step."
          >
            <div className="tpl-faq">
              <details>
                <summary>Do I need a degree to become an ecologist?</summary>
                <p>
                  A relevant degree is a common requirement for professional ecology roles. Requirements vary
                  by job and training route, so compare current adverts and provider guidance before choosing
                  a qualification. Wider conservation work includes many other roles with different entry
                  routes.
                </p>
              </details>
              <details>
                <summary>Can I move into ecology from another career?</summary>
                <p>
                  Yes, but the route depends on your existing knowledge and the technical requirements of the
                  role. Identify transferable strengths and plan how to gain the subject knowledge and
                  supervised experience you still need.
                </p>
              </details>
              <details>
                <summary>Will a WildTeam course get me an ecology job?</summary>
                <p>
                  No course guarantees employment. WildTeam training can help you develop relevant
                  professional skills and prepare for your job search, while each employer decides what
                  qualifications, experience and capabilities it needs.
                </p>
              </details>
              <details>
                <summary>How should I read the salary information?</summary>
                <p>
                  Compare pay alongside the role level, advertised hours and responsibilities. The salary
                  figures describe advertised opportunities, rather than the earnings of everyone working in
                  ecology. The number of salaries included helps you judge the context.
                </p>
              </details>
            </div>
            <h3>Keep learning from reliable sources</h3>
            <p>
              Explore professional guidance, career routes and the wider practice of ecology through these
              organisations. Use their current information alongside the requirements in each vacancy.
            </p>
            <ul className="tpl-source-list">
              <li>
                <a
                  href="https://nationalcareers.service.gov.uk/job-profiles/ecologist"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  National Careers Service · Ecologist profile ↗
                </a>
              </li>
              <li>
                <a href="https://cieem.net/" target="_blank" rel="noopener noreferrer">
                  CIEEM · Professional ecology and environmental management ↗
                </a>
              </li>
              <li>
                <a href="https://www.britishecologicalsociety.org/" target="_blank" rel="noopener noreferrer">
                  British Ecological Society · Explore the profession ↗
                </a>
              </li>
            </ul>
          </GuideSection>
        </article>
      </div>
      <div className="shell">
        <TrainingBanner membership />
        <div className="tpl-footer-links">
          <Link href="/conservation-sector/wildlife-conservation">
            Explore the Wildlife Conservation sector →
          </Link>
          <Link href="/course-recommendations">Find training for your next step →</Link>
        </div>
      </div>
    </main>
  );
}
