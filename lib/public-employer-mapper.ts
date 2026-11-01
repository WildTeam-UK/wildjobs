import type { Job } from "./jobs";

export type PublicEmployer = Readonly<{
  aiSummarySourceUrl?: string;
  benefits: readonly string[];
  culture?: string;
  focus: string;
  locations: readonly string[];
  logoUrl?: string;
  mission: string;
  name: string;
  openRoles: readonly Job[];
  overview: readonly string[];
  overviewIsAi: boolean;
  profileStatus: "ai-assisted" | "basic" | "reviewed";
  publishedAt?: string;
  reviewedAt?: string;
  roleCapabilities: readonly string[];
  roleCareerAreas: readonly string[];
  roleCategories: readonly string[];
  shortName: string;
  slug: string;
  websiteUrl?: string;
}>;
