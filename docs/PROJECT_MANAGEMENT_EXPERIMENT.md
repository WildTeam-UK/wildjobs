# Project Management course-page experiment

## Scope and publication

The user requested a publicly shareable, unindexed WildJobs experiment to review a complete Project Management for Wildlife Conservation sales-page redesign and the proposed ecosystem navigation. Route: `/experiments/project-management`.

This is a static design experiment, not a new course, checkout, learner account or SSO implementation. Real purchases, account sign-in and learning remain on WildTeam Training; the experimental header now includes an explicitly simulated account state described below. The standard WildJobs navigation is retained on every other route. The experiment is not linked from public navigation or included in the sitemap.

The page has unconditional `noindex, nofollow` metadata, a route-prefix `X-Robots-Tag: noindex, nofollow, noarchive` response header, and a canonical pointing to the existing LearnWorlds course. Crawling remains allowed so search engines can read those instructions. No course/offer structured data is published for this duplicate experiment. Publicly accessible means anyone with the link can view it; noindex is not access control.

## Content evidence checked on 4 November 2026

- [Current course page](https://training.wildteam.org.uk/course/project-management-for-wildlife-conservation): course scope, intended audience, self-paced delivery, exam, support, free exam retake, French version, 10 CPD hours and Mbali Sishange’s testimonial.
- [Current best-practice manual, 2026 version 5](https://lwfiles.mycourse.app/6874ec826e31c5cf606cc001-public/publicFiles/WildTeam%202026%20Project%20Management%20for%20Wildlife%20Conservation%20V5.pdf): four principles; roles; five phases (Plan, Fund, Prepare, Implement, Close); control and administrative processes; plans, trackers and reports; supporting templates. The manual is 71 PDF pages. The old 2017 v2 reference was inspected but is not used for the course content: it has an older four-phase framework.
- [Memberships](https://training.wildteam.org.uk/memberships): £190 single course with one year of access, £29 billed monthly, £290 billed annually, membership access and cancellation wording, trainer support and Junior Jaime Alberto’s PMWC testimonial. £58 annual saving is calculated against 12 payments of £29; the prototype does not repeat the inconsistent rounded monthly-equivalent/percentage claims elsewhere on the existing site.
- [WildTeam’s article on embedding project management](https://training.wildteam.org.uk/blog/infusing-project-management-into-organisation): practical applications, team adoption, and the difference between a reference manual and structured training.
- [LearnWorlds login documentation](https://support.learnworlds.com/support/solutions/articles/12000044648): supported `/?msg=not-logged-in` login link.

Curriculum headings are sales-page summaries of verified coverage, not a claim about exact lesson names or module count. Testimonials are real published excerpts, without invented ratings or learner photographs. The certificate uses the unchanged, captioned example already published by WildTeam Training. No employment, salary, promotion, refund, lifetime-access or completion-rate guarantee is introduced. Course-duration and lesson-count counters on the current page did not render reliably, so they are not repeated.

## Photography and artwork

- `public/images/course-experiment/lion.jpg`: Dušan veverkolog, [close-up photography of lion](https://unsplash.com/photos/close-up-photography-of-lion-ZXuDkw7Be7E), standard Unsplash License. Source: `https://images.unsplash.com/photo-1550699566-83f93df24072`. This is the photograph credited on the current WildTeam manual. Visible credit uses the shared WildNews treatment. It is illustrative and does not imply a photographed WildTeam conservation project.
- `public/images/course-experiment/pmwc-manual-v5.jpg`: the unchanged front-cover image extracted from WildTeam’s own current manual. The photograph attribution appears on the hero; the manual contains its own credits and licence. The full PDF is linked at its original destination rather than copied into this repository.

## Conversion design

The sequence is outcome-led hero → practical facts → problems and outcomes → five-phase approach → expandable course coverage → free manual/toolkit → audience fit → published learner experiences → certification → purchase/membership comparison → FAQs → final action. Prices and access periods appear before the first purchase decision; monthly and annual billing are explicit. Bursaries, team training and existing-member access remain discoverable. No manufactured urgency, scarcity or endorsement logos.

## LearnWorlds implementation map

All major layouts can be built from Site Builder sections: two-column hero and image; four-column facts; anchor links; text and checklist columns; five-column process (stacked on phones); accordion widgets; image/text manual section; three-column audience/pricing; quote blocks; FAQ accordion; final CTA. Use the same brand font assets, colours, widths, radius and button styles. Responsive spacing and the exact split label/chevron navigation may need scoped CSS. No dependency on a canvas, animation library, custom player, API or bespoke checkout.

The experimental navbar is Jobs, News, Training, About, followed by a plain Sign in control and Start learning button. Each section name remains a link and has a separate disclosure button. Training is highlighted. Clicking Sign in simulates the future account/avatar dropdown on this page only, without authenticating or persisting a session. LearnWorlds should use native menu and real login actions when recreating it; the shared account view requires the later SSO integration. Existing advertising destinations and the LearnWorlds job-board route are untouched.

This review prototype does not prove a conversion improvement. A later production comparison should measure course-option clicks, free-manual engagement and completed enrolments with the existing consent requirements and appropriate LearnWorlds attribution.

## Review refinements · 4 November 2026

The experiment now demonstrates the proposed future account state rather than linking its Sign in control to real authentication. Clicking the plain-text/icon Sign in control switches this page's in-memory state to “Hey, Matt!” with an initial avatar and opens My learning, Saved jobs, Job alerts, Email preferences, Account settings and Sign out. The latter restores the anonymous view. Refresh resets the simulation. My learning and Saved jobs link to existing services; future account settings open an explanatory preview dialog and do not create alerts, change preferences or touch real accounts. The account dropdown's small “Account preview” note identifies the simulation. The ordinary WildJobs header is unaffected.

Navigation sits next to the logo, dropdown eyebrows are removed, and Good News receives the shared purple/middle/pink text gradient. Selected headings use that gradient on light backgrounds; dark sections retain readable light headings. Breadcrumbs and the learner-experience disclaimer are removed. The hero leads with £29 monthly membership and retains the £190 single-course alternative; pricing is ordered monthly membership, annual membership, then the individual course, with monthly membership highlighted. The manual section and supporting accents use the brand's pale purple palette. The final decorative leaf is replaced by the existing WildTeam brand mark.

`public/images/course-experiment/pmwc-certificate-example.png` is the unchanged example certificate already published on the [current PMWC page](https://training.wildteam.org.uk/course/project-management-for-wildlife-conservation). Original asset: `https://lwfiles.mycourse.app/6874ec826e31c5cf606cc001-public/026faa6d6c762ef53652877d69486886.png`. It is explicitly captioned as an example and can be opened at full size. It is not generated, edited, or presented as a certificate earned by the viewer.
