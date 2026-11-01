import type { Job } from "./jobs";
export type PublicEmployer = Readonly<{
  name: string;
  slug: string;
  shortName: string;
  logoUrl?: string;
  openRoles: readonly Job[];
  locations: readonly string[];
}>;
