import type { Metadata } from "next";
import Link from "next/link";

import {
  automationBlockerLabels,
  type AutomationBlockerCode,
} from "@/lib/admin/automation-publication-readiness";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Automation review" };

const runStatusLabels: Record<string, string> = {
  completed: "Complete",
  failed: "Failed safely",
  needs_review: "Needs review",
  pending: "Pending",
  running: "Running",
  skipped: "Already current",
};

const decisionLabels: Record<string, string> = {
  blocked: "Blocked safely",
  failed: "Failed safely",
  published: "Published",
  ready: "Ready",
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function statusClass(value: string) {
  return value.replaceAll("_", "-");
}

function sourceRecordHref(record: { source_id: number; source_title: string | null }) {
  return {
    pathname: `/admin/sources/${record.source_id}`,
    query: { q: record.source_title ?? "", status: "all" },
  };
}

export default async function AutomationReviewPage() {
  await requireStaff();
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const [runsResult, decisionsResult, queueResult, usageResult] = await Promise.all([
    supabase
      .from("source_enrichment_runs")
      .select(
        "id, source_record_id, status, trigger_type, started_at, finished_at, fields_resolved, fields_unresolved, ai_attempted, ai_model, ai_skip_reason, input_tokens, output_tokens, employer_page_fetched, error_code, job_source_records(id, source_id, source_title, employer_name, job_sources(id, name))",
      )
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("automation_publication_decisions")
      .select(
        "id, source_record_id, job_id, decision, mode, score, blocker_codes, policy_version, created_at, job_source_records(id, source_id, source_title, employer_name, job_sources(id, name))",
      )
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("job_source_records")
      .select("automation_status")
      .is("job_id", null)
      .in("mapping_status", ["unmapped", "possible_duplicate"])
      .limit(1_000),
    supabase
      .from("source_enrichment_runs")
      .select("input_tokens, output_tokens")
      .eq("ai_attempted", true)
      .gte("started_at", startOfToday.toISOString())
      .limit(1_000),
  ]);

  const runs = runsResult.data ?? [];
  const decisions = decisionsResult.data ?? [];
  const queue = queueResult.data ?? [];
  const usage = (usageResult.data ?? []).reduce(
    (total, run) => ({
      inputTokens: total.inputTokens + run.input_tokens,
      outputTokens: total.outputTokens + run.output_tokens,
      requests: total.requests + 1,
    }),
    { inputTokens: 0, outputTokens: 0, requests: 0 },
  );
  const queueCounts = queue.reduce<Record<string, number>>((counts, record) => {
    counts[record.automation_status] = (counts[record.automation_status] ?? 0) + 1;
    return counts;
  }, {});
  const hasError = Boolean(
    runsResult.error || decisionsResult.error || queueResult.error || usageResult.error,
  );
  const autoPublishEnabled = process.env.AUTO_PUBLISH_ENABLED === "true";
  const aiEnabled = process.env.AI_ENRICHMENT_ENABLED === "true";

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>Automation review</h1>
        </div>
        <p>
          Follow every enrichment run, inspect exact publication blockers and measure AI usage before any
          vacancy is trusted to publish automatically.
        </p>
      </header>

      <section className="automation-mode shell" aria-label="Automation mode">
        <div>
          <span className={`status-badge status-badge--${aiEnabled ? "completed" : "cancelled"}`}>
            AI enrichment {aiEnabled ? "on" : "off"}
          </span>
          <span className={`status-badge status-badge--${autoPublishEnabled ? "published" : "shadow"}`}>
            {autoPublishEnabled ? "Live publishing" : "Shadow publishing"}
          </span>
        </div>
        <p>
          {autoPublishEnabled
            ? "Evidence-gated records can publish when every policy check passes."
            : "Readiness is being scored, but no vacancy can publish automatically."}
        </p>
      </section>

      <section className="staff-summary staff-summary--four shell" aria-label="Automation summary">
        <div>
          <span>{String(queueCounts.ready ?? 0).padStart(2, "0")}</span>
          <strong>Ready in the queue</strong>
        </div>
        <div>
          <span>{String(queueCounts.blocked ?? 0).padStart(2, "0")}</span>
          <strong>Blocked for review</strong>
        </div>
        <div>
          <span>{String(usage.requests).padStart(2, "0")}</span>
          <strong>AI requests today</strong>
        </div>
        <div>
          <span>{formatNumber(usage.inputTokens + usage.outputTokens)}</span>
          <strong>AI tokens today</strong>
        </div>
      </section>

      <section className="staff-section shell">
        {hasError ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Some automation reporting is temporarily unavailable. No publishing controls were changed.
          </p>
        ) : null}

        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Publication policy</p>
            <h2>Latest decisions</h2>
          </div>
          <p>The latest 50 checks are shown.</p>
        </div>

        {decisions.length ? (
          <div className="automation-list">
            {decisions.map((decision) => {
              const record = decision.job_source_records;
              return (
                <article key={decision.id}>
                  <div>
                    <p className="eyebrow">
                      DECISION-{decision.id} · {formatTimestamp(decision.created_at)}
                    </p>
                    <h3>
                      {record ? (
                        <Link href={sourceRecordHref(record)}>
                          {record.source_title ?? "Untitled source vacancy"}
                        </Link>
                      ) : (
                        "Source record unavailable"
                      )}
                    </h3>
                    <p>{record?.employer_name ?? record?.job_sources?.name ?? "Employer not identified"}</p>
                    {decision.blocker_codes.length ? (
                      <ul className="automation-blockers">
                        {decision.blocker_codes.map((blocker) => (
                          <li key={blocker}>
                            {automationBlockerLabels[blocker as AutomationBlockerCode] ??
                              blocker.replaceAll("_", " ")}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="automation-list__clear">All publication evidence checks passed.</p>
                    )}
                  </div>
                  <span className={`status-badge status-badge--${statusClass(decision.decision)}`}>
                    {decisionLabels[decision.decision] ?? decision.decision}
                  </span>
                  <dl>
                    <div>
                      <dt>Score</dt>
                      <dd>{decision.score}%</dd>
                    </div>
                    <div>
                      <dt>Mode</dt>
                      <dd>{decision.mode === "shadow" ? "Shadow" : "Live"}</dd>
                    </div>
                    <div>
                      <dt>Policy</dt>
                      <dd>{decision.policy_version}</dd>
                    </div>
                    <div>
                      <dt>Result</dt>
                      <dd>{decision.job_id ? `Job #${decision.job_id}` : "No publication"}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : decisionsResult.error ? null : (
          <div className="staff-empty-state">
            <p className="eyebrow">No decisions yet</p>
            <h2>The first shadow result will appear after enrichment runs.</h2>
          </div>
        )}
      </section>

      <section className="staff-section staff-section--compact shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Enrichment history</p>
            <h2>Latest AI and deterministic runs</h2>
          </div>
          <p>The latest 50 runs are shown.</p>
        </div>

        {runs.length ? (
          <div className="automation-list">
            {runs.map((run) => {
              const record = run.job_source_records;
              return (
                <article key={run.id}>
                  <div>
                    <p className="eyebrow">
                      RUN-{run.id} · {formatTimestamp(run.started_at)}
                    </p>
                    <h3>
                      {record ? (
                        <Link href={sourceRecordHref(record)}>
                          {record.source_title ?? "Untitled source vacancy"}
                        </Link>
                      ) : (
                        "Source record unavailable"
                      )}
                    </h3>
                    <p>{record?.employer_name ?? record?.job_sources?.name ?? "Employer not identified"}</p>
                    {run.error_code ? (
                      <p className="automation-list__error">
                        Safe error: {run.error_code.replaceAll("_", " ")}
                      </p>
                    ) : run.ai_skip_reason ? (
                      <p>AI not used: {run.ai_skip_reason.replaceAll("_", " ")}</p>
                    ) : null}
                  </div>
                  <span className={`status-badge status-badge--${statusClass(run.status)}`}>
                    {runStatusLabels[run.status] ?? run.status}
                  </span>
                  <dl>
                    <div>
                      <dt>Fields</dt>
                      <dd>
                        {run.fields_resolved} resolved · {run.fields_unresolved} open
                      </dd>
                    </div>
                    <div>
                      <dt>AI</dt>
                      <dd>{run.ai_attempted ? (run.ai_model ?? "Attempted") : "Not needed"}</dd>
                    </div>
                    <div>
                      <dt>Tokens</dt>
                      <dd>{formatNumber(run.input_tokens + run.output_tokens)}</dd>
                    </div>
                    <div>
                      <dt>Employer page</dt>
                      <dd>{run.employer_page_fetched ? "Checked" : "Not available"}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </div>
        ) : runsResult.error ? null : (
          <div className="staff-empty-state">
            <p className="eyebrow">No enrichment runs yet</p>
            <h2>Automation history will appear here.</h2>
          </div>
        )}
      </section>
    </main>
  );
}
