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
  title: "Wildlife Conservation — sector guide",
  description:
    "Explore Wildlife Conservation career routes, job-market insights, employers and relevant training.",
};
const contents = [
  { id: "sector-overview", label: "The sector at a glance" },
  { id: "the-work", label: "Where the work happens" },
  { id: "career-routes", label: "Roles & routes in" },
  { id: "sector-skills", label: "Skills that connect the work" },
  { id: "sector-pay", label: "Pay & working patterns" },
  { id: "sector-training", label: "Develop your skills" },
  { id: "jobs", label: "Current opportunities" },
  { id: "sector-faq", label: "Questions & next steps" },
];

export default function SectorTemplate() {
  return (
    <main>
      <section className="tpl-hero shell">
        <div className="tpl-hero__grid">
          <div>
            <h1>
              Wildlife <span className="tpl-gradient">Conservation.</span>
            </h1>
            <p className="tpl-hero__lead">
              Many skills. One living planet. Find your place in the work to protect species, restore habitats
              and help people and nature thrive together.
            </p>
            <div className="tpl-actions">
              <a className="action" href="#career-routes">
                Explore the career paths ↓
              </a>
              <a className="tpl-text-link" href="#jobs">
                See current opportunities ↗
              </a>
            </div>
          </div>
          <TemplatePhoto kind="wetland" priority />
        </div>
      </section>
      <div className="shell">
        <ExampleStats
          items={[
            { value: "£33,000", label: "Median advertised salary", detail: "214 annual salaries" },
            { value: "480", label: "Jobs posted in a year", detail: "Across the directory" },
            { value: "52", label: "Active roles", detail: "From fieldwork to fundraising" },
            { value: "136", label: "Employers advertising", detail: "A mix of organisation types" },
          ]}
        />
      </div>
      <div className="shell tpl-editorial">
        <GuideContents items={contents} />
        <article className="tpl-article">
          <GuideSection
            id="sector-overview"
            number="01 · The bigger picture"
            title="Conservation takes more than one kind of person."
          >
            <p>
              Wildlife conservation brings together work to understand species, protect habitats and support
              nature recovery. It connects practical action with research, relationships, funding and
              decisions about how land and resources are used.
            </p>
            <p>
              That means there is more than one way to contribute. A reserve may need ecologists and land
              managers, but also project coordinators, educators, fundraisers, finance specialists and people
              who can work well with local communities. The role that suits you may be closer to your existing
              skills than you expect.
            </p>
            <div className="tpl-intro-note">
              <strong>Start with the contribution you want to make.</strong>
              <p>
                Do you want to understand a problem, work directly on a site, bring people together or make a
                project possible? Use that question to explore roles, then look at the capabilities and
                working conditions each one involves.
              </p>
            </div>
            <p>
              The boundaries between sectors are useful signposts, not walls. A wildlife project might also
              involve climate adaptation, freshwater restoration, farming or policy. When reading a vacancy,
              look at the work itself as well as the sector label.
            </p>
          </GuideSection>
          <GuideSection
            id="the-work"
            number="02 · What the sector includes"
            title="From a single species to a whole landscape."
          >
            <p>
              Conservation happens at different scales and through different kinds of organisation. These
              areas show the breadth of the work rather than a fixed list of specialisms.
            </p>
            <div className="tpl-feature-grid">
              <div className="tpl-feature-card">
                <h3>Habitats & landscapes</h3>
                <p>
                  Manage reserves, restore connected habitats and work with landowners to help wildlife move
                  through a wider landscape.
                </p>
              </div>
              <div className="tpl-feature-card">
                <h3>Species & evidence</h3>
                <p>
                  Understand populations, collect reliable observations and use research to inform practical
                  conservation choices.
                </p>
              </div>
              <div className="tpl-feature-card">
                <h3>People & participation</h3>
                <p>
                  Support communities, learning and volunteering so that more people can shape and take part
                  in nature recovery.
                </p>
              </div>
              <div className="tpl-feature-card">
                <h3>Projects & resources</h3>
                <p>
                  Plan delivery, secure funding, coordinate teams and keep conservation work organised and
                  accountable.
                </p>
              </div>
            </div>
            <p>
              <Link href="/employers">Conservation employers</Link> can include charities, ecological
              consultancies, public bodies, research institutions and organisations that manage land. Their
              missions, resources and ways of working differ, so take time to understand an employer’s
              projects before applying.
            </p>
          </GuideSection>
          <GuideSection
            id="career-routes"
            number="03 · Find your place"
            title="Different routes. Shared purpose."
          >
            <div className="tpl-feature-grid">
              <div className="tpl-feature-card">
                <span>01</span>
                <h3>Science & fieldwork</h3>
                <p>
                  Ecologists, surveyors and research staff turn observations into evidence. Relevant technical
                  knowledge and careful methods are central.
                </p>
                <Link href="/conservation-career-guides/ecologist">Explore the ecologist career guide →</Link>
              </div>
              <div className="tpl-feature-card">
                <span>02</span>
                <h3>Practical land management</h3>
                <p>
                  Rangers, wardens and reserve teams carry out and coordinate work on sites, often alongside
                  volunteers and contractors.
                </p>
              </div>
              <div className="tpl-feature-card">
                <span>03</span>
                <h3>People & partnerships</h3>
                <p>
                  Community officers, educators and partnership staff connect conservation with the people
                  whose lives and choices shape it.
                </p>
              </div>
              <div className="tpl-feature-card">
                <span>04</span>
                <h3>Enabling the work</h3>
                <p>
                  Fundraising, operations, communications and project management help turn a conservation
                  ambition into sustained delivery.
                </p>
              </div>
            </div>
            <h3>Entering the sector for the first time</h3>
            <p>
              Explore the requirements of a specific role rather than assuming that every conservation job
              needs the same degree or background. Some technical professions have clear qualification and
              competence requirements. Other roles may place more weight on experience you can demonstrate
              from a different setting.
            </p>
            <h3>Bringing experience from another field</h3>
            <p>
              Make your transferable skills concrete. If you have managed budgets, built partnerships, written
              proposals or delivered projects, explain the responsibilities you held and the results. Then
              identify the conservation context you still need to understand.
            </p>
            <p>
              For practical experience, choose opportunities that are realistic for your circumstances. Ask
              about supervision, accessibility, expenses and the commitment involved. You do not need to treat
              unlimited unpaid work as the only way to show that you care.
            </p>
          </GuideSection>
          <GuideSection
            id="sector-skills"
            number="04 · What connects the roles"
            title="Good ideas need people who can deliver them."
          >
            <p>
              Different roles call for different technical skills. Across conservation projects, clear
              communication, thoughtful planning and the ability to learn from evidence help people work
              together effectively.
            </p>
            <div className="tpl-skill-bars" aria-label="Skills mentioned in job descriptions">
              {[
                { label: "Project planning & delivery", value: 68 },
                { label: "Working with stakeholders", value: 61 },
                { label: "Monitoring & reporting", value: 49 },
                { label: "Funding & proposal writing", value: 34 },
              ].map((skill) => (
                <div key={skill.label}>
                  <div className="tpl-skill-bars__label">
                    <span>{skill.label}</span>
                    <strong>{skill.value}%</strong>
                  </div>
                  <div className="tpl-skill-bars__track" aria-hidden="true">
                    <i style={{ width: `${skill.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="tpl-small">
              Skills vary by role. Read each advert’s requirements and compare them with your own experience.
            </p>
            <p>
              Look for evidence of these skills in your own experience. Organising a well-scoped activity,
              resolving a practical problem or presenting a careful finding can all help you explain how you
              work. Relevance matters more than collecting a long list of courses or impressive-sounding
              labels.
            </p>
          </GuideSection>
          <GuideSection
            id="sector-pay"
            number="05 · Understand the conditions"
            title="Compare like with like."
          >
            <p>
              A single sector-wide pay figure hides a lot of variation. Role level, location, hours, contract
              length and the kind of employer all affect what an advertised salary means. Use a headline
              figure as a starting point for questions, not a prediction of what a particular employer will
              offer.
            </p>
            <ComparisonList
              label="Working patterns in conservation vacancies"
              items={[
                {
                  title: "On-site",
                  description: "Check site locations, travel expectations and seasonal hours.",
                  valueLabel: "Share of paid vacancies",
                  value: "62%",
                },
                {
                  title: "Hybrid",
                  description: "Understand office expectations alongside field visits and home working.",
                  valueLabel: "Share of paid vacancies",
                  value: "28%",
                },
                {
                  title: "Remote",
                  description: "Confirm home-location limits and any travel requirements.",
                  valueLabel: "Share of paid vacancies",
                  value: "10%",
                },
              ]}
            />
            <p>
              Before accepting a role, understand what the contract, support and development arrangements mean
              in practice. If information is unclear in an advert, prepare a question for the employer. The
              title “remote” does not necessarily mean that no travel is involved.
            </p>
            <p className="tpl-small">
              Working-pattern labels are a starting point. Check the original advert for the arrangements that
              apply to the role you are considering.
            </p>
          </GuideSection>
          <GuideSection
            id="sector-training"
            number="06 · Put your learning to work"
            title="Build the skills behind the impact."
          >
            <p>
              Choose professional development around a task you want to do better: plan a project, engage a
              partner or write a funding proposal. WildTeam training connects these practical capabilities
              with the context of conservation.
            </p>
            <CourseTiles />
            <p>
              <Link href="/course-recommendations">Why we recommend these courses →</Link>
            </p>
          </GuideSection>
          <TrainingBanner />
          <GuideSection
            id="jobs"
            number="07 · Explore the possibilities"
            title="Opportunities in the sector."
          >
            <p>Find conservation opportunities that connect with your skills and interests.</p>
            <ExampleJobs employer />
          </GuideSection>
          <GuideSection
            id="sector-faq"
            number="08 · Plan your next step"
            title="Questions you might be asking."
          >
            <div className="tpl-faq">
              <details>
                <summary>Is wildlife conservation only about outdoor work?</summary>
                <p>
                  No. The work also includes analysis, fundraising, finance, communications, education, policy
                  and project coordination. Read the responsibilities to understand how a role contributes.
                </p>
              </details>
              <details>
                <summary>Can I use skills from another sector?</summary>
                <p>
                  Often, yes. Show how your experience fits the tasks an employer needs done, and be clear
                  about any subject knowledge, qualifications or technical experience you still need to gain.
                </p>
              </details>
              <details>
                <summary>Do I need to choose a specialism immediately?</summary>
                <p>
                  You can explore before committing. Compare roles, talk to practitioners where possible and
                  use manageable learning or practical experience to test what interests you.
                </p>
              </details>
              <details>
                <summary>Where should I start if I feel overwhelmed?</summary>
                <p>
                  Pick one kind of role and identify one useful next step. WildTeam’s free Launching Your
                  Career in Wildlife Conservation course is designed to help you structure your approach.
                </p>
              </details>
            </div>
            <h3>Make your next move a deliberate one.</h3>
            <p>
              Choose a type of contribution, compare a few roles and build evidence around the capabilities
              they need. Your path can change as you gain a clearer picture of the work.
            </p>
          </GuideSection>
        </article>
      </div>
      <section className="tpl-wide-section tpl-wide-section--white">
        <div className="shell">
          <div className="tpl-section-heading">
            <div>
              <p className="eyebrow">Meet a conservation employer</p>
              <h2>See the people behind the opportunities.</h2>
            </div>
          </div>
          <Link
            className="tpl-role-card"
            href="/employers/wildmere-nature-trust"
            style={{ display: "block" }}
          >
            <span>Conservation employer</span>
            <h3>Wildmere Nature Trust ↗</h3>
            <p>A local charity connecting habitat restoration, ecological evidence and community action.</p>
          </Link>
        </div>
      </section>
      <div className="shell">
        <TrainingBanner membership />
        <div className="tpl-footer-links">
          <Link href="/conservation-career-guides/ecologist">Read the ecologist career guide →</Link>
          <Link href="/course-recommendations">Explore course recommendations →</Link>
        </div>
      </div>
    </main>
  );
}
