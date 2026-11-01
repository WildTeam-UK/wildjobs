import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";
import { createTrustedClient } from "@/lib/supabase/trusted";
import { ENVIRONMENT_JOB_RSS_URL } from "@/lib/admin/feed-source";
import { retryPipelineTask, savePipelineSourcePolicy, setPipelinePublishing } from "./actions";

export const metadata: Metadata = { title: "Job pipeline" };
export default async function AutomationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const staff = await requireStaff();
  const client = await createClient();
  const query = await searchParams;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const [tasks, sources, usage, control, heartbeat, exceptionTasks] = await Promise.all([
    client
      .from("job_pipeline_tasks")
      .select("*,job_source_records(source_title,job_id,pipeline_error),job_sources(name)")
      .order("created_at", { ascending: false })
      .limit(100),
    client
      .from("job_sources")
      .select(
        "id,name,authoritative_base_url,is_active,collection_allowed,ai_processing_allowed,publication_allowed,permission_notes,permissions_reviewed_at",
      )
      .order("name"),
    client
      .from("pipeline_ai_usage")
      .select(
        "purpose,status,input_tokens,output_tokens,input_price_per_million,output_price_per_million,source_record_id",
      )
      .gte("created_at", start.toISOString())
      .limit(1000),
    staff.role === "admin"
      ? createTrustedClient().from("automation_controls").select("*").eq("id", "global").single()
      : Promise.resolve({ data: null, error: null }),
    staff.role === "admin"
      ? createTrustedClient()
          .from("source_import_automation")
          .select("last_heartbeat_at")
          .eq("id", true)
          .single()
      : Promise.resolve({ data: null, error: null }),
    client
      .from("job_pipeline_tasks")
      .select("*,job_source_records(source_title,job_id,pipeline_error,source_revision),job_sources(name)")
      .in("status", ["review", "failed"])
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  const totals = (usage.data ?? []).reduce(
    (sum, item) => ({
      input: sum.input + item.input_tokens,
      output: sum.output + item.output_tokens,
      uncertain: sum.uncertain + Number(item.status !== "completed"),
      cost:
        sum.cost +
        (item.input_tokens * (item.input_price_per_million ?? 0) +
          item.output_tokens * (item.output_price_per_million ?? 0)) /
          1000000,
    }),
    { input: 0, output: 0, uncertain: 0, cost: 0 },
  );
  const hasPricing =
    (usage.data ?? []).length > 0 &&
    usage.data!.every((u) => u.input_price_per_million !== null && u.output_price_per_million !== null);
  const enabled = control.data?.auto_publish_enabled === true && process.env.AUTO_PUBLISH_ENABLED === "true";
  const exceptions = (exceptionTasks.data ?? [])
    .filter(
      (task) => !task.job_source_records || task.source_revision === task.job_source_records.source_revision,
    )
    .slice(0, 100);
  const errors = [
    tasks.error,
    sources.error,
    usage.error,
    control.error,
    heartbeat.error,
    exceptionTasks.error,
  ].some(Boolean);
  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Feed to live</p>
          <h1>Job pipeline</h1>
        </div>
        <p>
          EnvironmentJob adverts become evidence-backed WildTeam briefs. Review genuine exceptions and monitor
          freshness, publication and AI use here.
        </p>
      </header>
      <section className="automation-mode shell">
        <div>
          <span className="status-badge">{enabled ? "Live publishing" : "Shadow publishing"}</span>
          <span className="status-badge">
            AI {process.env.AI_ENRICHMENT_ENABLED === "true" ? "enabled" : "off"}
          </span>
        </div>
        <p>
          Last heartbeat:{" "}
          {heartbeat.data?.last_heartbeat_at
            ? new Date(heartbeat.data.last_heartbeat_at).toLocaleString("en-GB", {
                timeZone: "Europe/London",
              })
            : "Unavailable"}
          .{" "}
          {control.data?.auto_publish_source_record_id
            ? `Live publishing is limited to record ${control.data.auto_publish_source_record_id}.`
            : "Source permissions and quality checks apply to every publication."}
        </p>
      </section>
      <section className="staff-summary staff-summary--four shell">
        <div>
          <span>{exceptions.length}</span>
          <strong>Current exceptions, up to 100 shown</strong>
        </div>
        <div>
          <span>{usage.data?.length ?? 0}</span>
          <strong>AI requests reserved today</strong>
        </div>
        <div>
          <span>{(totals.input + totals.output).toLocaleString("en-GB")}</span>
          <strong>Used or reserved tokens</strong>
        </div>
        <div>
          <span>{hasPricing ? `$${totals.cost.toFixed(2)}` : "Not priced"}</span>
          <strong>{totals.uncertain} requests still reserved or uncertain</strong>
        </div>
      </section>
      <section className="staff-section shell">
        {query.error ? (
          <p role="alert" className="staff-form-message staff-form-message--error">
            The change could not be applied ({query.error}). Check the source permissions, target readiness
            and required evidence.
          </p>
        ) : null}
        {query.saved ? (
          <p role="status" className="staff-form-message">
            Pipeline settings saved.
          </p>
        ) : null}
        {errors ? (
          <p role="alert">Some pipeline reporting is unavailable. Live controls remain unchanged.</p>
        ) : null}
        <div className="staff-section__heading">
          <h2>Exception queue</h2>
          <p>
            Transient failures retry with backoff. Budget exhaustion waits for the next UTC day. Staff
            corrections stay protected.
          </p>
        </div>
        {exceptions.length ? (
          <div className="automation-list">
            {exceptions.map((task) => (
              <article key={task.id} className="automation-record">
                <h3>{task.job_source_records?.source_title ?? task.job_sources.name}</h3>
                <p>
                  {task.kind} · {task.status} · attempt {task.attempts}/{task.max_attempts}
                </p>
                <p>
                  {task.error_code ??
                    task.job_source_records?.pipeline_error ??
                    "Check the source and brief before approving this vacancy."}
                </p>
                <div className="source-list__actions">
                  {task.job_source_records?.job_id ? (
                    <Link href={`/admin/jobs/${task.job_source_records.job_id}`}>Review job</Link>
                  ) : (
                    <Link href={`/admin/sources/${task.source_id}`}>Review source record</Link>
                  )}
                  {staff.role === "admin" ? (
                    <form action={retryPipelineTask}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit">Recheck after correction</button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>No current exceptions in the latest 1,000 exception tasks.</p>
        )}
        <div className="staff-section__heading">
          <h2>Source permissions</h2>
          <p>
            This rollout uses EnvironmentJob only. Other sources retain their existing configuration and
            remain outside the replacement automation.
          </p>
        </div>
        {(sources.data ?? []).map((source) => (
          <article key={source.id} className="automation-record">
            <h3>{source.name}</h3>
            <p>
              {source.collection_allowed ? "Collection allowed" : "Collection off"} ·{" "}
              {source.ai_processing_allowed ? "AI processing allowed" : "AI off"} ·{" "}
              {source.publication_allowed ? "Publication allowed" : "Publication off"}
            </p>
            {staff.role === "admin" && source.authoritative_base_url === ENVIRONMENT_JOB_RSS_URL ? (
              <form action={savePipelineSourcePolicy} className="staff-job-form">
                <input name="sourceId" type="hidden" value={source.id} />
                <label>
                  <input
                    type="checkbox"
                    name="collectionAllowed"
                    defaultChecked={source.collection_allowed}
                  />{" "}
                  Collect and retain vacancy evidence
                </label>
                <label>
                  <input type="checkbox" name="aiAllowed" defaultChecked={source.ai_processing_allowed} />{" "}
                  Process evidence into original briefs with AI
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="publicationAllowed"
                    defaultChecked={source.publication_allowed}
                  />{" "}
                  Publish original briefs with attribution and application links
                </label>
                <label htmlFor={`permission-${source.id}`}>Permission evidence and limits</label>
                <textarea
                  id={`permission-${source.id}`}
                  name="permissionNotes"
                  required
                  minLength={20}
                  maxLength={2000}
                  defaultValue={source.permission_notes ?? ""}
                />
                <button type="submit">Save source policy</button>
              </form>
            ) : null}
          </article>
        ))}
        {staff.role === "admin" ? (
          <>
            <div className="staff-section__heading">
              <h2>Publishing control</h2>
              <p>
                The server environment switch and database control must both be on. Enabling the database
                control never bypasses a source or content check.
              </p>
            </div>
            <form action={setPipelinePublishing} className="staff-job-form">
              <label htmlFor="record-target">
                Limit to source record (blank for every verified EnvironmentJob brief)
              </label>
              <input
                id="record-target"
                name="recordId"
                type="number"
                min={1}
                defaultValue={control.data?.auto_publish_source_record_id ?? ""}
              />
              <button name="enabled" value="true" type="submit">
                Enable checked publication
              </button>
              <button name="enabled" value="false" type="submit">
                Pause automatic publication
              </button>
            </form>
          </>
        ) : null}
        <div className="staff-section__heading">
          <h2>Recent work</h2>
          <p>Every fetch, AI generation, independent review and publication has its own recoverable stage.</p>
        </div>
        <div className="automation-list">
          {(tasks.data ?? []).map((task) => (
            <article key={task.id} className="automation-record">
              <strong>{task.job_source_records?.source_title ?? task.job_sources.name}</strong>
              <p>
                {task.kind}
                {task.kind === "enrich" ? ` / ${task.ai_stage}` : ""} · {task.status} ·{" "}
                {new Date(task.created_at).toLocaleString("en-GB", { timeZone: "Europe/London" })}
              </p>
              {task.error_code ? <p>{task.error_code}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
