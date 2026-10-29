# WildJobs implementation plan

**Status:** Approved as the beta planning baseline on 2026-10-28
**Purpose:** Replace the scaffold-led view of WildJobs with a product-led plan before database or production implementation begins.

## Product ambition

WildJobs should be the best place to discover and understand conservation careers, not merely a searchable vacancy list. It should combine trustworthy opportunities, strong employer context, useful career guidance and a personalised return experience while remaining clear about where each vacancy came from and where an application is completed.

The existing fixture-based prototype is a design and interaction reference only. It does not define the production product, database or launch scope.

## Primary audiences and outcomes

### Candidates

- Discover relevant roles even when they do not know the exact title to search for.
- Understand the mission, employer, salary, location, requirements and closing date quickly.
- Save opportunities and build useful preferences for future recommendations and alerts.
- Move confidently to the authoritative application destination.

### Employers and listing partners

- Present organisations and roles credibly.
- Supply complete, transparent vacancy information through an approved submission or import route.
- Understand listing status without gaining unsafe direct access to publishing controls.

### WildTeam staff

- Review, correct, approve, expire and withdraw listings.
- Preserve source attribution and detect duplicate or stale vacancies.
- Understand which content helps people progress without collecting unnecessary personal data.

## Experience principles

1. **Discovery before filtering.** Use curated collections, career themes, locations, employers and editorial pathways as well as search and filters.
2. **Trust is visible.** Show salary, closing date, working pattern, location, source, publication status and employer context consistently.
3. **The job page does the work.** Give each vacancy a rich, accessible, search-friendly page rather than sending people away from a thin card.
4. **Personalisation is earned.** Start with explicit preferences and saved jobs; do not infer sensitive traits or introduce opaque ranking.
5. **Applications stay honest.** Make it clear when WildJobs hands the candidate to an external application system.
6. **Mobile is a primary journey.** Browsing, saving and returning to a role must work well on a phone.
7. **Accessibility, privacy and performance are launch requirements.** They are not a later polish phase.

## Proposed beta scope

### Public discovery

- An editorial homepage with featured opportunities, timely collections and clear routes into conservation career areas.
- Search across approved active vacancies.
- Useful filters for category, location, remote or hybrid status, employment type, experience level and salary where the source provides it.
- The first filter bar includes text search, paid or volunteer, advertised location suggestions, cause, contract type, salary, work location and course-aware discovery. True distance-radius search waits for reviewed coordinates rather than pretending that location text is geographic data.
- Curated collection pages such as early-career roles, remote opportunities, field roles and closing soon.
- Course-aware discovery that lets anyone select a WildTeam course and find roles related to the capabilities it covers.
- Rich job detail pages with structured metadata and visible source attribution.
- Employer profile pages showing approved organisation information and active roles.
- Career-facing supporting content or signposts where it genuinely improves the journey.

### Candidate accounts

- Email-based sign-up and sign-in through the WildJobs Supabase project.
- Saved jobs.
- Explicit job preferences.
- A simple candidate dashboard showing saved and recently relevant opportunities.
- Optional job alerts only after the delivery provider, frequency, consent and unsubscribe behaviour are approved.

Candidate accounts remain WildJobs accounts until a separate central identity decision introduces shared sign-in.

### Publishing and operations

- An approved feed, API or curated import path for the first job source.
- Staff review, approval, correction, expiry and withdrawal controls.
- Duplicate detection using source identifiers and canonical URLs.
- A controlled employer submission route. Full employer self-service can follow after the moderation workflow is proven.

### Measurement

Adopt the shared event contract once approved. The initial useful events are expected to include:

- `job_search_performed`
- `job_collection_viewed`
- `job_viewed`
- `job_saved`
- `application_clicked`
- `employer_viewed`
- `account_created`
- `preferences_updated`

Optional analytics must not run before the applicable consent state permits them. Events must not contain email addresses, CV content or other unnecessary personal data.

## Explicitly deferred from the beta

- CV or document storage.
- Hosting job applications inside WildJobs.
- Employer payments and fully automated self-service publishing.
- Unbounded AI research, salary estimates or ranking. The prototype may use one bounded structured call for
  unresolved evidence-backed fields and clearly labelled job or employer summaries, behind an off-switch and
  usage ledger. Optional richness must not block a trustworthy listing.
- A personalised job-match score. The future concept is documented in the experience blueprint and requires
  explainable signals, verified course completion and explicit privacy decisions before implementation.
- Verified LearnWorlds account linking and automatic use of completed-course data. Public course-based discovery remains in the beta scope.
- Shared WildTeam single sign-on.
- A central cross-application analytics backend or unified user dashboard.
- Native mobile applications.

These are future product decisions, not hidden requirements of the first database.

## Delivery sequence

### 1. Approve the product and measurement foundations

- Approve this scope and the first-source strategy.
- Approve the shared identity and event architecture decision.
- Confirm the beta success measures and privacy boundaries.

### 2. Design the complete beta experience

- Information architecture and navigation.
- Candidate, employer and staff journeys.
- Desktop and mobile screens for discovery, job details, employer profiles, accounts, saved jobs and moderation.
- Loading, empty, error, expired and withdrawn states.
- Content requirements for every public record.

### 3. Create the WildJobs backend foundation

- Create the independent `wildjobs` Supabase project in the WildTeam UK organisation.
- Document local, preview and production environment variables without committing values.
- Create an ordered migration plan with Row Level Security for every exposed table.
- Define public, candidate, staff and server-only access before writing policies.

### 4. Build in vertical slices

1. Approved job ingestion and staff review.
2. Public homepage, collections and discovery.
3. Rich job and employer pages.
4. Candidate authentication, saved jobs and preferences.
5. Dashboard and alerts if the alert decision is approved.
6. Employer submission and moderation improvements.

Each slice includes accessibility, responsive behaviour, security, tests and measurement rather than deferring them to the end.

### 5. Launch a measured beta

- Seed only approved, current vacancies.
- Remove `noindex` only after fixture data is gone and production content is verified.
- Test candidate, staff and external-application journeys end to end.
- Monitor search, view, save and application-click behaviour.
- Use evidence from the beta to decide which deferred capabilities deserve investment.

## Decisions required before schema design

1. Which approved source or curation process supplies the first live vacancies?
2. Are saved jobs and preferences included in the first public beta, as proposed?
3. Are job alerts included at launch or immediately after the initial beta?
4. What is the controlled first version of employer submission?
5. Which career collections and information architecture should lead the homepage?
6. Which measurement provider receives the approved event contract during the beta?
7. Which LearnWorlds course identifiers, public metadata and learning outcomes are approved for the beta course-to-capability mapping?

Until these decisions are approved, the fixture prototype may be refined for design exploration but must not be treated as the production data model.
