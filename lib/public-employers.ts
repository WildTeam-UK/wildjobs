import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { getPublicJobs } from "./public-jobs";
import { getPublishedEmployerIndex } from "./public-employer-profiles";
import { createPublicClient } from "./supabase/public";
import type { PublicEmployer } from "./public-employer-mapper";
import type { Job } from "./jobs";

export const getPublicEmployers = cache(async (): Promise<readonly PublicEmployer[]> => {
  await connection();
  const [jobs, profiles, branding] = await Promise.all([
    getPublicJobs(),
    getPublishedEmployerIndex(),
    createPublicClient().from("directory_organisations").select("name,logo_url"),
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
  return [...new Set([...rolesByName.keys(), ...slugByName.keys()])]
    .sort((a, b) => a.localeCompare(b, "en-GB"))
    .map((name) => {
      const openRoles = rolesByName.get(name) ?? [];
      return {
        name,
        profileSlug: slugByName.get(name),
        logoUrl: logos.get(name) ?? openRoles[0]?.employerLogoUrl,
        openRoles,
        locations: [...new Set(openRoles.map((job) => job.location))],
      };
    });
});
