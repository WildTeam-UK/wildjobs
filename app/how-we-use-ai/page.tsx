import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "How we use AI",
  description: "How WildJobs uses AI for job summaries, sectors and relevant training suggestions.",
};

function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M10 2c.7 5.5 3 7.8 8.5 8.5C13 11.2 10.7 13.5 10 19c-.7-5.5-3-7.8-8.5-8.5C7 9.8 9.3 7.5 10 2Zm9 12c.3 2.6 1.4 3.7 4 4-2.6.3-3.7 1.4-4 4-.3-2.6-1.4-3.7-4-4 2.6-.3 3.7-1.4 4-4Z" />
    </svg>
  );
}

const features = [
  {
    number: "01",
    title: "A useful first look.",
    text: "We turn the job description into a concise summary of the work and requirements, so you can decide which opportunities to explore in full.",
    detail: "Job summaries",
  },
  {
    number: "02",
    title: "A place to start.",
    text: "We suggest sectors that fit the role, helping you discover work connected to your interests, from ecology to climate and sustainability.",
    detail: "Relevant sectors",
  },
  {
    number: "03",
    title: "A connection to learning.",
    text: "We match the responsibilities in an advert with WildTeam course topics, pointing you towards skills that could support your application and development.",
    detail: "Course suggestions",
  },
];

export default function HowWeUseAIPage() {
  return (
    <main className={styles.page}>
      <section className={"shell " + styles.hero}>
        <div>
          <h1>
            How we use AI.
            <br />
            <span className={styles.gradient}>A clearer first look.</span>
          </h1>
          <p className={styles.lead}>
            Finding your place in conservation takes time. We use AI to make job adverts easier to explore, so
            you can spend more of yours on the opportunities that matter to you.
          </p>
          <a className="action" href="#where-ai-helps">
            SEE HOW IT WORKS <span aria-hidden="true">↓</span>
          </a>
        </div>
        <figure className={styles.visual} aria-label="The information AI helps organise on a WildJobs card">
          <div className={styles.source}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path d="M14 3H6v18h12V7l-4-4Zm0 0v5h4M9 12h6m-6 4h6" />
            </svg>
            <div>
              <span>OUR STARTING POINT</span>
              <strong>The original job advert</strong>
            </div>
            <span className={styles.sourceArrow} aria-hidden="true">
              ↗
            </span>
          </div>
          <div className={styles.connector} aria-hidden="true">
            <Sparkle />
          </div>
          <div className={styles.card}>
            <div className={styles.summary}>
              <span className={styles.summaryLabel}>
                <Sparkle /> AI SUMMARY
              </span>
              <p>
                The work, the requirements and the purpose of the role, brought together in one concise
                overview.
              </p>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>EXPLORE THE SECTOR</span>
              <div className={styles.pills}>
                <span>Wildlife Conservation</span>
                <span>Ecology</span>
              </div>
            </div>
            <div className={styles.cardRow}>
              <span className={styles.cardLabel}>CONNECT WITH LEARNING</span>
              <div className={styles.pills + " " + styles.coursePills}>
                <span>Project Management</span>
                <span>Grant Writing</span>
              </div>
            </div>
          </div>
          <figcaption className={styles.caption}>
            A quick overview, with a route back to the full story.
          </figcaption>
        </figure>
      </section>

      <section className={styles.featureSection} id="where-ai-helps">
        <div className="shell">
          <div className={styles.sectionIntro}>
            <h2>
              Three ways AI helps
              <br />
              <span className={styles.gradient}>you explore.</span>
            </h2>
            <p>
              Our starting point is the information in the advert. Here’s how we make it easier to browse.
            </p>
          </div>
          <div className={styles.features}>
            {features.map((feature) => (
              <article className={styles.feature} key={feature.number}>
                <span className={styles.number}>{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <span className={styles.featureDetail}>{feature.detail}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={"shell " + styles.original}>
        <div>
          <span className={styles.sectionLabel}>BEFORE YOU APPLY</span>
          <h2>
            The original advert
            <br />
            <span className={styles.gradient}>comes first.</span>
          </h2>
          <p>
            AI can miss context or make mistakes, and job details can change. Treat our summary as your
            introduction, then follow the job title to the full advert.
          </p>
        </div>
        <ol className={styles.checklist}>
          <li>
            <span aria-hidden="true">↗</span>
            <div>
              <h3>Read the whole role.</h3>
              <p>Get the employer’s full description and understand what they need.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">↗</span>
            <div>
              <h3>Check the details.</h3>
              <p>Confirm the pay, location, deadline and application instructions.</p>
            </div>
          </li>
          <li>
            <span aria-hidden="true">↗</span>
            <div>
              <h3>Make it your decision.</h3>
              <p>Consider how the work fits your experience, interests and next step.</p>
            </div>
          </li>
        </ol>
      </section>

      <aside className={"shell " + styles.learning}>
        <div>
          <span className={styles.sectionLabel}>USEFUL LEARNING. YOUR CHOICE.</span>
          <h2>Why these courses?</h2>
          <p>
            WildTeam provides the training we recommend, and some courses are paid. Suggestions are optional:
            they do not mean the employer requires or endorses a course, and training does not guarantee an
            interview or a job.
          </p>
          <Link className="action" href="/course-recommendations">
            ABOUT OUR RECOMMENDATIONS <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className={styles.nextStep}>
          <Sparkle />
          <h3>
            Your next role <br />
            could be out there.
          </h3>
          <Link href="/">
            EXPLORE THE JOBS <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>
    </main>
  );
}
