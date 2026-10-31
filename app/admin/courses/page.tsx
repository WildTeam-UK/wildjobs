import type { Metadata } from "next";
import Link from "next/link";

import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Course catalogue" };

export default async function CoursesPage() {
  await requireStaff();
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
        <p>
          Synced course facts stay separate from WildJobs editorial presentation, outcomes and capability
          mappings.
        </p>
      </header>

      <section className="staff-section shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Approved courses</p>
            <h2>{courses?.length ?? 0} records</h2>
          </div>
          <p>A course only appears as a public filter after it has a reviewed capability mapping.</p>
        </div>
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
