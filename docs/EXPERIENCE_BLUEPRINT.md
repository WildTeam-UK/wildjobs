# WildJobs beta experience blueprint

**Status:** Approved for beta design on 2026-10-28
**Depends on:** `IMPLEMENTATION_PLAN.md`
**Purpose:** Define the site structure, page responsibilities and end-to-end journeys before database schema or production UI work begins.

## Product shape

WildJobs is a conservation careers destination with three connected layers:

1. **Discover:** editorial routes into live opportunities for people who do not yet know the exact title to search for.
2. **Evaluate:** trustworthy job and employer pages that help someone decide whether an opportunity is right for them.
3. **Return:** saved roles, explicit preferences and later alerts that make the site more useful over time.

A fourth connecting idea supports the wider WildTeam ecosystem:

4. **Translate learning into possibilities:** let anyone explore roles related to the capabilities covered by a WildTeam course, and later let a verified learner use completed courses as an explicit discovery input.

Search and filters support these layers; they are not the whole product.

## Proposed primary navigation

- **Find jobs** — the complete search and browse experience.
- **Explore careers** — curated pathways, role families and practical guidance.
- **Employers** — organisation profiles and their current opportunities.
- **For employers** — the controlled route for submitting or discussing a vacancy.
- **Saved jobs** — account-aware shortcut, with sign-in invitation when signed out.

The WildTeam ecosystem and training links belong in the utility navigation or footer rather than competing with the main job-seeking journey.

## Site map

```text
/
├── /jobs
│   └── /jobs/[slug]
├── /collections
│   └── /collections/[slug]
├── /careers
│   └── /careers/[slug]
├── /employers
│   └── /employers/[slug]
├── /for-employers
│   └── /for-employers/submit
├── /sign-in
├── /create-account
├── /account
│   ├── /account/saved
│   ├── /account/preferences
│   └── /account/alerts
└── /admin
    ├── /admin/jobs
    ├── /admin/jobs/[id]
    ├── /admin/employers
    ├── /admin/imports
    └── /admin/submissions
```

The exact URLs may change during design, but each responsibility should remain explicit.

## Page blueprints

### Homepage

The homepage should help a visitor begin with either a search or a meaningful direction.

Recommended sequence:

1. A clear conservation-careers proposition and focused job search.
2. Timely curated routes such as **Closing soon**, **Early-career roles**, **Remote and hybrid**, and **Field-based work**.
3. A small selection of featured or recently verified roles. Paid promotion must never be disguised as relevance.
4. **Explore by career area**, using a small understandable set rather than a wall of keyword links.
5. Employer spotlight or organisations currently recruiting.
6. Practical career guidance or a WildTeam training signpost where it serves the user's next step.
7. A restrained account or alert invitation explaining the benefit before asking for registration.

The homepage must not render the entire job catalogue or filter panel.

### Find jobs

This is the focused catalogue experience.

- Search by role, skill, employer or location.
- Filter by career area, location, remote or hybrid status, employment type, experience level and salary where available.
- Filter by a relevant WildTeam course using an approved mapping from course outcomes to job capabilities.
- Show active filter chips and an obvious clear-all action.
- Preserve search state in the URL so a result set can be shared and returned to.
- Provide useful sort options such as relevance, newest and closing soon.
- Explain result counts and changes to assistive technology without creating noisy announcements.
- On mobile, open filters in an accessible contained panel and keep the result list primary.
- Offer relevant collections or preference saving when no exact match exists.

Job cards should consistently show employer, title, location, working arrangement, salary where supplied, employment type and closing date. They should not repeat long descriptions.

When a course filter is active, the results page must explain that the roles are related to capabilities covered by the course. It must not claim that completing the course makes someone qualified for every result.

### Collection page

A collection is an editorial route into jobs, not merely a preselected filter URL.

Each page should contain:

- A short explanation of who the collection is for.
- Its inclusion rules and freshness.
- The active opportunities.
- Related career guidance or adjacent collections.

Initial candidates:

- Early-career conservation roles.
- Remote and hybrid roles.
- Fieldwork and practical conservation.
- Conservation communications and fundraising.
- Science, research and monitoring.
- Roles closing soon.

Collections must be based on trustworthy structured fields or explicit curation, not opaque inference.

### Job page

