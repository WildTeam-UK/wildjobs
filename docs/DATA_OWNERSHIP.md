# WildJobs data ownership

| Data                                                           | Owner                                          | Initial status                       |
| -------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| Job listing record                                             | WildJobs                                       | Fixture only                         |
| Employer or organisation record                                | WildJobs                                       | Fixture only                         |
| Source attribution and external identifiers                    | WildJobs, derived from approved provider data  | Deferred                             |
| Import execution history                                       | WildJobs                                       | Deferred                             |
| Staff access                                                   | WildJobs                                       | Deferred                             |
| Public profile, saved jobs and preferences                     | WildJobs                                       | Saved jobs and preferences connected |
| Course-to-job capability mapping                               | WildJobs, based on approved course outcomes    | Schema and public filter connected   |
| Course catalogue metadata used by WildJobs                     | LearnWorlds, referenced or derived by WildJobs | Sync built; configuration pending    |
| Learner account, enrolment, purchase, progress and certificate | LearnWorlds                                    | Out of scope                         |
| Marketing subscriptions and consent evidence                   | Brevo                                          | Out of scope                         |
| Shared design tokens and UI package code                       | `wildteam-shared`                              | Separate repository                  |

## Deletion boundaries

Deleting a future WildJobs profile must not delete or disable a LearnWorlds account. Disconnecting a future training link removes only the verified association. Organisation-wide data-subject requests require coordinated handling but do not change each service's operational ownership.

Selecting a course manually for search is a WildJobs preference and is not evidence of enrolment or completion. Any future completed-course data must come from a verified LearnWorlds connection, remain attributable to LearnWorlds and be removable from WildJobs without altering the training account.

The beta LearnWorlds connection is catalogue-only. A server-side read token retrieves allowlisted public
course identifiers, titles, descriptions, URLs and availability. WildJobs stores the minimum derived copy needed
for a resilient search filter, its last-sync time and a bounded operational status. Removing a course from public
discovery or deleting its WildJobs copy does not change the LearnWorlds course. Capability mappings remain
WildJobs-owned editorial records and are not overwritten by catalogue sync.
