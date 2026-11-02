# Static page design previews

These are deployed design previews, not data-backed directory features. The four original routes use static sample copy, literal illustrative statistics, a fictional employer and sample vacancies. They make no database, feed, AI or Unsplash API calls. The template layout applies `noindex, nofollow`; these routes have not been added to the sitemap. The user approved deploying the designs on 2 November 2026 while retaining this static, design-only scope. The subsequently requested Career Guides navigation link points to a static `/conservation-career-guides` index, which links to the ecologist design and inherits the same `noindex, nofollow` settings.

## Preview routes

- `/conservation-career-guides`: a static index with 11 illustrated sector tiles and eight career cards, linked from the main navigation. Only Wildlife Conservation and Ecologist link to existing designs. Sector illustrations were supplied by the user; a small CSS crop hides white image edges without altering the originals.
- `/conservation-career-guides/ecologist`: a long-form career guide with a contents sidebar, routes into the profession, day-to-day work, skills, practical experience, salary context, progression, applications, courses, an action plan, sample jobs, FAQs and source notes.
- `/conservation-sector/wildlife-conservation`: sector overview, areas of work, role families, career-change routes, illustrative skills and working-pattern insights, training and sample opportunities.
- `/employers/wildmere-nature-trust`: a fictional employer with an original placeholder mark, mission, organisation facts, working-environment copy, hiring status, historical job metrics and sample current vacancies.
- `/course-recommendations`: explanation of recommendations, optional paid learning, AI-assisted matching, no employment guarantees, a prominent free career-course feature and membership links.

Inline and footer links connect the four designs. The existing job-card explanation links to the recommendations page rather than displaying a tooltip.

## Content and insight choices

Plan roughly 2,000–3,000 words for a substantial career guide, using the space needed to answer the reader's questions. Google does not prescribe a preferred word count. The current career page contains full example prose to exercise a long page rather than empty section placeholders. A live guide still needs role-specific research, an identified author, relevant expert review and source checks.

Use **median advertised annual salary**, with comparable hours/role context and sample size, rather than an unexplained mean. Employer salary summaries must not suggest they describe staff earnings. Other useful future metrics illustrated here are unique vacancies in the past year, active vacancies, employer counts, salary-disclosure coverage, working patterns and skill themes. Skill-theme extraction and the calculation methodology are future work, not implemented features. Avoid treating advertising activity as staff turnover or a complete measure of the market.

The proposed simple career label on each job and career-guide creation after ten matching jobs are deliberately not implemented. No schema, ingestion, deduplication, automation, source management or existing job data has changed.

## Images and sources

Static sample photos have visible Unsplash credits; provenance is recorded in `public/images/design/ATTRIBUTION.md`. Images are illustrative and do not depict the fictional employer. The existing WildTeam illustration is reused for training sections. The Wildlife Conservation hero uses an attributed Unsplash wildlife photograph. Confirm the automated image workflow and its attribution requirements before the future data-backed launch.

Reference checks for the sample copy and links:

- [National Careers Service: Ecologist](https://nationalcareers.service.gov.uk/job-profiles/ecologist)
- [WildTeam's free career course](https://training.wildteam.org.uk/course/launching-your-career-in-wildlife-conservation)
- [WildTeam memberships](https://training.wildteam.org.uk/memberships)
- [Google: helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

The fictional organisation has no invented real charity number, named staff, reviews or certification claims. On 2 November, the user requested finished-looking presentation copy, so visible prototype labels were removed. These statistics and the employer information remain static mock content in the deployed design previews; no data integration was added.

## Design follow-up · 2 November 2026

Removed hero breadcrumbs, title eyebrows, decorative photo frames and the preview navigation strip. Primary buttons use uppercase labels. Responsive comparison panels replace the career, course and working-pattern tables. Employer hiring status uses a brand-gradient pill, with one website link in the profile header.

Deferred product note from the user: add skills to jobs during processing, then use those skills as links to filtered job lists. This is recorded only; no skills extraction, schema, processing or filtering changes are implemented.
