import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "./supabase/public";
import { getPublicRoleAliases, guideSchemaUnavailable } from "./public-career-roles";
import { guideWindowStart, buildGuideMarket, type GuideJob } from "./guide-market";
import { guideCatalog, validateGuideContent } from "./guide-content";
import { cachePublicData, PUBLIC_DATA_PAGE_SIZE } from "./public-data-cache";

// Discovery pages only need publication status, not the full historical job sample.
const loadReviewedGuideIndex = cachePublicData("guide-index", async () => {
  const result = await createPublicClient()
    .from("career_guide_revisions")
    .select("guide_slug,reviewed_at")
    .eq("status", "published")
    .in(
      "guide_slug",
      guideCatalog.map((guide) => guide.slug),
    );
  if (result.error && !guideSchemaUnavailable(result.error))
    throw new Error("The reviewed guide index could not be loaded.");
  const published = new Map((result.data ?? []).map((revision) => [revision.guide_slug, revision]));
  // Keep one ordered publication index for the hub, metadata and sitemap.
  return guideCatalog.flatMap((guide) => {
    const revision = published.get(guide.slug);
    return revision ? [{ guide, reviewedAt: revision.reviewed_at }] : [];
  });
});

export const getReviewedGuideIndex = cache(async () => {
  await connection();
  return loadReviewedGuideIndex();
});

async function loadGuideJobPage(from: number) {
  // History is canonical vacancies, not source copies. Expired adverts stay in the
  // sample; only the live widget applies the directory's expiry rule.
  const result = await createPublicClient()
    .from("directory_jobs")
    .select(
      "id,title,organisation_name,source_url,source_name,sector_slugs,feed_text,salary_text,country_code,hours_type,engagement_type,posted_at,first_seen_at,closes_at,is_active,merged_into,feed_hash,salary_full_time_evidence,salary_evidence_hash",
    )
    .is("merged_into", null)
    .or(
      `posted_at.gte.${guideWindowStart(new Date())},and(is_active.eq.true,closes_at.gt.${new Date().toISOString()})`,
    )
    .order("id")
    .range(from, from + PUBLIC_DATA_PAGE_SIZE - 1);
  if (result.error) throw new Error("Guide evidence could not be loaded.");
  return result.data;
}

const getGuideJobPage = cachePublicData("guide-jobs", loadGuideJobPage);

async function collectGuideJobs(load: typeof loadGuideJobPage) {
  const jobs: GuideJob[] = [];
  for (let from = 0; ; from += PUBLIC_DATA_PAGE_SIZE) {
    const data = await load(from);
    jobs.push(...data);
    if (data.length < PUBLIC_DATA_PAGE_SIZE) return jobs;
  }
}

// Approval and automation must check current evidence, never a public snapshot.
export async function getFreshGuideJobs() {
  return collectGuideJobs(loadGuideJobPage);
}

export const getGuideJobs = cache(async () => {
  await connection();
  return collectGuideJobs(getGuideJobPage);
});

const getPublishedGuide = cachePublicData("published-guide", async (slug: string) => {
  const result = await createPublicClient()
    .from("career_guide_revisions")
    .select("content,reviewed_at,created_at")
    .eq("guide_slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (result.error && !guideSchemaUnavailable(result.error))
    throw new Error("The reviewed guide could not be loaded.");
  return {
    content: result.data ? validateGuideContent(result.data.content) : null,
    reviewedAt: result.data?.reviewed_at ?? null,
    schemaReady: !guideSchemaUnavailable(result.error),
  };
});

export const getGuideData = cache(async (slug: string) => {
  const definition = guideCatalog.find((g) => g.slug === slug);
  if (!definition) throw new Error("Unknown guide.");
  const [jobs, roles, published] = await Promise.all([
    getGuideJobs(),
    getPublicRoleAliases(),
    getPublishedGuide(slug),
  ]);
  const guide = published.content ?? definition;
  if (
    guide.slug !== definition.slug ||
    guide.kind !== definition.kind ||
    guide.matchSlug !== definition.matchSlug
  )
    throw new Error("Guide identity does not match its route.");
  return {
    guide,
    market: buildGuideMarket(jobs, guide, roles.aliases),
    isDraft: !published.content,
    reviewedAt: published.reviewedAt,
    schemaReady: roles.schemaReady && published.schemaReady,
  };
});
