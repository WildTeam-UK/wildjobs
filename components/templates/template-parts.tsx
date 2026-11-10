import Image from "next/image";
import "./training-banner.css";
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

export function LeafMark() {
  return (
    <span className="tpl-leaf-mark">
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
      <TrainingBanner compact courseTheme="green" />
    </aside>
  );
}

export function TrainingBanner({
  membership = false,
  courseTheme = "brand",
  compact = false,
}: {
  membership?: boolean;
  courseTheme?: "brand" | "green";
  compact?: boolean;
}) {
  const greenCourse = !membership && courseTheme === "green";
  const Heading = compact ? "h3" : "h2";
  return (
    <aside
      className={`tpl-training-banner${membership ? " tpl-training-banner--membership" : greenCourse ? " tpl-training-banner--green" : ""}${compact ? " tpl-training-banner--compact" : ""}`}
    >
      <div>
        <p className="eyebrow">{membership ? "WildTeam memberships" : "Free WildTeam course"}</p>
        <Heading>
          {membership
            ? "Keep growing and keep making a difference"
            : compact
              ? "Launching your career in conservation"
              : "Your next chapter starts with a plan"}
        </Heading>
        {compact ? (
          <p className="tpl-training-banner__description">
            Find your direction and plan your next steps towards a career in conservation
          </p>
        ) : (
          <p>
            {membership ? (
              "Build practical skills across conservation. Explore membership for access to WildTeam’s course collection."
            ) : (
              <>
                Find your direction, prepare your application and approach your next move with purpose. Start{" "}
                <strong>Launching Your Career in Wildlife Conservation</strong>
              </>
            )}
          </p>
        )}
        <a
          className="action"
          href={membership ? membershipUrl : careerCourseUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {membership
            ? "Explore memberships"
            : compact
              ? "Start learning, free"
              : "Start the free career course"}
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
            sizes={compact ? "(max-width: 1000px) 180px, 230px" : "(max-width: 1000px) 100vw, 400px"}
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
          </div>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <span className="tpl-course-tile__link">Explore this WildTeam course</span>
        </a>
      ))}
    </div>
  );
}
