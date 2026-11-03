import "server-only";
import { createHash } from "node:crypto";
import { createTrustedClient } from "./supabase/trusted";
import { getGuideJobs } from "./public-guides";
import { guideSchemaUnavailable } from "./public-career-roles";
import { pilotGuides, validateGuideContent, type GuideContent } from "./guide-content";
import { buildGuideMarket, guideMatches, hasFullTimeEvidence, type GuideJob } from "./guide-market";
import { normalizeRoleTitle, roleMatchingVersion, type RoleAlias } from "./career-role-matching";
import { fetchAdvert } from "./directory-advert";
import type { Json } from "./supabase/database.types";

export const guideReviewDays = 90;
export function guideSourcesCurrent(guide: GuideContent, now = new Date()) {
  return (
    guide.sources.length > 0 &&
    guide.sources.every((source) => {
      const age = now.valueOf() - new Date(source.checkedAt).valueOf();
      return age >= 0 && age <= guideReviewDays * 86400000;
    })
  );
}
const hash = (input: unknown) => createHash("sha256").update(JSON.stringify(input)).digest("hex");

export async function guideWorkspace() {
  const db = createTrustedClient();
  const [jobs, aliases, revisions] = await Promise.all([
    getGuideJobs(),
    db.from("directory_role_aliases").select("normalized_title,role_slug").order("normalized_title"),
    db.from("career_guide_revisions").select("*").order("created_at", { ascending: false }),
  ]);
  if (guideSchemaUnavailable(aliases.error) || guideSchemaUnavailable(revisions.error))
    return { jobs, aliases: [], revisions: [], schemaReady: false };
  if (aliases.error || revisions.error) throw new Error("Guide review information could not be loaded.");
  return { jobs, aliases: aliases.data, revisions: revisions.data, schemaReady: true };
}

export function guideEvidence(
  guide: GuideContent,
  jobs: readonly GuideJob[],
  aliases: readonly RoleAlias[],
  now = new Date(),
) {
  const market = buildGuideMarket(jobs, guide, aliases, now);
  const inputs = market.history
    .toSorted((a, b) => a.id - b.id)
    .map((job) => ({
      id: job.id,
      title: job.title,
      organisation: job.organisation_name,
      source: job.source_url,
      textHash: hash(job.feed_text),
      salary: job.salary_text,
      country: job.country_code,
      hours: job.hours_type,
      engagement: job.engagement_type,
      posted: job.posted_at,
      fullTimeEvidence: job.salary_full_time_evidence,
      salaryEvidenceHash: job.salary_evidence_hash,
      feedHash: job.feed_hash,
    }));
  const inputHash = hash({
    guide,
    matchingVersion: roleMatchingVersion,
    aliases: [...aliases].toSorted((a, b) => a.normalized_title.localeCompare(b.normalized_title)),
    inputs,
  });
  return {
    market,
    inputHash,
    snapshot: {
      asOf: now.toISOString(),
      start: market.start,
      observedFrom: market.observedFrom,
      jobIds: market.history.map((j) => j.id),
      qualifiedAdverts: market.evidence.length,
      employers: market.employers,
      salaryCount: market.salaryCount,
      salaryGroups: market.salaryGroups,
      matchingVersion: roleMatchingVersion,
      roleAliasesHash: hash(
        [...aliases].toSorted((a, b) => a.normalized_title.localeCompare(b.normalized_title)),
      ),
      contentVersion: guide.version,
      sourceIds: guide.sources.map((s) => s.id),
      jobFacts: inputs,
    },
  };
}

