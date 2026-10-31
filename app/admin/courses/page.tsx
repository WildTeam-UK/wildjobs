import type { Metadata } from "next";
import Link from "next/link";

import { generateCourseCapabilitiesNow, syncLearnWorldsCourses } from "@/app/admin/courses/actions";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Course catalogue" };

type CoursesPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  "ai-not-configured": "Course capability generation is not configured for this environment.",
  "capability-generation-failed":
    "Course capabilities could not be generated. Existing reviewed mappings were preserved.",
  "not-configured": "The LearnWorlds catalogue connection is not configured for this environment.",
  "sync-failed": "LearnWorlds could not be reached. The existing reviewed catalogue was kept unchanged.",
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const staff = await requireStaff();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: courses, error } = await supabase
    .from("courses")
    .select(
      "id, title, short_title, availability_status, is_active, is_filter_visible, theme_colour, learnworlds_synced_at, course_capabilities(capability_id)",
    )
    .order("display_order")
    .order("title");

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">LearnWorlds catalogue</p>
          <h1>Review courses and their job signals.</h1>
        </div>
        <div className="staff-hero__stack">
          <p>
            Synced course facts stay separate from WildJobs editorial presentation, outcomes and capability
            mappings.
          </p>
          {staff.role === "admin" ? (
            <div className="staff-hero__stack">
              <form action={syncLearnWorldsCourses}>
                <button className="staff-source-toggle" type="submit">
                  Sync LearnWorlds now
                </button>
              </form>
              <form action={generateCourseCapabilitiesNow}>
                <button className="staff-source-toggle" type="submit">
                  Generate capabilities now
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Approved courses</p>
            <h2>{courses?.length ?? 0} records</h2>
          </div>
          <p>A course appears as a public filter once it has an evidence-backed capability mapping.</p>
        </div>
        {params.status === "synced" ? (
          <p className="staff-form-message" role="status">
            LearnWorlds catalogue synced. Reviewed presentation and capability mappings were preserved.
          </p>
        ) : null}
        {params.status === "capabilities-generated" ? (
          <p className="staff-form-message" role="status">
            Course capabilities and learning outcomes generated. Existing staff-reviewed mappings were
            preserved.
          </p>
        ) : null}
        {params.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            {errorMessages[params.error] ?? errorMessages["sync-failed"]}
          </p>
        ) : null}
        {error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Course records are temporarily unavailable.
          </p>
        ) : courses?.length ? (
          <div className="source-list">
            {courses.map((course) => (
              <article key={course.id}>
                <div>
                  <span className="eyebrow">{course.availability_status.replaceAll("_", " ")}</span>
                  <h3>
                    <Link href={`/admin/courses/${course.id}`}>{course.short_title}</Link>
                  </h3>
                  <p>{course.title}</p>
                </div>
                <div className="source-list__actions">
                  <span>{course.course_capabilities.length} capabilities</span>
                  <strong>{course.is_filter_visible ? "Filter visible" : "Filter hidden"}</strong>
                  <Link href={`/admin/courses/${course.id}`}>Review course</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="staff-empty-state">
            <h2>No approved courses have synced yet.</h2>
          </div>
        )}
      </section>
    </main>
  );
}
