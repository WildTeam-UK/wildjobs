import "server-only";
import { cache } from "react";
import { getPublicJobs } from "./public-jobs";
import type { PublicEmployer } from "./public-employer-mapper";
export const getPublicEmployers = cache(async (): Promise<readonly PublicEmployer[]> => {
  const jobs = await getPublicJobs();
  return [...new Set(jobs.map((j) => j.organisation))].sort().map((name) => {
    const openRoles = jobs.filter((j) => j.organisation === name);
    return {
      name,
      slug: encodeURIComponent(name),
      shortName: name
        .split(/\s+/)
        .slice(0, 3)
        .map((w) => w[0])
        .join(""),
      logoUrl: openRoles[0]?.employerLogoUrl,
      openRoles,
      locations: [...new Set(openRoles.map((j) => j.location))],
      focus: "",
      mission: `Explore current opportunities with ${name}.`,
      overview: [],
      overviewIsAi: false,
      profileStatus: "basic",
      benefits: [],
      roleCapabilities: [],
      roleCareerAreas: [],
      roleCategories: [],
    };
  });
});
