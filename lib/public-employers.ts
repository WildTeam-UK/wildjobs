import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { mapPublicEmployer, type PublicEmployer } from "./public-employer-mapper";
import { getPublicJobs } from "./public-jobs";
import { createPublicClient } from "./supabase/public";

const publicEmployerFields = `
  ai_summary,
  ai_summary_generated_at,
  ai_summary_source_url,
  slug,
  name,
  short_name,
  website_url,
  focus,
  mission,
  overview,
  culture,
  locations,
  benefits,
  logo_url,
  reviewed_at,
  published_at
`;

function publicReadError(context: string, error: { code?: string; message: string }) {
  console.error(`Unable to ${context} published employers`, {
    code: error.code,
    message: error.message,
  });

  return new Error("Published employers could not be loaded.");
}

export const getPublicEmployers = cache(async (): Promise<readonly PublicEmployer[]> => {
  await connection();
  const client = createPublicClient();
  const now = new Date().toISOString();
  const [employerResult, jobs] = await Promise.all([
    client
      .from("employers")
      .select(publicEmployerFields)
      .eq("status", "published")
      .lte("published_at", now)
      .order("name"),
    getPublicJobs(),
  ]);

  if (employerResult.error) throw publicReadError("load", employerResult.error);

  return employerResult.data.map((record) => mapPublicEmployer(record, jobs));
});

export const getPublicEmployerBySlug = cache(async (slug: string): Promise<PublicEmployer | undefined> => {
  const employers = await getPublicEmployers();
  return employers.find((employer) => employer.slug === slug);
});
