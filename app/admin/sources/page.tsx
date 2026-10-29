import type { Metadata } from "next";
import Link from "next/link";

import { addSource, runSourceDiscovery, setSourceStatus } from "@/app/admin/sources/actions";
import { getSourceConnector } from "@/lib/admin/source-connector";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vacancy sources" };

type SourcesPageProps = {
  searchParams: Promise<{ error?: string; status?: string }>;
};

const errorMessages: Record<string, string> = {
  duplicate: "A source with that name already exists.",
  "invalid-name": "Enter a source name between 2 and 120 characters.",
  "invalid-source": "That source could not be found.",
  "invalid-status": "Choose a valid source status.",
  "invalid-type": "Choose one of the available source types.",
  "invalid-url": "Enter a complete HTTPS careers, feed or API URL.",
  "connection-unavailable": "The vacancy check could not be started. Please try again.",
  "unsupported-connection": "That source does not have an approved connector yet.",
  unavailable: "The source could not be saved. Please try again.",
};

const statusMessages: Record<string, string> = {
  activated: "Source reactivated successfully.",
  created: "Source added successfully.",
  paused: "Source paused successfully. Existing provenance and vacancies were kept.",
};

const sourceLabels: Record<string, string> = {
  api: "API",
  employer_submission: "Employer submission",
  feed: "RSS or structured feed",
  manual_curation: "Manual curation",
};

export default async function SourcesPage({ searchParams }: SourcesPageProps) {
  const staff = await requireStaff();
  const params = await searchParams;
  const supabase = await createClient();
  const { data: sources, error } = await supabase
    .from("job_sources")
    .select("id, name, source_type, authoritative_base_url, is_active, updated_at")
    .order("name");

  return (
    <main className="staff-page">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Source library</p>
          <h1>Approve where vacancies come from.</h1>
        </div>
        <p>
          A source records authority and provenance. It does not publish vacancies automatically or permit
          unrestricted scraping.
        </p>
      </header>

      <section className="staff-section staff-sources shell">
        <div className="staff-section__heading">
          <div>
            <p className="eyebrow">Approved sources</p>
            <h2>{sources?.length ?? 0} organisations and routes</h2>
          </div>
          <p>Active sources can supply review drafts.</p>
        </div>

        {params.status && statusMessages[params.status] ? (
          <p className="staff-form-message" role="status">
            {statusMessages[params.status]}
          </p>
        ) : null}
        {params.error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            {errorMessages[params.error] ?? errorMessages.unavailable}
          </p>
        ) : null}
        {error ? (
          <p className="staff-form-message staff-form-message--error" role="alert">
            Sources are temporarily unavailable.
          </p>
        ) : null}

        <div className="staff-source-layout">
          <div className="source-list">
            {(sources ?? []).map((source) => (
              <article key={source.id}>
                <div>
                  <span className="status-badge">{source.is_active ? "Active" : "Paused"}</span>
                  <h3>
                    <Link href={`/admin/sources/${source.id}`}>{source.name}</Link>
                  </h3>
                  <p>{sourceLabels[source.source_type] ?? source.source_type}</p>
                </div>
                <div className="source-list__actions">
                  {source.authoritative_base_url ? (
                    <a href={source.authoritative_base_url} rel="noreferrer" target="_blank">
                      Open authoritative source <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span>No external URL recorded</span>
                  )}
                  {staff.role === "admin" ? (
                    <>
                      {source.is_active &&
                      getSourceConnector(source.source_type, source.authoritative_base_url) ? (
                        <form action={runSourceDiscovery}>
                          <input name="sourceId" type="hidden" value={source.id} />
                          <button className="staff-source-toggle" type="submit">
                            Check for vacancies
                          </button>
                        </form>
                      ) : null}
                      <form action={setSourceStatus}>
                        <input name="sourceId" type="hidden" value={source.id} />
                        <input name="status" type="hidden" value={source.is_active ? "paused" : "active"} />
                        <button className="staff-source-toggle" type="submit">
                          {source.is_active ? "Pause source" : "Reactivate source"}
                        </button>
                      </form>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          {staff.role === "admin" ? (
            <form action={addSource} className="staff-source-form">
              <div>
                <p className="eyebrow">Administrator action</p>
                <h2>Add a source</h2>
                <p>
                  Choose the route we have actually verified. Supported feeds receive a private review queue;
                  nothing is published automatically.
                </p>
              </div>
              <label htmlFor="source-name">Source name</label>
              <input id="source-name" maxLength={120} name="name" required />

              <label htmlFor="source-type">Source type</label>
              <select defaultValue="manual_curation" id="source-type" name="sourceType" required>
                <option value="manual_curation">Manual curation</option>
                <option value="feed">RSS or structured feed</option>
                <option value="api">API</option>
                <option value="employer_submission">Employer submission</option>
              </select>

              <label htmlFor="source-url">Authoritative HTTPS URL</label>
              <input id="source-url" name="authoritativeBaseUrl" required type="url" />

              <label className="staff-source-form__check">
                <input defaultChecked name="isActive" type="checkbox" />
                <span>Make this source available for vacancy review</span>
              </label>

              <button className="action" type="submit">
                Add source
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