The job page is the core conversion and trust surface.

Above the fold:

- Employer and job title.
- Location and working arrangement.
- Salary or an honest **Not provided** state.
- Employment type and experience level.
- Closing date with a clear urgency state.
- Save action.
- Primary **Apply on employer site** action when applications leave WildJobs.

Main content:

- Role summary.
- About the role.
- Responsibilities.
- Essential and desirable requirements when supplied.
- Benefits and working conditions.
- Accessibility or reasonable-adjustment information when supplied.
- Application process.
- Source attribution, last verification time and canonical application destination.

Supporting content:

- Employer summary and link to its profile.
- Related roles based on explicit fields.
- Relevant career guidance or training signpost where appropriate.
- Expired, withdrawn and changed states that never leave a misleading apply button active.

Every live job page should use accurate `JobPosting` structured data, canonical URLs and prompt removal or update when the vacancy expires. Structured data must match visible page content.

### Employer profile

Employer pages build confidence without becoming uncontrolled promotional pages.

- Approved organisation name, logo and description.
- Mission, conservation focus and operating locations.
- Website and verified social links where appropriate.
- Working culture, benefits, inclusion and application information when approved.
- Current live jobs.
- Clear indication of which information was supplied by the employer and when it was reviewed.

The beta should not introduce public employer ratings or unmoderated reviews.

### Explore careers

This area helps people understand pathways rather than browse vacancies alone.

Initial content types may include:

- Career-area introductions.
- Common role families and transferable skills.
- Entry routes and experience-building suggestions.
- Honest salary and qualification context when a reliable source exists.
- Relevant WildTeam training links without presenting course completion as a job guarantee.
- Routes from a course or capability into related live jobs, available without connecting a learner account.

This area can launch small. A handful of genuinely useful pages is better than a large thin taxonomy.

### Candidate account and dashboard

The account should earn its existence through utility.

The first dashboard shows:

- Saved jobs, with closing and expiry states.
- Explicit preferences the user can inspect and change.
- Recently relevant opportunities based on those preferences.
- Alert status only after alerts are approved.
- Clear account, privacy, export and deletion controls.

Do not require an account to browse jobs or click through to an application.

### Course-aware discovery and future LearnWorlds connection

Course-based discovery has two deliberately separate modes.

#### Public course discovery

Anyone can choose one or more current WildTeam courses as a search input. WildJobs uses a reviewed mapping:

```text
LearnWorlds course
→ capabilities and topics covered
→ WildJobs career areas and job capability tags
→ related active roles
```

This does not require a learner account, does not assert that the visitor completed the course and does not expose LearnWorlds user data. Course titles, identifiers and public links remain sourced from LearnWorlds; WildJobs owns the editorial mapping between course outcomes and its job taxonomy.

#### Connected learner discovery, later

After a separately approved account-linking integration, a learner can choose to connect training. WildJobs can then preselect verified completed courses and offer a view such as **Jobs related to your completed training**.

- LearnWorlds remains authoritative for course completion, progress and certificates.
- Account control must be verified through a supported provider flow; matching email addresses is not enough.
- WildJobs stores only the minimum link and completion references required for the feature.
- Disconnecting removes the association and personalised course input without changing the LearnWorlds account.
- The learner can inspect, exclude or supplement completed courses before searching.
- Results remain transparent and based on the reviewed course-to-capability mapping, not opaque AI matching.

LearnWorlds currently documents API access to course, user and certification data and supports course-completion events through webhooks. Before implementation, confirm the WildTeam school plan, current API endpoints, stable course and user identifiers, webhook payloads, rate limits and disconnection behaviour.

### For employers and submission

The public employer area should explain:

- Who WildJobs serves.
- What makes a complete and transparent listing.
- Content and salary expectations.
- The review and expiry process.
- Whether the beta is free, invitation-only or manually arranged.

The first submission flow should be short, save only required information and make moderation explicit. Submission does not equal publication.

### Staff workspace

The staff experience prioritises decisions and provenance over visual marketing polish.

- Review queue with source, completeness and duplicate warnings.
- Job editor with structured fields and a rendered public preview.
- Approve, schedule, expire, withdraw and reject actions with an audit trail.
- Employer review and merge controls.
- Import-run status and safe error summaries.
- No direct exposure of service credentials or provider error details.

