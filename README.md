# WildJobs

WildJobs is WildTeam's independent conservation careers platform, intended for `jobs.wildteam.org.uk`.

This initial scaffold demonstrates the public discovery experience with clearly labelled fixture data. It has no database, authentication, analytics, marketing integration, job importer, or deployment configuration.

The proposed production direction is documented in `docs/IMPLEMENTATION_PLAN.md` and `docs/EXPERIENCE_BLUEPRINT.md`. Both remain drafts until product review; the fixture prototype does not define the production data model.

## Development

Requirements:

- Node.js 22.13 or newer
- pnpm 11.25

```sh
pnpm install
pnpm dev
```

Run the complete local checks with:

```sh
pnpm check
```

## Current boundaries

- Fixture jobs live in `lib/jobs.ts` and are not real vacancies.
- The site is marked `noindex` until approved data and a production domain are connected.
- Shared design tokens are pinned to the private `@wildteam-uk/tokens` package released through GitHub Packages. Local development requires a personal package login; CI uses its repository-scoped `GITHUB_TOKEN`.
- Read `docs/IMPLEMENTATION_PLAN.md`, `docs/EXPERIENCE_BLUEPRINT.md`, `docs/PRODUCT_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_OWNERSHIP.md` before implementation.
