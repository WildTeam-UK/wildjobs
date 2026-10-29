# WildJobs product scope

## Product purpose

WildJobs helps conservation professionals discover trustworthy opportunities and, later, connect career interests with relevant WildTeam training. It is an independent application, not an extension of the LearnWorlds account system.

## Initial public MVP

- Browse currently active conservation jobs.
- Search titles, organisations, summaries, locations and categories.
- Filter by location type, job type and category.
- Read an accessible, search-friendly job detail page.
- See employer, location, salary, job type, source, publication date and closing date clearly.
- Continue to the authoritative source or application page when approved data is connected.
- Preserve visible source attribution.
- Allow authorised staff to review imports and manage listings in a later implementation batch.

## Explicitly deferred

- Public accounts, career profiles and CV storage.
- Saved jobs, job alerts and recommendations.
- Employer self-service and paid listings.
- LearnWorlds account linking or central single sign-on.
- AI matching or ranking. Bounded, labelled summary generation is permitted for prototype enrichment.
- Brevo subscriptions and marketing automation.
- Shared cross-domain consent.
- Dashboard reporting integrations.

## Content and source safeguards

- Do not scrape job content without confirmed permission.
- The first live source must use an approved API, feed or curated import process.
- Preserve the source's canonical URL, attribution and material usage restrictions.
- Expired or withdrawn vacancies must stop appearing in active search.
- Never fabricate salary, closing date, location, working arrangement or employer claims.
- A generated job or employer summary must be grounded in the source material, stored separately from official
  copy and visibly labelled as an AI summary. It must never be presented as the employer’s mission statement.
- Missing optional detail must not hide an otherwise trustworthy vacancy. Unknown closing dates use a visible
  listing-age message and a 30-day fallback lifetime.

## Success criteria for the scaffold

- The public information architecture works with labelled fixture data.
- Search and filters work without a backend.
- Job detail pages expose suitable structured metadata but remain `noindex` while fixtures are present.
- Desktop, tablet and mobile layouts are usable by keyboard and assistive technology.
- No external platform or production application is affected.
