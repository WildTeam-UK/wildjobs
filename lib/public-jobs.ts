import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import type { Job } from "./jobs";
import { mapPublicJob } from "./public-job-mapper";
import { createPublicClient } from "./supabase/public";

const publicJobFields = `
  slug,
  title,
  summary,
  description,
  responsibilities,
  requirements,
  location_text,
  country_code,
  region,
  workplace_type,
  contract_type,
  hours_type,
  salary_text,
  application_url,
  posted_at,
  closes_at,
  published_at,
  created_at,
  employers!inner(slug, name, short_name, website_url),
  job_career_areas(is_primary, career_areas!inner(slug, title))
`;

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
  const { data, error } = await client
    .from("jobs")
    .select(publicJobFields)
    .eq("status", "published")
    .lte("published_at", now.toISOString())
    .gte("closes_at", now.toISOString().slice(0, 10))
    .is("withdrawn_at", null)
    .order("published_at", { ascending: false });

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
    .gte("closes_at", now.toISOString().slice(0, 10))
    .is("withdrawn_at", null)
    .maybeSingle();

  if (error) throw publicReadError("load", error);

  return data ? mapPublicJob(data) : undefined;
});
