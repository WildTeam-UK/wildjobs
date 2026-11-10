import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "./supabase/public";
import { employerProfileContent } from "./employer-profile-content";
import { basicEmployerSlug } from "./employer-page-slug";

type PublishedEmployer = { organisation_name: string; slug: string; researched_at: string };

function schemaPending(error: { code: string }) {
  return error.code === "PGRST205" || error.code === "42P01";
}

export const getPublishedEmployerIndex = cache(async () => {
  await connection();
  const db = createPublicClient();
  const profiles: PublishedEmployer[] = [];
  for (let from = 0; ; from += 1000) {
    const result = await db
      .from("employer_profiles")
      .select("organisation_name,slug,researched_at")
      .order("slug")
      .range(from, from + 999);
    if (result.error && schemaPending(result.error)) return [];
    if (result.error) throw new Error("Employer profiles could not be loaded.");
    profiles.push(...result.data);
    if (result.data.length < 1000) return profiles;
  }
});

// The importer already creates directory_organisations. Those existing public
// facts provide an immediate employer page while official-source research runs.
export const getPublicEmployerPage = cache(async (slug: string) => {
  const researched = await getPublishedEmployer(slug);
  if (researched) return researched;
  if (!/^organisation-[a-z0-9-]+-[a-f0-9]{12}$/.test(slug) || slug.length > 100) return null;
  const db = createPublicClient();
  for (let from = 0; ; from += 1000) {
    const result = await db
      .from("directory_organisations")
      .select("name,logo_url,website_url")
      .order("name")
      .range(from, from + 999);
    if (result.error) throw new Error("Employer details could not be loaded.");
    const employer = result.data.find(
      ({ name }) => name.toLowerCase() !== "organisation not stated" && basicEmployerSlug(name) === slug,
    );
    if (employer) {
      const profiles = await getPublishedEmployerIndex();
      const published = profiles.find((profile) => profile.organisation_name === employer.name);
      if (published) return getPublishedEmployer(published.slug);
      return { ...employer, slug, content: null, researchedAt: null };
    }
    if (result.data.length < 1000) return null;
  }
});

export const getPublishedEmployer = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  await connection();
  const db = createPublicClient();
  const profile = await db
    .from("employer_profiles")
    .select("organisation_name,slug,content,researched_at")
    .eq("slug", slug)
    .maybeSingle();
  if (profile.error && schemaPending(profile.error)) return null;
  if (profile.error) throw new Error("Employer profile could not be loaded.");
  if (!profile.data) return null;
  const brand = await db
    .from("directory_organisations")
    .select("name,logo_url,website_url")
    .eq("name", profile.data.organisation_name)
    .single();
  if (brand.error) throw new Error("Employer details could not be loaded.");
  return {
    ...brand.data,
    slug: profile.data.slug,
    researchedAt: profile.data.researched_at,
    content: employerProfileContent.parse(profile.data.content),
  };
});
