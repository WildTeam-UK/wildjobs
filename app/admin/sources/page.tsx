import { requireAdministrator } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { SubmitButton } from "@/components/submit-button";
import type { SourcePreview } from "@/lib/source-config";
import { addSource, changeSource, queueCatalogue, checkNextBatch } from "./actions";
import { SourceSettings } from "./source-settings";
import styles from "./sources.module.css";

export const maxDuration = 150;
export default async function SourcesAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdministrator();
  const db = createTrustedClient();
  const [sources, settings, events, params] = await Promise.all([
    db.from("directory_sources").select("*").order("id"),
    db.from("directory_settings").select("enabled").single(),
    db
      .from("directory_source_events")
      .select("source_id,action,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    searchParams,
  ]);
  if (sources.error || settings.error || events.error)
    throw new Error(
      "Sources could not be loaded. Check that the source-catalogue migration has been applied.",
    );
  const when = (date: string | null) =>
    date ? new Date(date).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Not yet";
  return (
    <main className={`staff-page directory-admin ${styles.workspace}`}>
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Job imports</p>
          <h1>Sources</h1>
        </div>
        <p>
          Add a careers page, recruitment board, feed or individual advert. Check its preview, then enable
          imports.
        </p>
      </header>
      <section className="staff-section shell" aria-labelledby="add-source-heading">
        <h2 id="add-source-heading">Add a source</h2>
        {typeof params.error === "string" ? <p role="alert">{params.error}</p> : null}
        {typeof params.message === "string" ? <p role="status">{params.message}</p> : null}
        {!settings.data.enabled ? (
          <p>
            Automatic imports are paused globally. Enable them from the overview when your sources are ready.
          </p>
        ) : null}
        <form action={addSource} className={styles.form}>
          <label>
            Source URL
            <input
              type="url"
              name="feed_url"
              required
              maxLength={2048}
              placeholder="https://example.org/careers"
            />
          </label>
          <label>
            Source name
            <input name="name" maxLength={160} placeholder="Uses the website name if blank" />
          </label>
          <SourceSettings />
          <SubmitButton idleLabel="Save and check source" pendingLabel="Checking source…" />
        </form>
        <details className={styles.catalogue}>
          <summary>November conservation sources list</summary>
          <p>
            Queue the proposed sources with imports paused. Existing entries are preserved. Checks read public
            sources and do not publish jobs.
          </p>
          <div className="directory-source-actions">
            <form action={queueCatalogue}>
              <SubmitButton idleLabel="Queue proposed catalogue" pendingLabel="Saving catalogue…" />
            </form>
            <form action={checkNextBatch}>
              <SubmitButton idleLabel="Check next 3 untested sources" pendingLabel="Checking batch…" />
            </form>
          </div>
        </details>
      </section>
      <section className="staff-section shell" aria-label="Current sources">
        <div className="directory-source-list">
          {sources.data
            .filter((s) => !s.removed_at)
            .map((source) => {
              const result =
                source.check_result &&
                typeof source.check_result === "object" &&
                !Array.isArray(source.check_result)
                  ? source.check_result
                  : null;
              const preview = result?.complete === true ? (result as unknown as SourcePreview) : null;
              return (
                <article className="directory-source-card" key={source.id}>
                  <h2>{source.name}</h2>
                  <p className={styles.url}>
                    <a href={source.feed_url} target="_blank" rel="noopener noreferrer">
                      {source.feed_url}
                    </a>
                  </p>
                  <p>
                    <strong>{source.enabled ? "Importing automatically" : "Imports paused"}</strong> ·{" "}
                    {source.last_seen_count} listings in the last successful import
                  </p>
                  <p>
                    Last check: {when(source.checked_at)} · Last import: {when(source.last_feed_at)}
                    {source.enabled ? ` · Next: ${when(source.next_feed_at)}` : ""}
                  </p>
                  {source.last_error ? <p role="alert">Needs attention: {source.last_error}</p> : null}
                  {preview ? (
                    <details open={!source.enabled}>
                      <summary>
                        Preview: {preview.liveCount ?? preview.count} current jobs · {preview.count} listed ·{" "}
                        {preview.kind} · {preview.pages} pages
                      </summary>
                      {preview.count === 0 ? (
                        <p>This source was checked successfully and has no importable vacancies.</p>
                      ) : (
                        <ul className={styles.preview}>
                          {preview.jobs.map((job) => (
                            <li key={job.url}>
                              <a href={job.url} target="_blank" rel="noopener noreferrer">
                                {job.title}
                              </a>
                              <span>
                                {job.organisation} · {job.location}
                                {job.closesAt ? ` · Closes ${when(job.closesAt)}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {preview.count > preview.jobs.length ? (
                        <p>Showing the first {preview.jobs.length} jobs.</p>
                      ) : null}
                    </details>
                  ) : null}
                  <div className="directory-source-actions">
                    {[
                      "check",
                      "refresh",
                      ...(source.enabled ? ["pause"] : preview ? ["resume"] : []),
                      "remove",
                    ].map((action) => (
                      <form action={changeSource} key={action}>
                        <input type="hidden" name="id" value={source.id} />
                        <input type="hidden" name="action" value={action} />
                        {action === "resume" && !source.reviewed_at ? (
                          <label className={styles.review}>
                            <input type="checkbox" name="reviewed" required />I have checked this source’s
                            access and reuse conditions for WildJobs.
                          </label>
                        ) : null}
                        <SubmitButton
                          idleLabel={
                            action === "check"
                              ? "Check source"
                              : action === "refresh"
                                ? "Refresh now"
                                : action === "pause"
                                  ? "Pause imports"
                                  : action === "resume"
                                    ? "Enable imports"
                                    : "Remove source"
                          }
                          pendingLabel="Working…"
                        />
                      </form>
                    ))}
                  </div>
                  <details>
                    <summary>Edit source settings</summary>
                    <p>
                      Saving settings pauses imports and replaces the preview. Existing jobs keep their
                      closing dates while you check the new settings.
                    </p>
                    <form action={addSource} className={styles.form}>
                      <input type="hidden" name="id" value={source.id} />
                      <label>
                        Source URL
                        <input
                          type="url"
                          name="feed_url"
                          required
                          defaultValue={source.feed_url}
                          maxLength={2048}
                        />
                      </label>
                      <label>
                        Source name
                        <input name="name" required defaultValue={source.name} maxLength={160} />
                      </label>
                      <SourceSettings configuration={source.configuration} notes={source.notes} />
                      <SubmitButton idleLabel="Save and check changes" pendingLabel="Checking changes…" />
                    </form>
                  </details>
                  <details>
                    <summary>Recent source activity</summary>
                    <ul>
                      {events.data
                        .filter((event) => event.source_id === source.id)
                        .slice(0, 5)
                        .map((event, index) => (
                          <li key={`${event.created_at}-${index}`}>
                            {event.action} · {when(event.created_at)}
                          </li>
                        ))}
                    </ul>
                  </details>
                </article>
              );
            })}
        </div>
        <p>
          Pausing preserves current jobs until they close or retire. Removal withdraws this source’s listings;
          jobs supplied by other sources remain available.
        </p>
        <details>
          <summary>Removed sources</summary>
          {sources.data
            .filter((s) => s.removed_at)
            .map((source) => (
              <form action={changeSource} key={source.id} className={styles.restore}>
                <span>{source.name}</span>
                <input type="hidden" name="id" value={source.id} />
                <input type="hidden" name="action" value="restore" />
                <SubmitButton idleLabel="Restore and check" pendingLabel="Restoring…" />
              </form>
            ))}
        </details>
      </section>
    </main>
  );
}
