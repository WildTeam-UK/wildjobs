# WildJobs

WildJobs is WildTeam's independent conservation careers platform, intended for `jobs.wildteam.org.uk`.

This initial scaffold demonstrates the public discovery experience with clearly labelled fixture data. It has no database, authentication, analytics, marketing integration, job importer, or deployment configuration.

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
- Shared-package distribution is being prepared through private GitHub Packages releases. The temporary `--wt-*` CSS token declarations in `app/globals.css` will be removed when `@wildteam-uk/tokens` is installed from an approved release.
- Read `docs/PRODUCT_SCOPE.md`, `docs/ARCHITECTURE.md`, and `docs/DATA_OWNERSHIP.md` before implementation.
