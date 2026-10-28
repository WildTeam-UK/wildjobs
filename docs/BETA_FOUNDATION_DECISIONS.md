# WildJobs beta foundation decisions

**Status:** Proposed for approval on 2026-10-28

This document resolves the product decisions that must precede the WildJobs production schema. It is a beta baseline, not permission to create infrastructure, collect personal data or enable external integrations.

## Recommended decision set

### 1. First live vacancies

Start with a small, manually curated set of current vacancies from explicitly approved sources, supplemented by invitation-only employer submissions.

- Staff confirm the authoritative source, salary, location, working pattern, closing date and application destination before publication.
- No automated scraping or unrestricted public submission in the beta.
- Every source record retains its external identifier or canonical URL, received time and verification history.
- The exact first source organisations or feeds must be named before production seeding.

**Why:** This tests whether the product is useful without making feed quality, duplicate handling or unsupported scraping the experiment's main risk.

### 2. Saved jobs and preferences

Include saved jobs and explicit job preferences in the first public beta.

- Browsing and external application links remain available without an account.
- Preferences cover career areas, locations, working arrangements and experience level.
- Users can inspect, change and remove their preferences.
- WildJobs does not infer sensitive traits or use opaque ranking.
- Deleting a candidate profile removes its saved jobs and preferences under the approved retention process.

**Why:** Return visits and explicit personalisation are central hypotheses of the WildJobs experience, not optional polish.

### 3. Job alerts

Do not include alerts at initial beta launch. Reconsider them immediately after early usage evidence is available.

Before alerts are enabled, approve the delivery provider, frequency controls, transactional purpose, consent treatment, unsubscribe behaviour, failure handling and retention.

**Why:** Alerts introduce delivery, consent and preference-management obligations without being necessary to test discovery, job evaluation, saving and return visits.

### 4. Employer intake

Use an invitation-only, manually moderated submission route during the beta.

- Submission never publishes automatically.
- Staff can request corrections, reject incomplete records, match or merge employer records and approve a separate job review draft.
- The beta pricing decision remains separate. The experiment can operate without employer payments.
- Do not build public employer accounts or self-service publishing yet.

**Why:** This proves the moderation workflow and listing standard before adding payments, permissions and self-service complexity.

### 5. Homepage collections and information architecture

Lead with four understandable discovery routes:

1. Closing soon.
2. Early-career roles.
3. Remote and hybrid work.
4. Field-based work.

Support these with the approved career-area navigation, employer profiles, course-aware discovery and the complete Find jobs catalogue. Paid promotion must never be disguised as relevance.

**Why:** These routes help candidates who do not begin with a precise job title and directly support the beta success questions.

### 6. Measurement destination and event treatment

Use the existing WildTeam Google Tag Manager and shared Google Analytics 4 setup for approved public analytics, following the established WildNews consent and opt-out approach.

- Map only the approved WildJobs event vocabulary and define allowlisted properties before implementation.
- Do not send email addresses, free-form content, account identifiers or an invented ecosystem identity to Google Analytics.
- Keep saved jobs and preferences as operational WildJobs records. Do not create a second analytics copy merely because an action occurred.
- Local development, preview deployments and authenticated staff routes are not tracked.
- A future first-party or central event store requires a separate retention, deletion and ownership decision.

Initial beta events remain:

- `job_search_performed`
- `job_collection_viewed`
- `job_viewed`
- `job_saved`
- `application_clicked`
- `employer_viewed`
- `account_created`
- `preferences_updated`

**Why:** This aligns WildJobs with the live WildNews measurement setup while preserving the versioned ecosystem vocabulary and avoiding premature centralisation.

### 7. Course-aware discovery

Include public course-based discovery using only approved LearnWorlds catalogue information and a WildJobs-owned editorial capability mapping.

The approved input set is:

- Stable LearnWorlds course identifier.
- Public course title and URL.
- Public status or availability where supplied.
- Reviewed learning outcomes or capability topics.
- WildJobs career-area and job-capability mappings, with review date and provenance.

Do not import learner accounts, progress, purchases, certificates or course-completion data in the beta. Connected learner discovery remains a later integration requiring verified account control.

**Why:** People can explore jobs related to training now without making unsupported identity or LearnWorlds integration assumptions.

## Authentication and platform note

Candidate accounts remain independent WildJobs accounts using the WildJobs Supabase project. Shared WildTeam SSO is deferred.

The proposed authentication baseline is email and password with email confirmation. Before external users are invited:

- Configure production redirect URLs and email confirmation behaviour.
- Select and test a trusted custom SMTP provider for auth email deliverability and branding.
- Add abuse protection and review auth rate limits.
- Confirm account export, correction and deletion behaviour.

Supabase announced that new Free-plan projects using its default SMTP cannot customise auth email templates from 2026-06-03. Default SMTP may support development experiments, but it is not the production email plan.

## Consequences for schema design

The initial schema may cover:

- Source and import provenance.
- Employers and duplicate review.
- Jobs, structured public fields and publication lifecycle.
- Employer submissions and staff review history.
- Candidate profiles, saved jobs and explicit preferences.
- Public course catalogue references and editorial capability mappings.
- Staff roles and immutable audit evidence.

The initial schema must not include:

- Job alerts or delivery history.
- Employer payments or self-service publishing permissions.
- CV or application-document storage.
- LearnWorlds learner records or guessed account links.
- Shared WildTeam identities or cross-application profiles.
- A central analytics warehouse.

## Inputs still required before production seeding

1. Name the first approved vacancy sources or source organisations.
2. Export or identify the approved LearnWorlds course identifiers, public URLs and learning outcomes used for the initial mapping.
3. Confirm the legal and operational review of the WildNews-style analytics consent treatment for WildJobs.
4. Select the production transactional SMTP provider before inviting external candidate accounts.

## Approval

Approval of this document authorises detailed schema, access-role, Row Level Security and migration planning. It does not authorise creation of a Supabase project, production data collection, analytics deployment or external system changes.
