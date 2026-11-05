import "server-only";
import { createPublicClient } from "./supabase/public";
import { getReviewedGuideIndex } from "./public-guides";
import { getPublicRoleAliases } from "./public-career-roles";
import { buildGuideMarket, guideWindowStart, type GuideJob } from "./guide-market";
import { guideSectorMatchSlug, sectorGuideSlugs } from "./guide-sectors";
import { matchCareerRole } from "./career-role-matching";
import type { Job } from "./jobs";

export async function getEmployerProfileMarket(name: string, live: readonly Job[]) {
  const now = new Date();
  const db = createPublicClient();
  const [reviewed, roles, adverts] = await Promise.all([
    getReviewedGuideIndex(),
    getPublicRoleAliases(),
    (async () => {
      const history: GuideJob[] = [];
      for (let from = 0; ; from += 1000) {
        const result = await db
          .from("directory_jobs")
          .select(
            "id,title,organisation_name,source_url,source_name,sector_slugs,feed_text,salary_text,country_code,hours_type,engagement_type,posted_at,first_seen_at,closes_at,is_active,merged_into,feed_hash,salary_full_time_evidence,salary_evidence_hash",
          )
          .eq("organisation_name", name)
          .is("merged_into", null)
          .gte("posted_at", guideWindowStart(now))
          .lte("posted_at", now.toISOString())
          .order("posted_at", { ascending: false })
          .order("id")
          .range(from, from + 999);
        if (result.error) throw new Error("Employer vacancy history could not be loaded.");
        history.push(...result.data);
        if (result.data.length < 1000) return history;
      }
    })(),
  ]);

  const frequencies = (values: readonly string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return counts;
  };
  const historicRoles = frequencies(
    adverts.flatMap((advert) => {
      const role = matchCareerRole(advert.title, advert.feed_text, roles.aliases).roleSlug;
      return role ? [role] : [];
    }),
  );
  const liveRoles = frequencies(live.flatMap((job) => (job.roleSlug ? [job.roleSlug] : [])));
  const historicSectors = frequencies(adverts.flatMap((advert) => [...advert.sector_slugs]));
  const liveSectors = frequencies(live.flatMap((job) => job.careerAreaTerms?.map(({ slug }) => slug) ?? []));
  const rank = (slug: string, recent: Map<string, number>, history: Map<string, number>) =>
    1000 * (recent.get(slug) ?? 0) + (history.get(slug) ?? 0);
  const sectors = sectorGuideSlugs
    .map((slug) => ({ slug, score: rank(guideSectorMatchSlug(slug), liveSectors, historicSectors) }))
    .filter(({ score }) => score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ slug }) => slug);
  const relevantGuides = reviewed
    .map(({ guide }) => ({
      guide,
      score:
        guide.kind === "career"
          ? rank(guide.matchSlug, liveRoles, historicRoles)
          : rank(guide.matchSlug, liveSectors, historicSectors),
    }))
    .filter(({ score }) => score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, 3);
  const role = relevantGuides.find(({ guide }) => guide.kind === "career")?.guide;
  const salary = role
    ? buildGuideMarket(adverts, role, roles.aliases, now).salaryGroups.find(
        (group) => group.median !== null && group.level !== "unspecified",
      )
    : undefined;

  return {
    adverts: adverts.length,
    sectors,
    guides: relevantGuides.map(({ guide }) => guide),
    coverageFrom: adverts.map(({ first_seen_at }) => first_seen_at).sort()[0],
    salary: role && salary ? { ...salary, role } : undefined,
  };
}
