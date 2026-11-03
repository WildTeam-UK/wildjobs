import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "./supabase/public";
import { getPublicRoleAliases, guideSchemaUnavailable } from "./public-career-roles";
import { guideWindowStart, buildGuideMarket, type GuideJob } from "./guide-market";
import { pilotGuides, validateGuideContent } from "./guide-content";

// Discovery pages only need publication status, not the full historical job sample.
export const getReviewedGuideIndex = cache(async () => {
  await connection();
  const result = await createPublicClient()
    .from("career_guide_revisions")
    .select("guide_slug,reviewed_at")
    .eq("status", "published")
    .in(
      "guide_slug",
      pilotGuides.map((guide) => guide.slug),
    );
  if (result.error && !guideSchemaUnavailable(result.error))
    throw new Error("The reviewed guide index could not be loaded.");
  return (result.data ?? []).flatMap((revision) => {
    const guide = pilotGuides.find((guide) => guide.slug === revision.guide_slug);
    return guide ? [{ guide, reviewedAt: revision.reviewed_at }] : [];
  });
});

export const getGuideJobs = cache(async () => {
  await connection();
  const db = createPublicClient(),
    jobs: GuideJob[] = [];
  // History is canonical vacancies, not source copies. Expired adverts stay in the
  // sample; only the live widget applies the directory's expiry rule.
  for (let from = 0; ; from += 1000) {
    const result = await db
      .from("directory_jobs")
      .select(
        "id,title,organisation_name,source_url,source_name,sector_slugs,feed_text,salary_text,country_code,hours_type,engagement_type,posted_at,first_seen_at,closes_at,is_active,merged_into,feed_hash,salary_full_time_evidence,salary_evidence_hash",
      )
      .is("merged_into", null)
      .or(
        `posted_at.gte.${guideWindowStart(new Date())},and(is_active.eq.true,closes_at.gt.${new Date().toISOString()})`,
      )
      .order("id")
      .range(from, from + 999);
    if (result.error) throw new Error("Guide evidence could not be loaded.");
    jobs.push(...result.data);
    if (result.data.length < 1000) break;
  }
  return jobs;
});

export const getGuideData = cache(async (slug: string) => {
  const definition = pilotGuides.find((g) => g.slug === slug);
  if (!definition) throw new Error("Unknown guide.");
  const [jobs, roles, published] = await Promise.all([
    getGuideJobs(),
    getPublicRoleAliases(),
    createPublicClient()
      .from("career_guide_revisions")
      .select("content,reviewed_at,created_at")
      .eq("guide_slug", slug)
      .eq("status", "published")
      .maybeSingle(),
  ]);
  if (published.error && !guideSchemaUnavailable(published.error))
    throw new Error("The reviewed guide could not be loaded.");
  const guide = published.data ? validateGuideContent(published.data.content) : definition;
  if (
    guide.slug !== definition.slug ||
    guide.kind !== definition.kind ||
    guide.matchSlug !== definition.matchSlug
  )
    throw new Error("Guide identity does not match its route.");
  return {
    guide,
    market: buildGuideMarket(jobs, guide, roles.aliases),
    isDraft: !published.data,
    reviewedAt: published.data?.reviewed_at ?? null,
    schemaReady: roles.schemaReady && !guideSchemaUnavailable(published.error),
  };
});
