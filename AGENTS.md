# WildJobs project instructions

## Purpose and source of truth

WildJobs is the planned WildTeam conservation careers platform, intended for `jobs.wildteam.org.uk`. This folder will become its independent application repository and source of truth.

Do not scaffold, select a framework, create infrastructure or introduce a data model without an approved WildJobs implementation plan. Preserve application independence from WildNews and other services.

## Shared WildTeam context

The canonical ecosystem architecture, standards and reusable packages live in the private `WildTeam-UK/wildteam-shared` repository.

If `wildteam-shared` is attached or available as `../wildteam-shared`, read its `AGENTS.md` and the relevant documents under `docs/` and `standards/` before planning or implementation. Do not assume the sibling folder exists in CI, deployment or another developer's environment.

## Product boundaries

- WildJobs owns jobs, employers, career profiles and job preferences.
- LearnWorlds owns learner accounts, purchases, course progress, certificates and training access.
- Brevo is the intended system of record for marketing subscriptions and consent evidence.
- Optional training-account linking requires verified ownership and an approved LearnWorlds integration. Never request or store LearnWorlds passwords, and never link accounts using email equality alone.
- Deleting a WildJobs profile or disconnecting training must not delete or disable a LearnWorlds account.
- Shared packages provide versioned UI foundations and contracts, not a shared application database.

## Working practices

- Never commit credentials, tokens, passwords, personal data or real environment values.
- Preserve accessibility, privacy, security and responsive behaviour from the beginning.
- Prefer `@wildteam-uk/tokens` and `@wildteam-uk/ui` once an approved package-consumption path exists.
- Do not commit sibling `file:` dependencies because independent CI and Vercel builds cannot resolve them.
- Do not publish, deploy, create external services or modify marketing and training systems unless explicitly requested.
- Inspect Git status before editing and give the user a concise GitHub Desktop commit summary and description for every completed batch.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
