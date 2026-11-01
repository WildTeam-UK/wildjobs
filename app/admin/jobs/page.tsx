import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { directoryDeadline, isDirectoryJobLive } from "@/lib/directory-lifecycle";
export default async function JobsAdmin() {
  await requireStaff();
  const { data, error } = await createTrustedClient()
    .from("directory_jobs")
    .select("*")
    .order("posted_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Jobs could not be loaded.");
  return (
    <main className="staff-page directory-admin">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Feed jobs</p>
          <h1>Directory cards.</h1>
        </div>
        <p>
          Jobs retire at the advertised closing date, or 30 days after posting when no date is supplied. Feed
          changes update the card automatically.
        </p>
      </header>
      <section className="staff-section shell">
        {data.map((j) => (
          <details key={j.id}>
            <summary>
              {!j.is_active ? "No longer in feed" : isDirectoryJobLive(j) ? "Live" : "Retired"} · {j.title} —{" "}
              {j.organisation_name}
            </summary>
            <p>{j.summary}</p>
            <p>
              {j.location_text} · {j.salary_text} · {j.workplace}
            </p>
            <p>Sectors: {j.sector_slugs.join(", ") || "Awaiting AI"}</p>
            <p>Courses: {j.course_slugs.join(", ") || "None"}</p>
            <p>
              {j.processed_hash === j.feed_hash ? "AI enrichment complete" : "Awaiting AI enrichment"} ·
              Posted {new Date(j.posted_at).toLocaleDateString("en-GB")}
            </p>
            <p>
              {j.closes_at ? "Closes" : "Retires"}{" "}
              {new Date(directoryDeadline(j.posted_at, j.closes_at)).toLocaleString("en-GB", {
                timeZone: "Europe/London",
              })}
            </p>
            <a href={j.source_url}>Original advert →</a>
          </details>
        ))}
      </section>
    </main>
  );
}
