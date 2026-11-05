import type { Job } from "./jobs";
export type PublicEmployer = Readonly<{
  name: string;
  profileSlug?: string;
  logoUrl?: string;
  openRoles: readonly Job[];
  locations: readonly string[];
}>;
