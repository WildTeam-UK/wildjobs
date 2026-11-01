import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { updateCourse } from "../actions";
import { SubmitButton } from "@/components/submit-button";
export default async function CoursesAdmin() {
  await requireStaff();
  const { data, error } = await createTrustedClient()
    .from("courses")
    .select("slug,title,summary,matching_notes,is_filter_visible,public_url")
    .eq("is_active", true)
    .eq("availability_status", "available")
    .order("title");
  if (error) throw new Error("Courses could not be loaded.");
  return (
    <main className="staff-page directory-admin">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">WildTeam courses</p>
          <h1>Direct matches to the work.</h1>
        </div>
        <p>AI uses the course description and these optional notes when matching new or changed feed jobs.</p>
      </header>
      <section className="staff-section shell">
        {data.map((c) => (
          <form action={updateCourse} key={c.slug}>
            <h2>
              <a href={c.public_url} target="_blank" rel="noopener noreferrer">
                {c.title}
              </a>
            </h2>
            <p>{c.summary}</p>
            <input name="slug" type="hidden" value={c.slug} />
            <label>
              <input type="checkbox" name="enabled" defaultChecked={c.is_filter_visible} /> Available for job
              matches
            </label>
            <label>
              Matching notes
              <textarea name="matching_notes" defaultValue={c.matching_notes} maxLength={3000} rows={3} />
            </label>
            <SubmitButton idleLabel="Save course settings" pendingLabel="Saving…" />
          </form>
        ))}
      </section>
    </main>
  );
}
