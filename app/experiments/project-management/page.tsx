import type { Metadata } from "next";
import Image from "next/image";
import { CourseAccordion } from "@/components/course-accordion";
import { EditorialImageCredit } from "@/components/editorial-image-credit";
import {
  COURSE_EXPERIMENT_PATH,
  PMWC_CHECKOUT_URL,
  PMWC_COURSE_URL,
  PMWC_MANUAL_URL,
} from "@/lib/course-experiment";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: { absolute: "Project Management for Wildlife Conservation | WildTeam" },
  description:
    "Lead conservation projects with confidence. Explore WildTeam’s practical, self-paced Project Management for Wildlife Conservation course.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: { canonical: PMWC_COURSE_URL },
  openGraph: {
    title: "Your next conservation project, with more confidence",
    description: "A fresh look at WildTeam’s Project Management for Wildlife Conservation course.",
    url: COURSE_EXPERIMENT_PATH,
    type: "website",
    images: [
      {
        url: "/images/course-experiment/lion.jpg",
        width: 1600,
        height: 2400,
        alt: "Lion photograph used on WildTeam’s Project Management best-practice manual",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Management for Wildlife Conservation | WildTeam",
    images: ["/images/course-experiment/lion.jpg"],
  },
};

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function Icon({ kind }: { kind: "compass" | "people" | "clock" | "award" | "book" | "leaf" | "video" }) {
  const paths = {
    video: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m10 9 5 3-5 3Z" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-2 6-6 2 2-6Z" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    award: (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="m8 12-2 9 6-3 6 3-2-9" />
      </>
    ),
    book: (
      <>
        <path d="M12 5C8 2 4 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-2-10 1Zm0 0v15" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C10 3 4 7 4 14a6 6 0 0 0 6 6c7 0 10-7 10-17ZM4 21 16 8" />
      </>
    ),
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {paths[kind]}
    </svg>
  );
}

const coverage = [
  {
    title: "Start with the right principles",
    subtitle: "A clear purpose for every decision",
    text: "Build your approach around four principles: do something, focus on impact, take responsibility and embrace change. Learn to use structure to support conservation work, even when you don’t have all the answers.",
    takeaway: "Keep the difference you want to make at the centre of the work.",
  },
  {
    title: "Give everyone a clear role",
    subtitle: "Know who does what, and who decides",
    text: "Explore project directors, project managers, project support and workstream roles. Understand responsibilities and decision-making, and adapt the structure to the size of your team.",
    takeaway: "Make responsibility clear before confusion slows the project down.",
  },
  {
    title: "Move through the five project phases",
    subtitle: "Plan · Fund · Prepare · Implement · Close",
    text: "Understand what needs to happen at each stage, from shaping and funding the project to preparing the team, delivering the work and closing responsibly. Use phase-end decisions to check you’re ready for what comes next.",
    takeaway: "See the whole journey, rather than only the next task.",
  },
  {
    title: "Keep progress and change under control",
    subtitle: "Respond to the reality on the ground",
    text: "Track progress against your plan, budget and schedule. Assess risks, respond to issues, recognise opportunities and capture lessons. Learn when to adapt a plan and how to keep decisions accountable.",
    takeaway: "Spot what needs attention and decide what to do about it.",
  },
  {
    title: "Make meetings and documents work harder",
    subtitle: "Less confusion, clearer follow-through",
    text: "Develop useful meeting routines, record actions and decisions, and give documents a clear route from draft to review and sign-off. Keep information organised so your team can use it.",
    takeaway: "Help people leave meetings knowing what happens next.",
  },
  {
    title: "Put the framework into practice",
    subtitle: "Plans, trackers and reports you can use",
    text: "Get familiar with the supporting document templates, including the project tracker, project plan, document review tracker and meeting report. Use the best-practice manual as a reference as you apply the approach.",
    takeaway: "Build a practical toolkit for your own conservation work.",
  },
] as const;

const outcomes = [
  ["Bring people together", "Give your team a shared way of working, with clear roles and decisions."],
  ["Keep the work moving", "Connect the plan, schedule and budget so you know what needs attention."],
  [
    "Adapt with purpose",
    "Respond to new information, risks and opportunities without losing sight of the goal.",
  ],
  [
    "Show what’s been achieved",
    "Use progress reports and lessons learned to communicate and improve the work.",
  ],
] as const;

const faqs = [
  [
    "Do I need project management experience?",
    "No previous project management training is required. The course is suitable for aspiring conservationists and people already working in the sector. You can use it to build a foundation or bring a more consistent approach to work you already manage.",
  ],
  [
    "Can I fit this around work?",
    "Yes. The online course is self-paced, so you can work through the learning around your other commitments. A single-course purchase gives you one year of access. Membership access lasts for your active membership period.",
  ],
  [
    "How do I earn the certificate?",
    "You’ll need to complete the course requirements and pass a multiple-choice exam. Support is available if you need help or additional time, and the course offers a free exam retake. Successful completion awards 10 CPD hours.",
  ],
  [
    "What’s the difference between the manual and the course?",
    "The free best-practice manual is your reference for the approach and its supporting templates. The course adds structured video learning, exercises, quizzes, trainer support and an assessment leading to certification. You can read the manual before deciding whether to enrol.",
  ],
  [
    "Should I buy the course or choose membership?",
    "Choose the £190 single-course option if you want one year of access to this course. Monthly membership is £29 per month; annual membership is £290 per year. Both memberships include all current and future courses while your membership is active. Check the current plans and terms on WildTeam Training before purchasing.",
  ],
  [
    "Can my organisation train a whole team?",
    "Yes. WildTeam offers team memberships. They’re worth exploring if you want colleagues to develop a shared approach across projects. Use the team training link below to see the current options.",
  ],
  [
    "Is the course available in French?",
    "Yes. Project Management for Wildlife Conservation is also available in French. You’ll find a link to the French course below.",
  ],
] as const;

export default function ProjectManagementExperiment() {
  return (
    <main className={styles.page} id="course-main">
      <section className={styles.hero} id="course-hero" aria-labelledby="course-title">
        <div className={`shell ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Project Management for Wildlife Conservation</p>
            <h1 id="course-title">
              Lead conservation projects <span>with confidence</span>
            </h1>
            <p className={styles.heroIntro}>
              You care about making a difference.
              <br />
              Build the skills to make it happen.
            </p>
            <p className={styles.heroDescription}>
              Learn a practical approach to managing people, progress and change, built for the realities of
              conservation work.
            </p>
            <div className={styles.heroActions}>
              <a className={styles.button} href="#course-options">
                Start learning
              </a>
              <a className={styles.secondaryButton} href="#course-content">
                Explore the course
              </a>
            </div>
            <p className={styles.priceNote}>
              <strong>From £29/month with WildTeam membership</strong>
              <span>Or £190 for one year of access to this course</span>
            </p>
          </div>
          <div className={styles.heroVisual}>
            <figure className={styles.heroPhoto}>
              <Image
                src="/images/course-experiment/lion.jpg"
                alt="Close-up of a male lion, the photograph featured on WildTeam’s Project Management best-practice manual"
                width={1600}
                height={2400}
                sizes="(max-width: 760px) 100vw, 48vw"
                preload
              />
              <EditorialImageCredit
                creatorName="Dušan veverkolog"
                sourceUrl="https://unsplash.com/photos/close-up-photography-of-lion-ZXuDkw7Be7E"
              />
            </figure>
            <div className={styles.cpdStamp}>
              <Icon kind="award" />
              <div>
                <strong>10 CPD hours</strong>
                <span>Skills you can put to work</span>
              </div>
            </div>
            <span className={styles.imageCaption}>
              For the wildlife.
              <br />
              For the work ahead.
            </span>
          </div>
        </div>
      </section>

      <div className={styles.factStrip}>
        <div className={`shell ${styles.factGrid}`}>
          <div>
            <Icon kind="clock" />
            <p>
              <strong>10 hours</strong>
              <span>Learn online, at your pace</span>
            </p>
          </div>
          <div>
            <Icon kind="video" />
            <p>
              <strong>38 videos</strong>
              <span>Step-by-step learning</span>
            </p>
          </div>
          <div>
            <Icon kind="book" />
            <p>
              <strong>37 exercises &amp; quizzes</strong>
              <span>Put your learning into practice</span>
            </p>
          </div>
          <div>
            <Icon kind="award" />
            <p>
              <strong>10 CPD hours</strong>
              <span>On successful completion</span>
            </p>
          </div>
        </div>
      </div>

      <nav className={styles.sectionNav} aria-label="Explore this course">
        <div className="shell">
          <a href="#the-difference">Why this course</a>
          <a href="#course-content">What you’ll learn</a>
          <a href="#your-toolkit">Your toolkit</a>
          <a href="#course-options">Ways to learn</a>
          <a href="#course-questions">Your questions</a>
        </div>
      </nav>

      <section className={`${styles.section} ${styles.outcomes}`} id="the-difference">
        <div className={`shell ${styles.twoColumns}`}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Good intentions deserve a good plan</p>
            <h2>
              Less second-guessing
              <br />
              <span>More purposeful progress</span>
            </h2>
            <p>
              Conservation work asks a lot of you. Limited budgets. Moving deadlines. Different people,
              priorities and pressures.
            </p>
            <p>
              This course gives you a shared framework for the work, so you can make clearer decisions and
              keep your project focused on the difference it’s meant to make.
            </p>
            <a className={styles.textLink} href="#course-content">
              See what you’ll learn
            </a>
          </div>
          <div className={styles.outcomeList}>
            {outcomes.map(([title, text]) => (
              <div key={title}>
                <span className={styles.checkCircle}>
                  <Check />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.journey}`} aria-labelledby="journey-title">
        <figure className={styles.journeyBackdrop}>
          <Image
            className={styles.journeyPhoto}
            src="/images/design/woodland.jpg"
            alt=""
            fill
            sizes="100vw"
          />
          <EditorialImageCredit
            creatorName="Darren Bockman"
            sourceUrl="https://unsplash.com/photos/pN3Z2usSIQw"
          />
        </figure>
        <div className={`shell ${styles.journeyContent}`}>
          <div className={styles.journeyIntro}>
            <p className={styles.eyebrow}>A framework for the whole journey</p>
            <h2 id="journey-title">
              From the first idea
              <br />
              to the final lesson learned
            </h2>
            <p>Five connected phases. A clear way forward at every stage.</p>
          </div>
          <ol className={styles.phaseList}>
            {[
              ["Plan", "Get clear on the change you want to make and how you’ll approach it."],
              ["Fund", "Understand what needs to be in place to secure the resources."],
              ["Prepare", "Bring the team, detailed work plan and working processes together."],
              ["Implement", "Deliver the work, track progress and respond as circumstances change."],
              ["Close", "Record achievements, share lessons and bring the project to a responsible close."],
            ].map(([title, text], index) => (
              <li key={title}>
                <span className={styles.phaseNumber}>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <p className={styles.journeyNote}>
            Based on WildTeam’s Project Management for Wildlife Conservation best practice
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.curriculum}`} id="course-content">
        <div className={`shell ${styles.twoColumns}`}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>Inside the course</p>
            <h2>
              A skill set you’ll
              <br />
              <span>come back to</span>
            </h2>
            <p>
              Work through the approach with video learning, exercises and quizzes. Explore how each part
              helps you manage conservation work in practice.
            </p>
            <div className={styles.smallNote}>
              <Icon kind="compass" />
              <span>Start with the foundations. Build a way of working you can adapt to your project.</span>
            </div>
            <a className={styles.textLink} href={PMWC_COURSE_URL}>
              Visit the current course on WildTeam Training
            </a>
            <figure className={styles.fieldPhoto}>
              <Image
                src="/images/guides/restoration-team.jpg"
                alt="Volunteers working together to restore habitat beside a wetland"
                width={1600}
                height={1067}
                sizes="(max-width: 760px) 100vw, 45vw"
              />
              <EditorialImageCredit
                creatorName="Joe Whalen / Tampa Bay Estuary Program"
                sourceUrl="https://unsplash.com/photos/a-group-of-people-standing-next-to-a-river-CxL29J-aM5E"
              />
            </figure>
          </div>
          <CourseAccordion
            numbered
            initialOpen={0}
            items={coverage.map((item) => ({
              title: item.title,
              subtitle: item.subtitle,
              content: (
                <>
                  <p>{item.text}</p>
                  <p className={styles.takeaway}>
                    <Check />
                    {item.takeaway}
                  </p>
                </>
              ),
            }))}
          />
        </div>
      </section>

      <section className={`${styles.section} ${styles.toolkit}`} id="your-toolkit">
        <div className={`shell ${styles.toolkitGrid}`}>
          <div className={styles.manualVisual}>
            <span className={styles.manualEdition}>The approach behind the course</span>
            <a
              href={PMWC_MANUAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Read the free PMWC best-practice manual, PDF, opens in a new tab"
            >
              <Image
                src="/images/course-experiment/pmwc-manual-v5.jpg"
                width={1414}
                height={2000}
                sizes="(max-width: 760px) 65vw, 330px"
                alt="Cover of WildTeam’s 2026 Project Management for Wildlife Conservation best-practice manual, featuring a lion"
              />
            </a>
            <span className={styles.manualTag}>2026 edition · Version 5</span>
          </div>
          <div className={styles.toolkitCopy}>
            <p className={styles.eyebrow}>Useful long after the last lesson</p>
            <h2>
              Your field guide
              <br />
              <span>for the work ahead</span>
            </h2>
            <p>
              Good learning should leave you with something you can use. The course is built around WildTeam’s
              free best-practice manual, with supporting templates to help you put the approach to work.
            </p>
            <ul className={styles.checkList}>
              <li>
                <Check />
                <span>
                  <strong>A project tracker</strong> for progress, risks, issues and lessons learned
                </span>
              </li>
              <li>
                <Check />
                <span>
                  <strong>Planning and reporting templates</strong> to give your work a clear structure
                </span>
              </li>
              <li>
                <Check />
                <span>
                  <strong>A practical reference</strong> to revisit when a new challenge comes along
                </span>
              </li>
            </ul>
            <a className={styles.darkButton} href={PMWC_MANUAL_URL} target="_blank" rel="noopener noreferrer">
              Read the free best practice
            </a>
            <p className={styles.linkNote}>PDF · Opens in a new tab · No purchase needed</p>
            <p className={styles.manualDifference}>
              <strong>Why take the course if the manual is free?</strong> The manual gives you the reference.
              The training adds guided learning, practice, support and a certificate to demonstrate what
              you’ve learned.
            </p>
          </div>
        </div>
        <div className={`shell ${styles.provenanceGrid}`}>
          <section aria-labelledby="course-basis-title">
            <h2 id="course-basis-title">What this course is based on</h2>
            <p>
              This course teaches the WildTeam Project Management for Wildlife Conservation best practice, now
              in its fifth version. The best practice draws on 18 sources, including nine peer-reviewed
              journal articles on conservation science, project management and organisational research. It
              adapts the PRINCE2 and Project Management Institute frameworks for conservation teams, and it
              responds to WildTeam’s own published research on project management skills in the conservation
              sector.
            </p>
            <a
              className={styles.textLink}
              href={`${PMWC_MANUAL_URL}#page=69`}
              target="_blank"
              rel="noopener noreferrer"
            >
              See the sources in the best-practice manual
            </a>
          </section>
          <section aria-labelledby="course-reviewers-title">
            <h2 id="course-reviewers-title">Who helped to create this course</h2>
            <p>
              Nineteen practitioners reviewed this version of the best practice before publication. They work
              in 13 organisations, including the Wildlife Conservation Society, Chester Zoo, the Orangutan
              Information Centre, WildTeam Bangladesh, NQ Dry Tropics, the United Nations Office for Project
              Services and Accenture. Their experience spans conservation, development and business, and their
              comments were used to improve the text.
            </p>
            <a
              className={styles.textLink}
              href={`${PMWC_MANUAL_URL}#page=2`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the acknowledgements in the manual
            </a>
          </section>
        </div>
      </section>

      <section className={`${styles.section} ${styles.people}`} aria-labelledby="people-title">
        <div className="shell">
          <div className={styles.centredIntro}>
            <p className={styles.eyebrow}>Your next step, wherever you’re starting</p>
            <h2 id="people-title">
              For people who want
              <br />
              <span>their work to count</span>
            </h2>
          </div>
          <div className={styles.audienceGrid}>
            <article>
              <Icon kind="leaf" />
              <h3>Starting your career</h3>
              <p>
                Build an understanding of how conservation projects work, and gain a practical skill set you
                can explain in applications and interviews.
              </p>
            </article>
            <article>
              <Icon kind="compass" />
              <h3>Taking on more responsibility</h3>
              <p>
                Bring structure to the work you’re already doing, whether you’re coordinating a workstream or
                stepping into project management.
              </p>
            </article>
            <article>
              <Icon kind="people" />
              <h3>Developing your team</h3>
              <p>
                Help colleagues use the same language, processes and tools across your organisation’s
                conservation projects.
              </p>
              <a className={styles.textLink} href="https://training.wildteam.org.uk/pricing-teams">
                Explore training for teams
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.proof}`} aria-labelledby="proof-title">
        <div className="shell">
          <div className={styles.proofIntro}>
            <p className={styles.eyebrow}>From the WildTeam learning community</p>
            <h2 id="proof-title">
              Practical skills
              <br />
              <span>Personal progress</span>
            </h2>
          </div>
          <div className={styles.quoteGrid}>
            <figure>
              <span className={styles.quoteMark} aria-hidden="true">
                “
              </span>
              <blockquote>
                It gave me practical tools and a clearer structure for planning, monitoring and evaluating
                conservation projects.
              </blockquote>
              <figcaption>
                <span className={styles.learnerAvatar}>
                  <Image
                    src="/images/course-experiment/junior-jaime-alberto.png"
                    alt=""
                    width={112}
                    height={112}
                    sizes="112px"
                  />
                </span>
                <span>
                  <strong>Junior Jaime Alberto</strong>
                  <small>Mozambique · PMWC learner</small>
                </span>
              </figcaption>
            </figure>
            <figure>
              <span className={styles.quoteMark} aria-hidden="true">
                “
              </span>
              <blockquote>
                As a Projects Manager, the skills I’ve learned have improved the way I organise and manage
                conservation work.
              </blockquote>
              <figcaption>
                <span className={styles.learnerAvatar}>
                  <Image
                    src="/images/course-experiment/reetika-m.png"
                    alt=""
                    width={112}
                    height={112}
                    sizes="112px"
                  />
                </span>
                <span>
                  <strong>Reetika M</strong>
                  <small>India · PMWC learner</small>
                </span>
              </figcaption>
            </figure>
          </div>
          <p className={styles.proofSource}>
            Learner experiences published on{" "}
            <a href="https://training.wildteam.org.uk/memberships">WildTeam Training</a>.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.certificate}`} aria-labelledby="certificate-title">
        <div className={`shell ${styles.certificateGrid}`}>
          <figure className={styles.certificateArt}>
            <a
              href="/images/course-experiment/pmwc-certificate-example.png"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View the example PMWC certificate, opens in a new tab"
            >
              <Image
                src="/images/course-experiment/pmwc-certificate-example.png"
                alt="Example WildTeam Project Management for Wildlife Conservation certificate, showing 10 CPD learning hours"
                width={1414}
                height={2000}
                sizes="(max-width: 760px) 260px, 320px"
              />
            </a>
            <figcaption>Example PMWC certificate</figcaption>
          </figure>
          <div>
            <p className={styles.eyebrow}>Make your learning visible</p>
            <h2 id="certificate-title">
              Earn a certificate
              <br />
              <span>Build your confidence</span>
            </h2>
            <p>
              Complete the course requirements and pass the multiple-choice exam to earn your WildTeam
              certificate and 10 CPD hours.
            </p>
            <p>
              Add your achievement to your CV or professional profile, and use it to demonstrate your
              commitment to developing practical conservation skills.
            </p>
            <p className={styles.examNote}>
              <Check />
              Trainer support and a free exam retake are available.
            </p>
            <a className={styles.textLink} href="https://training.wildteam.org.uk/cpd-certification">
              About WildTeam’s CPD certification
            </a>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.pricing}`} id="course-options">
        <div className="shell">
          <div className={styles.centredIntro}>
            <p className={styles.eyebrow}>Your learning, your choice</p>
            <h2>
              Build your conservation toolkit
              <br />
              <span>with WildTeam membership</span>
            </h2>
            <p>
              Get this course and the rest of the WildTeam collection with membership, or choose this course
              on its own.
            </p>
          </div>
          <div className={styles.priceGrid}>
            <article className={`${styles.priceCard} ${styles.featuredPrice}`}>
              <p className={styles.planLabel}>Start with membership</p>
              <h3>Monthly membership</h3>
              <p className={styles.price}>
                £29<span>per month, billed monthly</span>
              </p>
              <p className={styles.planDescription}>
                Build your skills across the WildTeam course collection.
              </p>
              <ul className={styles.checkList}>
                <li>
                  <Check />
                  This course and all other current courses
                </li>
                <li>
                  <Check />
                  New courses as they’re released
                </li>
                <li>
                  <Check />
                  Resources and trainer support
                </li>
                <li>
                  <Check />
                  Certificates on successful completion
                </li>
                <li>
                  <Check />
                  Cancel anytime; access to the end of your paid period
                </li>
              </ul>
              <a className={styles.button} href="https://training.wildteam.org.uk/memberships">
                Explore monthly membership
              </a>
              <p className={styles.checkoutNote}>Access while your membership is active</p>
            </article>
            <article className={styles.priceCard}>
              <p className={styles.planLabel}>Make learning a habit</p>
              <h3>Annual membership</h3>
              <p className={styles.price}>
                £290<span>per year, billed annually</span>
              </p>
              <p className={styles.planDescription}>A full year to develop your conservation skill set.</p>
              <ul className={styles.checkList}>
                <li>
                  <Check />
                  Everything in monthly membership
                </li>
                <li>
                  <Check />
                  One annual payment
                </li>
                <li>
                  <Check />
                  All current and future courses during membership
                </li>
                <li>
                  <Check />
                  £58 less than 12 monthly payments
                </li>
                <li>
                  <Check />A full year of learning access
                </li>
              </ul>
              <a className={styles.secondaryButton} href="https://training.wildteam.org.uk/memberships">
                Explore annual membership
              </a>
              <p className={styles.checkoutNote}>Access while your membership is active</p>
            </article>
            <article className={styles.priceCard}>
              <p className={styles.planLabel}>Focus on this course</p>
              <h3>Project Management</h3>
              <p className={styles.price}>
                £190<span>one-off payment</span>
              </p>
              <p className={styles.planDescription}>
                One year to learn, revisit and put this course into practice.
              </p>
              <ul className={styles.checkList}>
                <li>
                  <Check />
                  This complete course
                </li>
                <li>
                  <Check />
                  One year of course access
                </li>
                <li>
                  <Check />
                  Video learning, exercises and quizzes
                </li>
                <li>
                  <Check />
                  Trainer support and course resources
                </li>
                <li>
                  <Check />
                  Exam and certificate on successful completion
                </li>
              </ul>
              <a className={styles.button} href={PMWC_CHECKOUT_URL}>
                Enrol on this course
              </a>
              <p className={styles.checkoutNote}>Continue to WildTeam Training</p>
            </article>
          </div>
          <div className={styles.pricingHelp}>
            <p>
              <strong>Cost a barrier?</strong> Explore{" "}
              <a href="https://training.wildteam.org.uk/bursaries">WildTeam bursaries</a>.
            </p>
            <p>
              <strong>Learning together?</strong> See{" "}
              <a href="https://training.wildteam.org.uk/pricing-teams">team memberships</a>.
            </p>
          </div>
          <p className={styles.pricingTerms}>
            Purchases and learning take place on WildTeam Training. Review the current plan, renewal and
            cancellation terms there before enrolling. Already a member?{" "}
            <a href={PMWC_COURSE_URL}>Go to your course</a>.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.faq}`} id="course-questions">
        <div className={`shell ${styles.twoColumns}`}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>A little clarity before you start</p>
            <h2>
              Your questions,
              <br />
              <span>answered</span>
            </h2>
            <p>Still weighing it up? We’re happy to help you find the right next step.</p>
            <a className={styles.textLink} href="https://training.wildteam.org.uk/contact-us">
              Talk to the WildTeam team
            </a>
          </div>
          <div className={styles.faqList}>
            <CourseAccordion items={faqs.map(([title, answer]) => ({ title, content: <p>{answer}</p> }))} />
            <p className={styles.faqLinks}>
              <a href="https://training.wildteam.org.uk/course/gestion-de-projet-pour-la-conservation-de-la-nature">
                View the French course
              </a>
              <a href="https://training.wildteam.org.uk/pricing-teams">Explore team training</a>
            </p>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className="shell">
          <span className={styles.finalMark} aria-hidden="true" />
          <p className={styles.eyebrow}>For your next project, and the one after that</p>
          <h2>
            The work matters
            <br />
            Give yourself the skills to lead it
          </h2>
          <p>Take your next step with Project Management for Wildlife Conservation.</p>
          <a className={styles.button} href="#course-options">
            Start learning
          </a>
          <a className={styles.finalLink} href={PMWC_MANUAL_URL} target="_blank" rel="noopener noreferrer">
            Or start by reading the free best practice
          </a>
        </div>
      </section>
    </main>
  );
}
