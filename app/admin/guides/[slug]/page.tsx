import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/staff";
import { guideWorkspace, guideSourcesCurrent } from "@/lib/guide-workflow";
import { buildGuideMarket } from "@/lib/guide-market";
import { guideCatalog, validateGuideContent } from "@/lib/guide-content";
import { guideName } from "@/lib/guide-seo";
import { GuidePage } from "@/components/guides/guide-page";
import { approveGuide, refreshGuide } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { createTrustedClient } from "@/lib/supabase/trusted";
import "@/app/(templates)/templates.css";
export default async function GuideReview({ params }: { params: Promise<{ slug: string }> }) {
  await requireStaff();
  const { slug } = await params,
    definition = guideCatalog.find((g) => g.slug === slug);
  if (!definition) notFound();
  const workspace = await guideWorkspace(),
    versions = workspace.revisions.filter((r) => r.guide_slug === slug),
    draft = versions.find((r) => r.status === "draft");
  const guide = draft ? validateGuideContent(draft.content) : definition,
    market = buildGuideMarket(workspace.jobs, guide, workspace.aliases);
  const retained =
    workspace.schemaReady && market.history.length
      ? await createTrustedClient()
          .from("directory_guide_evidence")
          .select("job_id,feed_hash,source_kind,source_text,captured_at")
          .in(
            "job_id",
            market.history.slice(0, 200).map((j) => j.id),
          )
          .order("captured_at", { ascending: false })
          .limit(30)
      : null;
  if (retained?.error) throw new Error("Retained source evidence could not be loaded.");
  return (
    <>
      <section className="staff-section shell guide-review-controls">
        <p>
          <Link href="/admin/guides">Back to guide management</Link>
        </p>
        <h1>Review {guideName(guide)}</h1>
        <p>
          Check the factual claims and cited sources, role matches, original adverts and salary methodology.
          The draft uses a versioned editorial baseline; evidence refreshes do not invent or rewrite career
          advice.
        </p>
        {workspace.schemaReady ? (
          <form action={refreshGuide}>
            <input type="hidden" name="slug" value={slug} />
            <SubmitButton idleLabel="Refresh draft from current evidence" pendingLabel="Refreshing…" />
          </form>
        ) : null}
        {draft ? (
          <form action={approveGuide}>
            <input type="hidden" name="id" value={draft.id} />
            <input type="hidden" name="input_hash" value={draft.input_hash} />
            <p>
              <label>
                <input name="reviewed" type="checkbox" required /> I have reviewed this guide, its sources and
                the evidence sample
              </label>
            </p>
            <SubmitButton idleLabel="Approve and publish guide" pendingLabel="Publishing reviewed version…" />
          </form>
        ) : (
          <p>
            No queued draft yet.{" "}
            {guide.kind === "career" && !market.draftEligible
              ? "The evidence threshold has not been met."
              : "Refresh the evidence to prepare a draft."}
          </p>
        )}
        {!guideSourcesCurrent(guide) ? (
          <p role="alert">
            Research source checks are overdue. Update the research and editorial content before approval.
          </p>
        ) : null}
        <details>
          <summary>Version history ({versions.length})</summary>
          <ul>
            {versions.map((r) => (
              <li key={r.id}>
                {r.status} · Version {validateGuideContent(r.content).version} · Prepared{" "}
                {new Date(r.created_at).toLocaleString("en-GB")}
                {r.reviewed_at ? ` · Reviewed ${new Date(r.reviewed_at).toLocaleString("en-GB")}` : ""}
              </li>
            ))}
          </ul>
        </details>
        <details>
          <summary>Retained original evidence ({retained?.data?.length ?? 0}, up to 30 snapshots)</summary>
          <p>
            Source text is private to staff. A feed fallback is not a fully retrieved advert. Stale snapshots
            cannot establish current salary context.
          </p>
          {retained?.data?.map((source) => {
            const job = market.history.find((j) => j.id === source.job_id);
            return (
              <details key={source.job_id}>
                <summary>
                  {job?.title} · {source.source_kind === "advert" ? "Original advert" : "Feed fallback"} ·{" "}
                  {source.feed_hash === job?.feed_hash ? "Current snapshot" : "Stale snapshot"}
                </summary>
                <p>Captured {new Date(source.captured_at).toLocaleString("en-GB")}</p>
                <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{source.source_text}</p>
              </details>
            );
          })}
        </details>
      </section>
      <div className="template-design">
        <GuidePage
          data={{ guide, market, isDraft: true, reviewedAt: null, schemaReady: workspace.schemaReady }}
        />
      </div>
    </>
  );
}
