import { requireAdministrator } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { SubmitButton } from "@/components/submit-button";
import { addSource, changeSource } from "./actions";
export const maxDuration = 150;
export default async function SourcesAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdministrator();
  const [sources, settings, params] = await Promise.all([
    createTrustedClient().from("directory_sources").select("*").is("removed_at", null).order("id"),
    createTrustedClient().from("directory_settings").select("enabled").single(),
    searchParams,
  ]);
  if (sources.error || settings.error) throw new Error("Sources could not be loaded.");
  const when = (date: string | null) =>
    date ? new Date(date).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Not yet";
  return (
    <main className="staff-page directory-admin">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Job feeds</p>
          <h1>Sources.</h1>
        </div>
        <p>
          Add a feed URL. Jobs use the same summaries, sectors, course matching and retirement rules.
          Duplicates share one card.
        </p>
      </header>
      <section className="staff-section shell" aria-labelledby="add-source-heading">
        <h2 id="add-source-heading">Add a source</h2>
        {typeof params.error === "string" ? <p role="alert">{params.error}</p> : null}
        {params.added ? (
          <p role="status">Source added. Its first import is queued automatically.</p>
        ) : params.updated ? (
          <p role="status">Source updated.</p>
        ) : null}
        {!settings.data.enabled ? (
          <p>Automatic imports are paused. Enable them from the overview, or use Refresh now.</p>
        ) : null}
        <form action={addSource}>
          <label>
            Feed URL
            <input
              type="url"
              name="feed_url"
              placeholder="https://example.org/jobs.rss"
              required
              maxLength={2048}
            />
          </label>
          <p className="directory-source-help">Use a public RSS or Atom job feed.</p>
          <label>
            Source name (optional)
            <input name="name" maxLength={160} placeholder="Uses the feed’s name" />
          </label>
          <SubmitButton idleLabel="Add source" pendingLabel="Checking feed…" />
        </form>
      </section>
      <section className="staff-section shell" aria-label="Current sources">
        <div className="directory-source-list">
          {sources.data.map((source) => (
            <article className="directory-source-card" key={source.id}>
              <h2>{source.name}</h2>
              <p>
                <a href={source.feed_url} target="_blank" rel="noopener noreferrer">
                  {source.feed_url}
                </a>
              </p>
              <p>
                <strong>{source.enabled ? "Importing automatically" : "Imports paused"}</strong> ·{" "}
                {source.last_seen_count} listings in the last successful import
              </p>
              <p>
                Last import: {when(source.last_feed_at)}
                {source.enabled ? ` · Next: ${when(source.next_feed_at)}` : ""}
              </p>
              {source.last_error ? <p role="alert">Latest import: {source.last_error}</p> : null}
              <div className="directory-source-actions">
                {[source.enabled ? "pause" : "resume", "refresh", "remove"].map((action) => (
                  <form action={changeSource} key={action}>
                    <input type="hidden" name="id" value={source.id} />
                    <input type="hidden" name="action" value={action} />
                    <SubmitButton
                      idleLabel={
                        action === "pause"
                          ? "Pause imports"
                          : action === "resume"
                            ? "Resume imports"
                            : action === "refresh"
                              ? "Refresh now"
                              : "Remove source"
                      }
                      pendingLabel={action === "refresh" ? "Refreshing…" : "Saving…"}
                    />
                  </form>
                ))}
              </div>
              <details>
                <summary>Rename source</summary>
                <form action={changeSource}>
                  <input type="hidden" name="id" value={source.id} />
                  <input type="hidden" name="action" value="rename" />
                  <label>
                    Name
                    <input name="name" defaultValue={source.name} maxLength={160} required />
                  </label>
                  <SubmitButton idleLabel="Save name" pendingLabel="Saving…" />
                </form>
              </details>
            </article>
          ))}
        </div>
        <p>
          Pausing stops imports; current jobs stay available until they close or retire. Removing a source
          removes its listings from the directory. Jobs supplied by another source stay live. Add the same URL
          again to restore a removed source.
        </p>
      </section>
    </main>
  );
}