## Core journeys

### 1. Discover and apply without an account

```text
Homepage or collection
→ job results
→ job page
→ verified external application destination
```

Success means the visitor understands the opportunity and reaches the correct authoritative application page. Registration must not interrupt this route.

### 2. Save and return

```text
Job page
→ Save
→ sign in or create an account if needed
→ return to the same job in a saved state
→ manage it later from Saved jobs
```

The authentication step must preserve the user's original intent and destination.

### 3. Set preferences

```text
Dashboard or no-results state
→ choose career areas, locations, working arrangements and experience level
→ preview matching live jobs
→ optionally enable an alert later
```

Preferences remain inspectable and editable. They are not a hidden behavioural profile.

### 4. Submit and moderate a job

```text
Employer submission
→ validation and acknowledgement
→ staff review
→ corrections or approval
→ public job page
→ automatic expiry or staff withdrawal
```

The source, submitter, review decision and published record remain distinguishable.

### 5. Import from an approved source

```text
Scheduled or manual import
→ validate source record
→ match employer and detect duplicate
→ staff review where required
→ publish or update
→ expire when the source closes
```

A provider failure must not publish incomplete jobs or silently remove valid records.

### 6. Discover through training

```text
Choose a WildTeam course manually
→ see the capabilities used for matching
→ review related live roles
→ refine with normal job filters
```

Later, after verified linking:

```text
Connect training account
→ verify account control
→ select completed courses to use
→ view related live roles
→ disconnect without affecting LearnWorlds
```

## Responsive and accessibility behaviour

- Use semantic landmarks, headings, lists, forms and definition lists before custom interaction patterns.
- Every control has a persistent accessible name and visible keyboard focus.
- Filter changes must be understandable without relying on colour or motion.
- Forms identify required information, explain formats and provide recoverable inline and summary errors.
- Save, apply and account actions must have large touch targets and clear state changes.
- Closing dates and urgency must not be communicated by colour alone.
- Respect reduced-motion preferences and avoid animated result reordering.
- Maintain useful content and actions at narrow widths rather than hiding them behind desktop-only layouts.

## Content and trust requirements

The production record should distinguish:

- Source-provided facts.
- Employer-provided facts.
- WildJobs editorial classification.
- Derived display values.

Unknown information remains unknown. WildJobs must never invent salary, location, closing date, experience level or working arrangement to make a listing appear complete.

## Measurement checkpoints

The first questions are:

- Can people move from discovery into relevant job pages?
- Do they reach authoritative application destinations?
- Which collections help people who do not begin with a precise search?
- Do saved jobs and preferences create useful return visits?
- Do course-based routes help learners translate training into realistic job exploration?
- Where do employer submissions or staff reviews fail?

The event contract should answer these questions with the smallest reasonable set of consented events. Page views alone are insufficient, but collecting every interaction is unnecessary.

## Evidence considered

- Current specialist boards commonly emphasise keyword, category, location and employment-type filtering.
- Conservation career organisations also use guidance, training, employer information and alerts to support discovery beyond vacancies.
- Google requires accurate, visible and current job information for `JobPosting` search features and recommends prompt update or removal of expired roles.
- Accessible recruitment guidance favours short forms, clear required fields, logical navigation and recoverable errors.

References:

- [Google JobPosting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting)
- [Schema.org JobPosting](https://schema.org/JobPosting)
- [ILO and ITU accessibility guidebook for online recruitment systems](https://accessibleemployers.ca/wp-content/uploads/2023/03/ILO-ITU-Guidebook.pdf)
- [Conservation Jobs UK](https://www.conservationjobsuk.com/)
- [Environment.jobs](https://environment.jobs/)
- [Countryside Jobs employer directory](https://www.countryside-jobs.com/jobs/employers)
- [LearnWorlds API documentation](https://support.learnworlds.com/support/solutions/articles/12000017230-learnworlds-api-documentation)
- [LearnWorlds course completion rules and completion events](https://support.learnworlds.com/support/solutions/articles/12000053453)
- [LearnWorlds webhooks](https://support.learnworlds.com/support/solutions/articles/12000025878)

## Next approval

Translate the approved navigation, site map, six core journeys, course-aware discovery and beta account features into screen designs. Confirm the LearnWorlds integration capabilities before designing connected learner data.