export async function refreshPilotDrafts(forceSlug?: string) {
  const workspace = await guideWorkspace();
  if (!workspace.schemaReady) return { created: 0, schemaReady: false };
  const db = createTrustedClient();
  let created = 0;
  for (const definition of pilotGuides) {
    if (forceSlug && forceSlug !== definition.slug) continue;
    const guide = validateGuideContent(definition);
    const { market, inputHash, snapshot } = guideEvidence(guide, workspace.jobs, workspace.aliases);
    if ((guide.kind === "career" && !market.draftEligible) || !guideSourcesCurrent(guide)) continue;
    const existing = workspace.revisions.filter((r) => r.guide_slug === guide.slug);
    if (existing.some((r) => r.status === "published" && r.input_hash === inputHash)) continue;
    // No advert can replace a pending editorial draft. Explicit refresh archives it
    // and creates a new evidence snapshot; already published prose remains intact.
    if (!forceSlug && existing.some((r) => r.status === "draft")) continue;
    const published = existing.find((r) => r.status === "published");
    const needsReview =
      !published ||
      validateGuideContent(published.content).version !== guide.version ||
      (published.evidence as { matchingVersion?: number; roleAliasesHash?: string }).matchingVersion !==
        roleMatchingVersion ||
      (published.evidence as { roleAliasesHash?: string }).roleAliasesHash !== snapshot.roleAliasesHash ||
      !published.reviewed_at ||
      Date.now() - new Date(published.reviewed_at).valueOf() >= guideReviewDays * 86400000;
    if (!forceSlug && !needsReview) continue;
    if (forceSlug) {
      const archived = await db
        .from("career_guide_revisions")
        .update({ status: "archived" })
        .eq("guide_slug", guide.slug)
        .eq("status", "draft");
      if (archived.error) throw new Error("The existing draft could not be archived.");
    }
    const result = await db.from("career_guide_revisions").upsert(
      {
        guide_slug: guide.slug,
        input_hash: inputHash,
        content: guide as Json,
        evidence: snapshot as Json,
        status: "draft",
        reviewed_at: null,
      },
      { onConflict: "guide_slug,input_hash", ignoreDuplicates: true },
    );
    if (result.error?.code === "23505") continue; // Another feed/request queued this pilot first.
    if (result.error) throw new Error("The guide evidence draft could not be queued.");
    // An explicitly refreshed archived version with identical inputs is reusable.
    if (forceSlug) {
      const restored = await db
        .from("career_guide_revisions")
        .update({ status: "draft", reviewed_at: null })
        .eq("guide_slug", guide.slug)
        .eq("input_hash", inputHash)
        .eq("status", "archived");
      if (restored.error) throw new Error("The evidence draft could not be restored.");
    }
    created++;
  }
  return { created, schemaReady: true };
}

export async function recordGuideAdvert(
  job: { id: number; feed_hash: string; source_url: string },
  text: string,
  kind: "advert" | "feed",
  statedHours?: string | null,
) {
  const result = await createTrustedClient()
    .from("directory_guide_evidence")
    .upsert(
      {
        job_id: job.id,
        feed_hash: job.feed_hash,
        source_url: job.source_url,
        source_kind: kind,
        source_text:
          `${kind === "advert" && statedHours ? `Advert structured employment type: ${statedHours}\n\n` : ""}${text}`.slice(
            0,
            40000,
          ),
        captured_at: new Date().toISOString(),
      },
      { onConflict: "job_id,feed_hash", ignoreDuplicates: true },
    )
    .select("source_text");
  if (guideSchemaUnavailable(result.error)) return;
  if (result.error) throw new Error("Original advert evidence could not be retained.");
  const stored =
    result.data?.[0] ??
    (
      await createTrustedClient()
        .from("directory_guide_evidence")
        .select("source_text")
        .eq("job_id", job.id)
        .eq("feed_hash", job.feed_hash)
        .single()
    ).data;
  if (!stored) throw new Error("The retained advert snapshot could not be verified.");
  const facts = await createTrustedClient()
    .from("directory_jobs")
    .update({
      salary_full_time_evidence: hasFullTimeEvidence(stored.source_text),
      salary_evidence_hash: job.feed_hash,
    })
    .eq("id", job.id)
    .eq("feed_hash", job.feed_hash)
    .is("merged_into", null);
  if (facts.error) throw new Error("Verified salary context could not be recorded.");
}

