import { requireStaff } from "@/lib/auth/staff";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { setAutomation, runFeed } from "./actions";
import { SubmitButton } from "@/components/submit-button";
export const maxDuration = 150;
export default async function AdminPage() {
  await requireStaff();
  const db = createTrustedClient();
  const [settings, jobs, runs] = await Promise.all([
    db.from("directory_settings").select("*").single(),
    db.from("directory_jobs").select("id,feed_hash,processed_hash,is_active"),
    db.from("directory_runs").select("*").order("started_at", { ascending: false }).limit(1000),
  ]);
  if (settings.error || jobs.error || runs.error) throw new Error("Directory activity could not be loaded.");
  const active = jobs.data.filter((j) => j.is_active),
    pending = active.filter((j) => j.feed_hash !== j.processed_hash).length;
  const today = new Date().toISOString().slice(0, 10),
    recent = runs.data.filter((r) => r.started_at.startsWith(today));
  const cost = runs.data.reduce((total, r) => total + r.estimated_cost_usd, 0);
  const when = (value: string | null) =>
    value ? new Date(value).toLocaleString("en-GB", { timeZone: "Europe/London" }) : "Not yet";
  return (
    <main className="staff-page directory-admin">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">EnvironmentJob directory</p>
          <h1>Feed to live job cards.</h1>
        </div>
        <p>
          Imports publish automatically. AI adds a concise summary, sectors and relevant WildTeam courses.
        </p>
      </header>
      <section className="staff-summary shell">
        <div>
          <span>{active.length}</span>
          <strong>Live jobs</strong>
        </div>
        <div>
          <span>{pending}</span>
          <strong>Awaiting AI enrichment · already live</strong>
        </div>
        <div>
          <span>${cost.toFixed(4)}</span>
          <strong>Estimated AI spend · latest 1,000 runs</strong>
        </div>
      </section>
      <section className="staff-section shell">
        <h2>Automatic feed updates</h2>
        <p>
          Automation is <strong>{settings.data.enabled ? "on" : "off"}</strong>. Feed refreshes hourly; AI
          processes up to 20 jobs per minute while work remains.
        </p>
        <p>
          Last feed: {when(settings.data.last_feed_at)} · Next feed: {when(settings.data.next_feed_at)}
        </p>
        <p>
          Today: {recent.reduce((n, r) => n + r.ai_completed, 0)} AI summaries ·{" "}
          {recent.reduce((n, r) => n + r.input_tokens, 0).toLocaleString()} input tokens ·{" "}
          {recent.reduce((n, r) => n + r.output_tokens, 0).toLocaleString()} output tokens · $
          {recent.reduce((n, r) => n + r.estimated_cost_usd, 0).toFixed(4)} estimated.
        </p>
        <p>
          Cost estimates use gpt-6-luna standard rates: $0.10 per million input tokens and $0.50 per million
          output tokens, including reasoning tokens. Hosting is billed separately.
        </p>
        {settings.data.last_error ? <p role="alert">Latest error: {settings.data.last_error}</p> : null}
        <form action={setAutomation}>
          <input name="enabled" type="hidden" value={String(!settings.data.enabled)} />
          <SubmitButton
            idleLabel={settings.data.enabled ? "Pause automation" : "Enable automation"}
            pendingLabel="Saving…"
          />
        </form>
        <form action={runFeed}>
          <SubmitButton idleLabel="Refresh feed now" pendingLabel="Importing and enriching…" />
        </form>
      </section>
      <section className="staff-section shell">
        <h2>Recent activity</h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Started (UK)</th>
                <th>Status</th>
                <th>Feed jobs</th>
                <th>Changed</th>
                <th>AI completed</th>
                <th>Estimated USD</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.data.slice(0, 50).map((r) => (
                <tr key={r.id}>
                  <td>{when(r.started_at)}</td>
                  <td>{r.status}</td>
                  <td>{r.feed_seen}</td>
                  <td>{r.changed}</td>
                  <td>{r.ai_completed}</td>
                  <td>${r.estimated_cost_usd.toFixed(4)}</td>
                  <td>{r.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
