import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  careerCourseUrl,
  ComparisonList,
  CourseTiles,
  membershipUrl,
  Sparkle,
  TrainingBanner,
} from "@/components/templates/template-parts";

export const metadata: Metadata = {
  title: "Why we recommend WildTeam courses",
  description:
    "How relevant WildTeam learning can support your conservation job search, with no promise of employment.",
};

export default function CourseRecommendationsTemplate() {
  return (
    <main>
      <section className="tpl-hero shell">
        <div className="tpl-hero__grid">
          <div>
            <h1>
              Build your skills.
              <br />
              <span className="tpl-gradient">Back yourself.</span>
            </h1>
            <p className="tpl-hero__lead">
              A job advert tells you what an employer needs. Relevant learning can help you understand the
              work, develop useful skills and make a stronger case for what you could contribute.
            </p>
            <div className="tpl-actions">
              <a className="action" href="#free-course">
                Start with our free career course ↓
              </a>
            </div>
          </div>
          <figure className="tpl-photo">
            <Image
              src="/images/job-training-cta-pastel.jpg"
              alt="Illustrated conservation explorers looking across a pastel mountain landscape"
              width={1536}
              height={1024}
              sizes="(max-width: 800px) 100vw, 50vw"
              preload
            />
            <figcaption>WildTeam’s conservation careers illustration</figcaption>
          </figure>
        </div>
      </section>

      <section className="tpl-wide-section tpl-wide-section--white" id="how-it-works">
        <div className="shell">
          <div className="tpl-centred-intro">
            <p className="eyebrow">Why are we recommending these courses?</p>
            <h2>
              Because the work calls for skills.
              <br />
              <span className="tpl-gradient">And skills can be developed.</span>
            </h2>
            <p>
              We connect the responsibilities described in a job with topics taught in WildTeam training. The
              aim is to help you choose learning that could support your application and your development.
            </p>
          </div>
          <div className="tpl-three-steps">
            <div>
              <span>01</span>
              <h3>Look at the work</h3>
              <p>
                We consider the activities in the advert: perhaps planning a project, working with
                communities, evaluating results or preparing a funding proposal.
              </p>
            </div>
            <div>
              <span>02</span>
              <h3>Find a useful connection</h3>
              <p>
                We suggest courses whose subject matter connects with those activities. A fundraising role
                might benefit from Grant Writing; a delivery role might connect with Project Management.
              </p>
            </div>
            <div>
              <span>03</span>
              <h3>You decide what fits</h3>
              <p>
                Read the advert and the course outline, think about your existing experience and choose
                whether the learning would help with a gap you want to address.
              </p>
            </div>
          </div>
          <div className="tpl-inline-notice">
            <Sparkle />
            <p>
              <strong>A recommendation is a suggestion, not a requirement or a promise.</strong> Completing a
              course does not guarantee an interview, a job, a particular salary or eligibility for a role.
              Employers make their own recruitment decisions, and their stated essential criteria still
              matter.
            </p>
          </div>
        </div>
      </section>

      <section className="shell tpl-wide-section" id="free-course">
        <div className="tpl-free-feature">
          <div>
            <p className="eyebrow">A useful place to begin · Free course</p>
            <h2>Launching Your Career in Wildlife Conservation.</h2>
            <p>
              You do not have to work out your whole job search alone. Start with a structured way to explore
              the work you want, prepare your experience and approach your next application.
            </p>
            <div className="tpl-actions">
              <a className="action" href={careerCourseUrl} target="_blank" rel="noopener noreferrer">
                Explore the free course <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className="tpl-small" style={{ color: "#f3c4e3", marginTop: 18 }}>
              For people starting out, changing careers or planning their next move.
            </p>
          </div>
          <div className="tpl-free-feature__steps">
            <div>
              <span>FIND YOUR DIRECTION</span>
              <h3>Choose work that fits you.</h3>
              <p>Explore your interests and build a more focused plan for the roles you want to pursue.</p>
            </div>
            <div>
              <span>TELL YOUR STORY</span>
              <h3>Make your experience count.</h3>
              <p>Prepare to explain what you bring through applications and conversations with employers.</p>
            </div>
            <div>
              <span>MAKE YOUR NEXT MOVE</span>
              <h3>Approach it with purpose.</h3>
              <p>
                Develop a thoughtful approach to opportunities, interviews and decisions about your future.
              </p>
            </div>
          </div>
        </div>
      </section>

      <article className="shell tpl-explainer-body tpl-article">
        <section className="tpl-guide-section" id="useful-learning">
          <p className="eyebrow">See the connection</p>
          <h2>
            From a responsibility
            <br />
            to a practical learning goal.
          </h2>
          <p>
            A course is most useful when you know what you want to get from it. Start with a responsibility in
            the advert and choose the capability you want to strengthen.
          </p>
          <ComparisonList
            label="Responsibilities and relevant WildTeam training"
            items={[
              {
                title: "Coordinate a conservation project",
                description:
                  "Practise organising delivery, budgets and partners so you can explain a clear approach to a project.",
                valueLabel: "Relevant WildTeam course",
                value: "Project Management",
                href: "https://training.wildteam.org.uk/course/project-management-for-wildlife-conservation",
              },
              {
                title: "Develop proposals for funders",
                description:
                  "Build a clear case for supporting a project and the outcomes it is designed to achieve.",
                valueLabel: "Relevant WildTeam course",
                value: "Grant Writing",
                href: "https://training.wildteam.org.uk/course/grant-writing",
              },
              {
                title: "Work with communities and stakeholders",
                description:
                  "Understand different interests, plan engagement and make listening part of your approach.",
                valueLabel: "Relevant WildTeam course",
                value: "Stakeholder Engagement",
                href: "https://training.wildteam.org.uk/course/stakeholder-engagement-for-wildlife-conservation",
              },
            ]}
          />
          <p>
            Use the learning as a starting point for practice and reflection. In an application, explain what
            you understand, what you have tried and where you still need experience. A course title alone
            cannot tell an employer the whole story. Our{" "}
            <Link href="/conservation-career-guides/ecologist">ecologist career guide</Link> shows how
            learning can sit alongside practical experience.
          </p>
        </section>
        <section className="tpl-guide-section">
          <p className="eyebrow">How to use a recommendation well</p>
          <h2>Choose learning with a purpose.</h2>
          <ol className="tpl-steps">
            <li>
              <strong>Read the actual requirements</strong>
              <p>
                Separate essential qualifications and experience from skills you could develop. A general
                professional course does not replace a technical qualification, licence or experience an
                employer requires.
              </p>
            </li>
            <li>
              <strong>Decide what would help you most</strong>
              <p>
                You may already have the recommended skill. Choose a useful gap rather than feeling that every
                suggested course is something you need to buy.
              </p>
            </li>
            <li>
              <strong>Connect learning to your experience</strong>
              <p>
                Think about how you would apply a method or idea to a real task. Be honest about the
                difference between understanding an approach and having delivered it in professional practice.
              </p>
            </li>
          </ol>
          <div className="tpl-intro-note">
            <strong>Be accurate about your experience.</strong>
            <p>
              You can explain how learning has informed your approach without presenting a training exercise
              as paid work or claiming a responsibility you have not held.
            </p>
          </div>
        </section>
        <section className="tpl-guide-section">
          <p className="eyebrow">A note on the matching</p>
          <h2>
            Helpful connections.
            <br />
            Your judgement still matters.
          </h2>
          <p>
            WildJobs uses AI to connect information in a job description with relevant WildTeam course topics.
            Recommendations can miss context, and they do not mean that an employer has approved, requested or
            endorsed the training.
          </p>
          <p>
            We offer these suggestions because we believe practical conservation skills can support your
            professional development. WildTeam provides the courses linked here, and some training is paid.
            You can browse jobs and apply for roles without purchasing a course or membership.
          </p>
          <p>
            If a recommendation does not fit your goals or current experience, you can leave it. The original
            advert and the employer’s own application information should guide your decision about whether to
            apply.
          </p>
        </section>
        <section className="tpl-guide-section">
          <p className="eyebrow">Build on what you already know</p>
          <h2>
            Training for the work
            <br />
            you want to do.
          </h2>
          <CourseTiles />
          <p>
            For ongoing learning across topics,{" "}
            <a href={membershipUrl} target="_blank" rel="noopener noreferrer">
              explore WildTeam memberships ↗
            </a>
            . Compare the available options with your interests, time and budget. The free career course is a
            useful starting point if you are still deciding where to focus.
          </p>
        </section>
        <section className="tpl-guide-section">
          <p className="eyebrow">Your questions, answered</p>
          <h2>Good to know before you start.</h2>
          <div className="tpl-faq">
            <details>
              <summary>Do I have to take a course to apply for a job?</summary>
              <p>
                No. Our suggestions are optional. Follow the employer’s stated requirements and apply through
                the original advert.
              </p>
            </details>
            <details>
              <summary>Does a certificate guarantee that I will get hired?</summary>
              <p>
                No. Learning can support your development, but employers assess the combination of
                qualifications, experience, skills and other criteria relevant to a role.
              </p>
            </details>
            <details>
              <summary>Why does a job sometimes have no suggested course?</summary>
              <p>
                Not every role has a clear connection to a WildTeam course. We aim to show useful matches
                rather than attach training to every vacancy.
              </p>
            </details>
            <details>
              <summary>What if I already have the recommended skills?</summary>
              <p>
                You may not need that course. Use recommendations as prompts to reflect on what you can
                already demonstrate and what you would like to strengthen.
              </p>
            </details>
            <details>
              <summary>Is the career course really free?</summary>
              <p>
                Launching Your Career in Wildlife Conservation is offered as a free WildTeam course. Visit the
                course page to see the current content and joining information.
              </p>
            </details>
          </div>
        </section>
      </article>
      <div className="shell">
        <TrainingBanner membership />
        <div className="tpl-footer-links">
          <Link href="/conservation-career-guides/ecologist">Explore the ecologist career guide →</Link>
          <Link href="/conservation-sector/wildlife-conservation">Find your place in conservation →</Link>
          <Link href="/">Back to jobs →</Link>
        </div>
      </div>
    </main>
  );
}