export async function collectPilotAdverts() {
  const db = createTrustedClient(),
    workspace = await guideWorkspace();
  if (!workspace.schemaReady) throw new Error("Apply the guide migration before collecting evidence.");
  const hashes = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const existing = await db
      .from("directory_guide_evidence")
      .select("job_id,feed_hash")
      .order("job_id")
      .order("feed_hash")
      .range(from, from + 999);
    if (existing.error) throw new Error("Stored evidence could not be loaded.");
    for (const row of existing.data) hashes.add(`${row.job_id}:${row.feed_hash}`);
    if (existing.data.length < 1000) break;
  }
  const candidates = workspace.jobs
    .filter(
      (j) =>
        pilotGuides.some((g) => guideMatches(j, g, workspace.aliases)) &&
        !hashes.has(`${j.id}:${j.feed_hash}`),
    )
    .slice(0, 10);
  if (!candidates.length) return 0;
  const rows = await db
    .from("directory_jobs")
    .select("id,feed_hash,source_url,feed_text")
    .in(
      "id",
      candidates.map((j) => j.id),
    );
  if (rows.error) throw new Error("Original advert references could not be loaded.");
  const pending = rows.data.filter((j) => !hashes.has(`${j.id}:${j.feed_hash}`)).slice(0, 10);
  for (let offset = 0; offset < pending.length; offset += 3) {
    await Promise.all(
      pending.slice(offset, offset + 3).map(async (job) => {
        let text = job.feed_text,
          kind: "advert" | "feed" = "feed",
          hours: string | null = null;
        try {
          const advert = await fetchAdvert(job.source_url);
          if (advert.description) {
            text = advert.description;
            kind = "advert";
            hours = advert.hours ?? null;
          }
        } catch {
          /* The labelled feed snapshot is the fallback, never an AI summary. */
        }
        await recordGuideAdvert(job, text, kind, hours);
      }),
    );
  }
  return pending.length;
}

export async function setRoleAlias(title: string, include: boolean) {
  const normalized = normalizeRoleTitle(title);
  if (!normalized || normalized.length > 300) throw new Error("Choose a valid job title.");
  const result = await createTrustedClient()
    .from("directory_role_aliases")
    .upsert({
      normalized_title: normalized,
      role_slug: include ? "ecologist" : null,
      updated_at: new Date().toISOString(),
    });
  if (result.error) throw new Error("The reviewed role mapping could not be saved.");
}

export async function publishPilotDraft(id: number, expectedHash: string) {
  const workspace = await guideWorkspace();
  const draft = workspace.revisions.find(
    (r) => r.id === id && r.status === "draft" && r.input_hash === expectedHash,
  );
  if (!draft) throw new Error("This draft has changed. Reload before reviewing it.");
  const guide = validateGuideContent(draft.content),
    current = pilotGuides.find((g) => g.slug === draft.guide_slug);
  if (
    !current ||
    guide.slug !== current.slug ||
    guide.kind !== current.kind ||
    guide.matchSlug !== current.matchSlug ||
    !guideSourcesCurrent(guide)
  )
    throw new Error("The guide identity or source review needs attention.");
  const evidence = guideEvidence(current, workspace.jobs, workspace.aliases);
  if (evidence.inputHash !== expectedHash)
    throw new Error("The evidence changed. Refresh the draft and review it again.");
  if (guide.kind === "career" && !evidence.market.draftEligible)
    throw new Error("Ten distinct detailed adverts from at least two employers are required.");
  const result = await createTrustedClient().rpc("publish_career_guide", {
    p_id: id,
    p_input_hash: expectedHash,
  });
  if (result.error || !result.data)
    throw new Error("The draft could not be published. Reload and try again.");
}
