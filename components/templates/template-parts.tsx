import Image from "next/image";
import type { ReactNode } from "react";

export const careerCourseUrl =
  "https://training.wildteam.org.uk/course/launching-your-career-in-wildlife-conservation";
export const membershipUrl = "https://training.wildteam.org.uk/memberships";
export const trainingCourses = [
  {
    title: "Project Management",
    slug: "project-management-for-wildlife-conservation",
    description: "Turn an ambition for nature into a project you can organise, deliver and learn from.",
    colour: "purple",
  },
  {
    title: "Stakeholder Engagement",
    slug: "stakeholder-engagement-for-wildlife-conservation",
    description:
      "Work more thoughtfully with the people whose knowledge, interests and decisions shape conservation.",
    colour: "teal",
  },
  {
    title: "Grant Writing",
    slug: "grant-writing",
    description: "Build a clear, persuasive case for supporting a conservation project.",
    colour: "pink",
  },
] as const;

export function LeafMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`tpl-leaf-mark${small ? " tpl-leaf-mark--small" : ""}`}>
      <svg aria-hidden="true" viewBox="0 0 48 48">
        <path d="M37 9C19 9 10 18 12 29c2 9 12 12 19 5 6-6 7-15 6-25Z" />
        <path d="M10 39c6-12 12-18 21-24M18 27l-1-8M24 22l8 1" />
      </svg>
    </span>
  );
}

export function Sparkle() {
  return (
    <svg className="tpl-sparkle" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M11 2c.6 5.5 3 8 9 9-6 .7-8.4 3.3-9 9-.8-5.7-3.3-8.3-9-9 5.7-1 8.2-3.5 9-9Zm8 13c.2 2.1 1.1 3 3 3.5-1.9.3-2.8 1.2-3 3.5-.3-2.3-1.2-3.2-3-3.5 1.8-.5 2.7-1.4 3-3.5Z" />
    </svg>
  );
}

