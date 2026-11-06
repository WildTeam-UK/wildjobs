export type PublicEmployer = Readonly<{
  name: string;
  profileSlug?: string;
  logoUrl?: string;
  openRoleCount: number;
  locations: readonly string[];
  topics: readonly string[];
  sectorSlugs: readonly string[];
}>;
