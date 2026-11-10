import { createHash } from "node:crypto";

export function basicEmployerSlug(name: string) {
  const readable =
    name
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 58)
      .replace(/-$/, "") || "employer";
  return `organisation-${readable}-${createHash("sha256").update(name).digest("hex").slice(0, 12)}`;
}

export function employerPageSlugs(
  employers: readonly { name: string }[],
  published: readonly { organisation_name: string; slug: string }[],
) {
  const slugs = new Map(
    employers
      .filter(({ name }) => name.trim() && name.toLowerCase() !== "organisation not stated")
      .map(({ name }) => [name, basicEmployerSlug(name)]),
  );
  for (const profile of published) slugs.set(profile.organisation_name, profile.slug);
  return slugs;
}
