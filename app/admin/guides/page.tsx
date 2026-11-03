import Link from "next/link";
import { requireStaff } from "@/lib/auth/staff";
import { guideWorkspace, guideSourcesCurrent } from "@/lib/guide-workflow";
import { buildGuideMarket } from "@/lib/guide-market";
import { matchCareerRole, normalizeRoleTitle } from "@/lib/career-role-matching";
import { pilotGuides, guidePath } from "@/lib/guide-content";
import { collectGuideEvidence, refreshGuide, reviewRole } from "./actions";
import { SubmitButton } from "@/components/submit-button";
export const maxDuration = 150;
export default async function GuideAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireStaff();
  const [workspace, params] = await Promise.all([guideWorkspace(), searchParams]);
  const ecology = buildGuideMarket(workspace.jobs, pilotGuides[1], workspace.aliases);
  const candidates = workspace.jobs
    .map((job) => ({ job, match: matchCareerRole(job.title, job.feed_text, workspace.aliases) }))
    .filter(
      ({ job, match }) =>
        match.status !== "unmatched" ||
        workspace.aliases.some((a) => a.normalized_title === normalizeRoleTitle(job.title)),
    );
  return (
    <main className="staff-page directory-admin">
      <header className="staff-hero shell">
        <div>
          <p className="eyebrow">Evidence and editorial review</p>
          <h1>Career guides</h1>
        </div>
        <p>
          Two pilot guides share the directory’s canonical vacancies. Figures update independently of reviewed
          prose. No draft is published automatically.
        </p>
      </header>
      <section className="staff-section shell">
        {params.error ? <p role="alert">{params.error}</p> : null}
        {params.published ? (
          <p role="status">The reviewed guide is published. The previous version remains in its history.</p>
        ) : null}
        {!workspace.schemaReady ? (
          <p role="status">
            Guide storage is not installed in this environment yet. The public pages remain clearly labelled
            previews, with live directory figures. Apply the pilot migration before reviewing or publishing.
          </p>
        ) : null}
        {pilotGuides.map((guide) => {
          const market = buildGuideMarket(workspace.jobs, guide, workspace.aliases),
            versions = workspace.revisions.filter((r) => r.guide_slug === guide.slug),
            published = versions.find((r) => r.status === "published");
          return (
            <article className="guide-admin-card" key={guide.slug}>
              <h2>
                {guide.title} {guide.accent}
              </h2>
              <p>
                {market.history.length} distinct adverts · {market.evidence.length} detailed feed records ·{" "}
                {market.employers} employers · {market.current.length} open now
              </p>
              <p>
                {guide.kind === "career"
                  ? market.draftEligible
                    ? "Evidence threshold reached: ready for a draft"
                    : "Waiting for 10 detailed, distinct adverts from at least 2 employers"
                  : "Sector guide: editorial review required"}
                .{" "}
                {guideSourcesCurrent(guide)
                  ? "Research sources are within their 90-day review period."
                  : "Research sources need checking before publication."}
              </p>
              <p>
                {published?.reviewed_at
                  ? `Last editorial review: ${new Date(published.reviewed_at).toLocaleDateString("en-GB")}`
                  : "No published review yet"}{" "}
                · Content version {guide.version}
              </p>
              <p>
                <Link href={guidePath(guide)}>View public page</Link> ·{" "}
                <Link href={`/admin/guides/${guide.slug}`}>Review draft and history</Link>
              </p>
              {workspace.schemaReady ? (
                <form action={refreshGuide}>
                  <input type="hidden" name="slug" value={guide.slug} />
                  <SubmitButton idleLabel="Refresh evidence draft" pendingLabel="Preparing draft…" />
                </form>
              ) : null}
            </article>
          );
        })}
        <h2>Original advert evidence</h2>
        <p>
          The feed importer retains the source text it already reads, without an extra AI run. For existing
          adverts, collect up to ten missing snapshots at a time. Blocked or expired originals retain a
          clearly labelled feed-text fallback.
        </p>
        {workspace.schemaReady ? (
          <form action={collectGuideEvidence}>
            <SubmitButton
              idleLabel="Collect next 10 advert snapshots"
              pendingLabel="Reading original adverts…"
            />
          </form>
        ) : null}
      </section>
      <section className="staff-section shell">
        <h2>Ecologist role matching</h2>
        <p>
          {ecology.review.length} titles need review. A confirmed mapping applies to future adverts with the
          same normalised title. It does not change the source title or merge different seniority levels.
        </p>
        <div className="guide-role-review">
          {candidates.map(({ job, match }) => (
            <details key={job.id}>
              <summary>
                {match.status === "review"
                  ? "Needs review"
                  : match.status === "matched"
                    ? "Included"
                    : "Excluded"}{" "}
                · {job.title} · {job.organisation_name}
              </summary>
              <p>
                {match.reason} · Level: {match.seniority}
              </p>
              <p>{job.feed_text.slice(0, 1800)}</p>
              <p>
                <a href={job.source_url} target="_blank" rel="noopener noreferrer">
                  Check original advert
                </a>
              </p>
              {workspace.schemaReady ? (
                <form action={reviewRole}>
                  <input type="hidden" name="job_id" value={job.id} />
                  <button className="action" type="submit" name="decision" value="include">
                    Include in ecologist family
                  </button>{" "}
                  <button className="action action--outline" type="submit" name="decision" value="exclude">
                    Exclude this title
                  </button>
                </form>
              ) : null}
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
