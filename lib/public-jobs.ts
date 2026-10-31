import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import type { Job } from "./jobs";
import { mapPublicJob } from "./public-job-mapper";
import { createPublicClient } from "./supabase/public";

export const publicJobFields = `
  id,
  slug,
  title,
  summary,
  summary_source,
  description,
  responsibilities,
  requirements,
  location_text,
  locality,
  postal_code,
  country_code,
  region,
  experience_level,
  expires_at,
  workplace_type,
  contract_type,
  hours_type,
  salary_text,
  salary_min,
  application_url,
  engagement_type,
  source_name,
  source_url,
  posted_at,
  closes_at,
  published_at,
  status,
  withdrawn_at,
  created_at,
  employers!inner(slug, name, short_name, website_url, logo_url, overview, ai_summary),
  job_career_areas(is_primary, career_areas!inner(slug, title)),
  job_capabilities(capabilities!inner(course_capabilities(courses!inner(slug))))
`;

export const legacyPublicJobFields = publicJobFields.replace(
  /^\s*(?:locality|postal_code|country_code|region),\s*$/gm,
  "",
) as typeof publicJobFields;

export function isMissingStructuredLocationColumns(error: { code?: string; message: string }) {
  return (
    error.code === "42703" &&
    /column jobs(?:_\d+)?\.(?:locality|postal_code|country_code|region) does not exist/i.test(error.message)
  );
}

function publicReadError(context: string, error: { code?: string; message: string }) {
  console.error(`Unable to ${context} published jobs`, {
    code: error.code,
    message: error.message,
  });

  return new Error("Published jobs could not be loaded.");
}

export const getPublicJobs = cache(async (): Promise<readonly Job[]> => {
  await connection();
  const client = createPublicClient();
  const now = new Date();
  const query = client
    .from("jobs")
    .select(publicJobFields)
    .eq("status", "published")
    .lte("published_at", now.toISOString())
    .or(
      `closes_at.gte.${now.toISOString().slice(0, 10)},and(closes_at.is.null,expires_at.gte.${now.toISOString().slice(0, 10)})`,
    )
    .is("withdrawn_at", null)
    .order("published_at", { ascending: false });
  const { data, error } = await query;

  if (error && isMissingStructuredLocationColumns(error)) {
    const { data: legacyData, error: legacyError } = await client
      .from("jobs")
      .select(legacyPublicJobFields)
      .eq("status", "published")
      .lte("published_at", now.toISOString())
      .or(
        `closes_at.gte.${now.toISOString().slice(0, 10)},and(closes_at.is.null,expires_at.gte.${now.toISOString().slice(0, 10)})`,
      )
      .is("withdrawn_at", null)
      .order("published_at", { ascending: false });

    if (legacyError) throw publicReadError("load", legacyError);

    return legacyData.map((record) => mapPublicJob(record));
  }

  if (error) throw publicReadError("load", error);

  return data.map((record) => mapPublicJob(record));
});

export const getPublicJobBySlug = cache(async (slug: string): Promise<Job | undefined> => {
  await connection();
  const client = createPublicClient();
  const now = new Date();
  const { data, error } = await client
    .from("jobs")
    .select(publicJobFields)
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", now.toISOString())
    .or(
      `closes_at.gte.${now.toISOString().slice(0, 10)},and(closes_at.is.null,expires_at.gte.${now.toISOString().slice(0, 10)})`,
    )
    .is("withdrawn_at", null)
    .maybeSingle();

  if (error && isMissingStructuredLocationColumns(error)) {
    const { data: legacyData, error: legacyError } = await client
      .from("jobs")
      .select(legacyPublicJobFields)
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", now.toISOString())
      .or(
        `closes_at.gte.${now.toISOString().slice(0, 10)},and(closes_at.is.null,expires_at.gte.${now.toISOString().slice(0, 10)})`,
      )
      .is("withdrawn_at", null)
      .maybeSingle();

    if (legacyError) throw publicReadError("load", legacyError);

    return legacyData ? mapPublicJob(legacyData) : undefined;
  }

  if (error) throw publicReadError("load", error);

  return data ? mapPublicJob(data) : undefined;
});
