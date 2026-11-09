import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { guideWindowStart } from "./guide-market";
import { countryName, normaliseCountryCode } from "./job-filtering";
import { getPublicCareerAreas } from "./public-career-areas";
import { getPublicJobs } from "./public-jobs";
import { getPublishedEmployerIndex } from "./public-employer-profiles";
import { createPublicClient } from "./supabase/public";
import type { PublicEmployer } from "./public-employer-mapper";
import type { Job } from "./jobs";

async function getRecentListingsByEmployer() {
  const db = createPublicClient();
  const now = new Date();
  const listingsByName = new Map<string, { sectors: Set<string>; countries: Set<string> }>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("directory_jobs")
      .select("organisation_name,sector_slugs,country_code")
      .is("merged_into", null)
      .gte("posted_at", guideWindowStart(now))
      .lte("posted_at", now.toISOString())
      .order("posted_at")
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error("Employer listing history could not be loaded.");
    for (const { organisation_name: name, sector_slugs: slugs, country_code: code } of data) {
      const listing = listingsByName.get(name) ?? {
        sectors: new Set<string>(),
        countries: new Set<string>(),
      };
      for (const slug of slugs) listing.sectors.add(slug);
      if (code) listing.countries.add(code);
      listingsByName.set(name, listing);
    }
    if (data.length < 1000) return listingsByName;
  }
}

export const getPublicEmployerDirectory = cache(async () => {
  await connection();
  const [jobs, profiles, branding, recentListings, careerAreas] = await Promise.all([
    getPublicJobs(),
    getPublishedEmployerIndex(),
    createPublicClient().from("directory_organisations").select("name,logo_url"),
    getRecentListingsByEmployer(),
    getPublicCareerAreas(),
  ]);
  if (branding.error) throw new Error("Employer logos could not be loaded.");
  const logos = new Map(branding.data.map(({ name, logo_url }) => [name, logo_url]));
  const slugByName = new Map(profiles.map((profile) => [profile.organisation_name, profile.slug]));
  const rolesByName = new Map<string, Job[]>();
  for (const job of jobs) {
    if (job.organisation.toLowerCase() === "organisation not stated") continue;
    const group = rolesByName.get(job.organisation) ?? [];
    group.push(job);
    rolesByName.set(job.organisation, group);
  }
  const employers = [...new Set([...rolesByName.keys(), ...slugByName.keys()])]
    .sort((a, b) => a.localeCompare(b, "en-GB"))
    .map((name): PublicEmployer => {
      const openRoles = rolesByName.get(name) ?? [];
      const listing = recentListings.get(name);
      const sectorSlugs = new Set(listing?.sectors);
      const countryCodes = new Set(listing?.countries);
      for (const job of openRoles) {
        for (const { slug } of job.careerAreaTerms ?? []) sectorSlugs.add(slug);
        if (job.countryCode) countryCodes.add(job.countryCode);
      }
      return {
        name,
        profileSlug: slugByName.get(name),
        logoUrl: logos.get(name) ?? openRoles[0]?.employerLogoUrl,
        openRoleCount: openRoles.length,
        locations: [...new Set(openRoles.map((job) => job.location))],
        topics: [...new Set(openRoles.flatMap((job) => [job.category, ...(job.careerAreas ?? [])]))].filter(
          Boolean,
        ),
        sectorSlugs: [...sectorSlugs],
        countryCodes: [...new Set([...countryCodes].map(normaliseCountryCode))].filter((code) =>
          /^[A-Z]{2}$/.test(code),
        ),
      };
    });
  const usedSectors = new Set(employers.flatMap((employer) => employer.sectorSlugs));
  const sectors = careerAreas
    .filter(({ slug }) => usedSectors.has(slug))
    .map(({ slug, title }) => ({ slug, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "en-GB"));
  const countries = [...new Set(employers.flatMap((employer) => employer.countryCodes))]
    .map((value) => ({ value, label: countryName(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "en-GB"));
  return { employers, sectors, countries };
});
