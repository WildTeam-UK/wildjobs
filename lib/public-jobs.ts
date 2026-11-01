import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import type { Job } from "./jobs";
import { mapPublicJob } from "./public-job-mapper";
import type { PublicJobRecord } from "./public-job-mapper";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import { createPublicClient } from "./supabase/public";

export const publicJobFields = `
  id,employer_id,slug,title,summary,summary_source,description,responsibilities,requirements,
  location_text,locality,postal_code,country_code,region,experience_level,expires_at,workplace_type,
  contract_type,hours_type,salary_text,salary_min,application_url,engagement_type,source_name,source_url,
  posted_at,closes_at,published_at,status,withdrawn_at,created_at,updated_at,
  editorial_brief,brief_status,indexing_eligible,jobposting_eligible,source_verified_at,remote_scope_type,remote_scope_text,
  job_career_areas(is_primary,career_areas!inner(slug,title)),
  job_occupations(is_primary,occupations!inner(slug,title,description)),
  job_benefits(benefits!inner(slug,title,description)),
  job_locations(raw_text,address_line_1,address_line_2,locality,region,postal_code,country_code,is_primary),
  job_capabilities(relevance_score,importance,capabilities!inner(slug,title,description,course_capabilities(courses!inner(slug,short_title,public_url,theme_colour,is_active,is_filter_visible,availability_status))))
`;

// Retained for callers that diagnose older development databases.
export const legacyPublicJobFields = publicJobFields.replace(
  /^\s*(?:locality|postal_code|country_code|region),\s*$/gm,
  "",
);
export function isMissingStructuredLocationColumns(error: { code?: string; message: string }) {
  return (
    error.code === "42703" &&
    /column jobs(?:_\d+)?\.(?:locality|postal_code|country_code|region) does not exist/i.test(error.message)
  );
}

async function loadJobs(slug?: string): Promise<readonly Job[]> {
  await connection();
  const client = createPublicClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  let query = client
    .from("jobs")
    .select(publicJobFields)
    .eq("status", "published")
    .lte("published_at", now.toISOString())
    .or(`closes_at.gte.${today},and(closes_at.is.null,expires_at.gte.${today})`)
    .is("withdrawn_at", null);
  // Historical imports are retained for staff and saved-job history; public discovery uses verified briefs.
  query = slug ? query.eq("slug", slug) : query.eq("brief_status", "verified");
  const { data, error } = await query.order("published_at", { ascending: false }).limit(1000);
  if (error) {
    console.error("Public job read failed.", { code: error.code });
    throw new Error("Published jobs could not be loaded.");
  }
  return attachPublicEmployers(client, data);
}

export async function attachPublicEmployers(
  client: SupabaseClient<Database>,
  data: readonly (Omit<PublicJobRecord, "employers"> & { employer_id: number })[],
): Promise<readonly Job[]> {
  if (!data.length) return [];
  const { data: employers, error: employerError } = await client.rpc("public_job_employers", {
    p_ids: [...new Set(data.map((j) => j.employer_id))],
  });
  if (employerError) throw new Error("Employer identities could not be loaded.");
  const identities = new Map((employers ?? []).map((employer) => [employer.id, employer]));
  return data.flatMap((record) => {
    const employer = identities.get(record.employer_id);
    return employer ? [mapPublicJob({ ...record, employers: employer })] : [];
  });
}

export const getPublicJobs = cache(() => loadJobs());
export const getPublicJobBySlug = cache(async (slug: string) => (await loadJobs(slug))[0]);
