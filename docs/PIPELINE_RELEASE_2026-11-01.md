# EnvironmentJob pipeline production release — 1 November 2026

The user approved deployment of PR #14, activation of EnvironmentJob only, a controlled quality pilot, and automatic publication after the pilot passed.

## Result

EnvironmentJob is the sole source permitted for collection, AI processing and automatic publication. The replacement is deployed on the current WildJobs production aliases. Source-wide publication was enabled after the assurance pilot passed factual checks, independent review, human comparison with the original advert and rendered desktop/mobile verification. The climate role subsequently published automatically as well. The first full automatic feed import then read 177 vacancies and created 172 additional source records, confirming discovery beyond the original five-record legacy pilot.

| Pilot                                                         | Result                | Quality evidence                                                                                                                                                                        |
| ------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conservation Project Manager (Assurance), WWT                 | Published             | Salary, permanent contract, working hours, minimum office attendance, duties and all essential criteria preserved. Independent accuracy, usefulness and completeness checks passed.     |
| Senior Climate Change Officer, Exmoor National Park Authority | Published             | Twelve essential criteria retained, pay range and pro-rata qualification preserved, part-time consideration and two-year term retained. Independent review passed.                      |
| Project Administrator, CAOLAS                                 | Held for staff review | Visible advert states a total salary for a nine-month appointment, while structured salary metadata labels a different period. The exact salary-text gate blocked the generated result. |

Live pilot: [WWT assurance brief](https://wildjobs-olive.vercel.app/jobs/conservation-project-manager-assurance-wwt-111). Original evidence: [EnvironmentJob advert](https://environmentjob.co.uk/jobs/112185-conservation-project-manager-assurance).

## Fixes established by the live pilot

- Include structured and visible header facts with the description so salary, geography and contract information reach generation and validation together.
- Accept paired quotation marks around an otherwise exact evidence extract, while continuing to reject invented evidence.
- Allow up to twelve distinct essential criteria, avoiding the material omissions caused by the earlier six-item cap.
- Clear old evaluation metadata atomically when a validated brief returns to pending publication. Add regression coverage using a previously evaluated source record.
- Populate evaluation metadata when a fresh record is blocked, satisfying the existing state constraint.
- Keep superseded source revisions out of the current staff exception queue and query exceptions independently of the latest successful tasks.
- Coalesce scheduled verification with existing feed verification tasks, avoiding duplicate source fetches after a full import. Superseded revisions are cancelled before fetching.

## Controls and verification

Every brief receives independent AI review during this initial rollout. Sampling is a later optimization requiring quality evidence. Cheaper primary generation, cached results, bounded escalation, budget reservations, daily limits, deferred work and the existing scheduler remain in place. No new service or second scheduler was created. The minute cron remains active and skips idle Vercel calls through a database predicate.

The first pilot accounting snapshot recorded 17 completed provider requests, 61,668 input tokens and 20,556 output tokens, approximately US$0.20 at configured rates, including corrective reruns. This is a ledger estimate, not a provider invoice or a promised cost per future job. No requests were uncertain at that snapshot.

Validation passes: 203 unit tests, formatting, lint, TypeScript, production build, fresh database replay, schema lint and both rollback-only SQL suites. The integration regression also passed against the hosted schema inside a rolled-back transaction. The live assurance page was checked at desktop and 390px widths: no horizontal page overflow, no console warnings/errors, correct source/application links, verification date, canonical, noindex and no JobPosting markup.

Indexing remains off pending the launch domain; no DNS or marketing/training-system changes were made. Employer-profile publication remains independent. CJS and WWT source active flags were not modified, and neither source has permission to enter the replacement automation.
