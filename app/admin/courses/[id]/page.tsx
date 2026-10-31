import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addCourseCapability,
  addLearningOutcome,
  createCapability,
  removeCourseCapability,
  removeLearningOutcome,
  updateCourseProfile,
} from "@/app/admin/courses/actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Review course" };

type CoursePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
};

const successStatuses = new Set([
  "saved",
  "outcome-added",
  "outcome-removed",
  "mapping-saved",
  "mapping-removed",
  "capability-created",
]);

export default async function CoursePage({ params, searchParams }: CoursePageProps) {
  await requireStaff();
  const courseId = Number((await params).id);
  if (!Number.isSafeInteger(courseId) || courseId < 1) notFound();
  const supabase = await createClient();
  const [courseResult, outcomesResult, capabilitiesResult, mappingsResult] = await Promise.all([
    supabase.from("courses").select("*").eq("id", courseId).maybeSingle(),
    supabase
      .from("course_learning_outcomes")
      .select("*")
      .eq("course_id", courseId)
      .order("display_order")
      .order("id"),
    supabase
      .from("capabilities")
      .select("id, title, description, capability_aliases(alias)")
      .eq("is_active", true)
      .order("title"),
    supabase
      .from("course_capabilities")
      .select(
        "capability_id, coverage_score, is_primary, outcome_id, rationale, reviewed_at, capabilities(title)",
      )
      .eq("course_id", courseId)
      .order("is_primary", { ascending: false }),
  ]);
  if (courseResult.error || !courseResult.data) notFound();
  const course = courseResult.data;
  const outcomes = outcomesResult.data ?? [];
  const capabilities = capabilitiesResult.data ?? [];
  const mappings = mappingsResult.data ?? [];
  const query = await searchParams;

  return (
    <main className="staff-page">
      <div className="shell">
        <Link className="back-link" href="/admin/courses">
          <span aria-hidden="true">←</span> Course catalogue
        </Link>
      </div>
      {query.status ? (
        <div className="shell">
          <p
            className={`staff-form-message${successStatuses.has(query.status) ? "" : " staff-form-message--error"}`}
            role={successStatuses.has(query.status) ? "status" : "alert"}
          >
            {query.status === "mapping-required"
              ? "Add at least one reviewed capability before making this course visible as a filter."
              : successStatuses.has(query.status)
                ? "Course catalogue changes saved."
                : "That change could not be saved. Check the values and try again."}
          </p>
        </div>
      ) : null}

      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Course record</p>
          <h1>{course.title}</h1>
        </div>
        <p>
          LearnWorlds remains authoritative for availability and synced catalogue facts. WildJobs owns the
          presentation and matching metadata below.
        </p>
      </header>

      <section className="staff-section shell">
        <form className="staff-job-form" action={updateCourseProfile.bind(null, courseId)}>
          <fieldset>
            <legend>Editorial presentation</legend>
            <p>These values are preserved when the LearnWorlds catalogue sync runs.</p>
            <div className="staff-job-form__grid">
              <div>
                <label htmlFor="shortTitle">Short title</label>
                <input id="shortTitle" name="shortTitle" defaultValue={course.short_title} required />
              </div>
              <div>
                <label htmlFor="themeColour">Course colour</label>
                <input
                  id="themeColour"
                  name="themeColour"
                  defaultValue={course.theme_colour ?? ""}
                  placeholder="#6F2C91"
                  pattern="#[0-9A-Fa-f]{6}"
                />
              </div>
              <div className="staff-job-form__wide">
                <label htmlFor="summary">Description</label>
                <textarea id="summary" name="summary" defaultValue={course.summary} rows={5} required />
              </div>
              <div className="staff-job-form__wide">
                <label htmlFor="publicUrl">Public course URL</label>
                <input id="publicUrl" name="publicUrl" type="url" defaultValue={course.public_url} required />
              </div>
              <div>
                <label htmlFor="imageAlt">Image alternative text</label>
                <input id="imageAlt" name="imageAlt" defaultValue={course.image_alt ?? ""} />
              </div>
              <div>
                <label htmlFor="displayOrder">Display order</label>
                <input
                  id="displayOrder"
                  name="displayOrder"
                  type="number"
                  min="0"
                  defaultValue={course.display_order}
                />
              </div>
              <div className="staff-job-form__wide">
                <label className="staff-source-form__check">
                  <input name="isFilterVisible" type="checkbox" defaultChecked={course.is_filter_visible} />{" "}
                  Show this course as a job-search filter once mappings are reviewed
                </label>
              </div>
            </div>
          </fieldset>
          <div className="staff-job-form__actions">
            <div>
              <strong>Synced from LearnWorlds</strong>
              <p>
                Availability: {course.availability_status}. Last sync:{" "}
                {course.learnworlds_synced_at
                  ? new Date(course.learnworlds_synced_at).toLocaleString("en-GB")
                  : "not recorded"}
                .
              </p>
            </div>
            <button className="action" type="submit">
              Save course
            </button>
          </div>
        </form>
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Verified learning</p>
            <h2>Learning outcomes</h2>
          </div>
          <p>Use an official course page or approved curriculum as the source.</p>
        </div>
        <div className="course-admin-grid">
          <div className="review-list">
            {outcomes.length ? (
              outcomes.map((outcome) => (
                <article className="course-admin-card" key={outcome.id}>
                  <div>
                    <strong>{outcome.outcome_text}</strong>
                    <p>
                      {outcome.source_url ? (
                        <a href={outcome.source_url}>View source</a>
                      ) : (
                        "Source held in course review"
                      )}
                    </p>
                  </div>
                  <form action={removeLearningOutcome.bind(null, courseId)}>
                    <input type="hidden" name="outcomeId" value={outcome.id} />
                    <button className="staff-source-toggle" type="submit">
                      Remove
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <p>No reviewed learning outcomes yet.</p>
            )}
          </div>
          <form className="staff-source-form" action={addLearningOutcome.bind(null, courseId)}>
            <h2>Add outcome</h2>
            <label htmlFor="outcomeText">Learner can…</label>
            <textarea id="outcomeText" name="outcomeText" rows={5} required />
            <label htmlFor="sourceUrl">Official source URL</label>
            <input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://" required />
            <button className="action" type="submit">
              Add outcome
            </button>
          </form>
        </div>
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Matching graph</p>
            <h2>Course capabilities</h2>
          </div>
          <p>Primary means the course teaches it directly; supporting means it contributes to it.</p>
        </div>
        <div className="course-admin-grid">
          <div className="review-list">
            {mappings.length ? (
              mappings.map((mapping) => (
                <article className="course-admin-card" key={mapping.capability_id}>
                  <div>
                    <span className="eyebrow">
                      {mapping.is_primary ? "Primary" : "Supporting"} · {mapping.coverage_score}% coverage
                    </span>
                    <strong>{mapping.capabilities?.title ?? "Capability"}</strong>
                    <p>{mapping.rationale ?? "No rationale recorded."}</p>
                  </div>
                  <form action={removeCourseCapability.bind(null, courseId)}>
                    <input type="hidden" name="capabilityId" value={mapping.capability_id} />
                    <button className="staff-source-toggle" type="submit">
                      Remove
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <p>No capabilities are mapped, so this course cannot appear as a filter yet.</p>
            )}
          </div>
          <form className="staff-source-form" action={addCourseCapability.bind(null, courseId)}>
            <h2>Add or update mapping</h2>
            <label htmlFor="capabilityId">Canonical capability</label>
            <select id="capabilityId" name="capabilityId" required>
              <option value="">Choose one</option>
              {capabilities.map((capability) => (
                <option key={capability.id} value={capability.id}>
                  {capability.title}
                </option>
              ))}
            </select>
            <label htmlFor="outcomeId">Learning outcome</label>
            <select id="outcomeId" name="outcomeId">
              <option value="">Whole course</option>
              {outcomes.map((outcome) => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.outcome_text.slice(0, 80)}
                </option>
              ))}
            </select>
            <label htmlFor="coverageScore">Coverage score</label>
            <input
              id="coverageScore"
              name="coverageScore"
              type="number"
              min="1"
              max="100"
              defaultValue="80"
              required
            />
            <label htmlFor="rationale">Rationale</label>
            <textarea id="rationale" name="rationale" rows={4} />
            <label className="staff-source-form__check">
              <input name="isPrimary" type="checkbox" /> Primary capability
            </label>
            <button className="action" type="submit">
              Save mapping
            </button>
          </form>
        </div>
      </section>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Reusable taxonomy</p>
            <h2>Create a capability</h2>
          </div>
          <p>Search the list above first. Aliases help the classifier reuse this concept.</p>
        </div>
        <form className="staff-job-form" action={createCapability.bind(null, courseId)}>
          <fieldset>
            <div className="staff-job-form__grid">
              <div>
                <label htmlFor="title">Title</label>
                <input id="title" name="title" required />
              </div>
              <div>
                <label htmlFor="slug">Stable slug</label>
                <input id="slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
              </div>
              <div className="staff-job-form__wide">
                <label htmlFor="description">Definition</label>
                <textarea id="description" name="description" rows={4} required />
              </div>
              <div className="staff-job-form__wide">
                <label htmlFor="aliases">
                  Aliases <span>comma separated</span>
                </label>
                <input id="aliases" name="aliases" />
              </div>
            </div>
          </fieldset>
          <div className="staff-job-form__actions">
            <p>
              It will be added to this course as a supporting capability. Then review its coverage and outcome
              above.
            </p>
            <button className="action" type="submit">
              Create capability
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