export function TemplatePhoto({
  kind = "woodland",
  priority = false,
}: {
  kind?: "woodland" | "wetland";
  priority?: boolean;
}) {
  const woodland = kind === "woodland";
  return (
    <figure className="tpl-photo">
      <Image
        src={`/images/design/${kind}.jpg`}
        alt={
          woodland
            ? "Morning sunlight falling through woodland trees"
            : "Trees and reeds reflected in a quiet wetland at sunrise"
        }
        width={1800}
        height={1200}
        sizes="(max-width: 800px) 100vw, 60vw"
        preload={priority}
      />
      <figcaption>
        <a
          href={
            woodland ? "https://unsplash.com/photos/pN3Z2usSIQw" : "https://unsplash.com/photos/2lPR-5MUliw"
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          {woodland ? "Darren Bockman" : "Pascal Debrunner"} / Unsplash ↗
        </a>
      </figcaption>
    </figure>
  );
}

export function ExampleStats({
  items,
  note = "UK vacancies · Past 12 months",
}: {
  items: readonly { value: string; label: string; detail?: string }[];
  note?: string;
}) {
  return (
    <section className="tpl-stats" aria-label="Job-market snapshot">
      <div className="tpl-stats__caption">
        <span className="eyebrow">A snapshot of the opportunities</span>
        <span>{note}</span>
      </div>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className="tpl-stats__value">{item.value}</dd>
            {item.detail ? <dd className="tpl-stats__detail">{item.detail}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ComparisonList({
  label,
  items,
}: {
  label: string;
  items: readonly { title: string; description: string; valueLabel: string; value: string; href?: string }[];
}) {
  return (
    <dl className="tpl-comparison" aria-label={label}>
      {items.map((item, index) => (
        <div className="tpl-comparison__row" key={item.title}>
          <dt>
            <span className="tpl-comparison__number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </dt>
          <dd>
            <span className="tpl-comparison__label">{item.valueLabel}</span>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noopener noreferrer">
                {item.value}
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <strong>{item.value}</strong>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function GuideSection({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="tpl-guide-section" id={id}>
      <p className="eyebrow">{number}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function GuideContents({ items }: { items: readonly { id: string; label: string }[] }) {
  return (
    <aside className="tpl-contents">
      <nav aria-label="On this page">
        <p className="eyebrow">In this guide</p>
        {items.map((item, index) => (
          <a href={`#${item.id}`} key={item.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="tpl-contents__course">
        <Sparkle />
        <h3>A good place to start.</h3>
        <p>Make a plan for your next move with our free career course.</p>
        <a href={careerCourseUrl} target="_blank" rel="noopener noreferrer">
          Start learning, free ↗
        </a>
      </div>
    </aside>
  );
}

export function TrainingBanner({
  membership = false,
  courseTheme = "brand",
}: {
  membership?: boolean;
  courseTheme?: "brand" | "green";
}) {
  const greenCourse = !membership && courseTheme === "green";
  return (
    <aside
      className={`tpl-training-banner${membership ? " tpl-training-banner--membership" : greenCourse ? " tpl-training-banner--green" : ""}`}
    >
      <div>
        <p className="eyebrow">{membership ? "WildTeam memberships" : "Free WildTeam course"}</p>
        <h2>
          {membership ? "Keep growing. Keep making a difference." : "Your next chapter starts with a plan."}
        </h2>
        <p>
          {membership ? (
            "Build practical skills across conservation. Explore membership for access to WildTeam’s course collection."
          ) : (
            <>
              Find your direction, prepare your application and approach your next move with purpose. Start{" "}
              <strong>Launching Your Career in Wildlife Conservation.</strong>
            </>
          )}
        </p>
        <a
          className="action"
          href={membership ? membershipUrl : careerCourseUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {membership ? "Explore memberships" : "Start the free career course"}{" "}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
      <div className="tpl-training-banner__art" aria-hidden="true">
        {membership ? (
          <>
            <span>
              Skills for
              <br />a wilder future.
            </span>
            <Sparkle />
          </>
        ) : (
          <Image
            src={
              greenCourse ? "/images/career-course-eco-explorers.png" : "/images/job-training-cta-pastel.jpg"
            }
            alt=""
            fill
            sizes="(max-width: 1000px) 100vw, 400px"
          />
        )}
      </div>
    </aside>
  );
}

export function CourseTiles() {
  return (
    <div className="tpl-course-tiles">
      {trainingCourses.map((course, index) => (
        <a
          className={`tpl-course-tile tpl-course-tile--${course.colour}`}
          key={course.slug}
          href={`https://training.wildteam.org.uk/course/${course.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div>
            <span className="tpl-course-tile__number">0{index + 1}</span>
            <span aria-hidden="true">↗</span>
          </div>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <span className="tpl-course-tile__link">Explore this WildTeam course</span>
        </a>
      ))}
    </div>
  );
}

const exampleJobs = {
  career: [
    {
      title: "Assistant Ecologist",
      organisation: "River & Root Ecology",
      location: "Bristol · Hybrid",
      salary: "£26,000 – £30,000 per year",
      text: "Help turn field observations into practical advice. Support habitat surveys, map findings and contribute to clear ecological reports, with guidance from an experienced team.",
    },
    {
      title: "Ecologist",
      organisation: "Wildmere Nature Trust",
      location: "Somerset · On-site",
      salary: "£31,000 – £36,000 per year",
      text: "Bring ecological evidence into habitat restoration. Plan surveys, work with land managers and help monitor the difference made for wildlife across a network of reserves.",
    },
  ],
  employer: [
    {
      title: "Ecologist",
      organisation: "Wildmere Nature Trust",
      location: "Somerset · On-site",
      salary: "£31,000 – £36,000 per year",
      text: "Connect fieldwork, analysis and practical habitat management. Work with the reserves team to understand species and habitats, shape restoration plans and communicate findings.",
    },
    {
      title: "Community Conservation Officer",
      organisation: "Wildmere Nature Trust",
      location: "Taunton · Hybrid",
      salary: "£28,000 – £32,000 per year",
      text: "Help more people take part in nature recovery. Build relationships with local groups, support accessible events and turn community ideas into practical conservation activities.",
    },
    {
      title: "Conservation Project Manager",
      organisation: "Wildmere Nature Trust",
      location: "South West · Hybrid",
      salary: "£37,000 – £42,000 per year",
      text: "Bring partners together around a landscape restoration programme. Coordinate delivery, budgets and reporting, keeping the project focused on its agreed conservation outcomes.",
    },
  ],
} as const;

export function ExampleJobs({ employer = false }: { employer?: boolean }) {
  return (
    <div className="tpl-example-jobs">
      {exampleJobs[employer ? "employer" : "career"].map((job) => (
        <article className="tpl-example-job" key={job.title}>
          <header>
            <LeafMark small />
            <div>
              <h3>{job.title}</h3>
              <p>{job.organisation}</p>
            </div>
            <span className="tpl-example-badge">Open role</span>
          </header>
          <div className="tpl-example-job__summary">
            <span>
              <Sparkle /> AI summary
            </span>
            <p>{job.text}</p>
          </div>
          <ul>
            <li>{job.location}</li>
            <li>{job.salary}</li>
            <li>Full time</li>
          </ul>
          <details>
            <summary>
              Read the role brief <span aria-hidden="true">↗</span>
            </summary>
            <p>
              This role combines practical experience with clear communication and thoughtful teamwork. You
              will help plan and deliver activities, keep reliable records and share what you learn with
              colleagues and partners. We are looking for an organised, collaborative person who can connect
              their skills with the work of nature recovery.
            </p>
          </details>
        </article>
      ))}
    </div>
  );
}
