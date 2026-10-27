# WildJobs data ownership

| Data                                                           | Owner                                         | Initial status      |
| -------------------------------------------------------------- | --------------------------------------------- | ------------------- |
| Job listing record                                             | WildJobs                                      | Fixture only        |
| Employer or organisation record                                | WildJobs                                      | Fixture only        |
| Source attribution and external identifiers                    | WildJobs, derived from approved provider data | Deferred            |
| Import execution history                                       | WildJobs                                      | Deferred            |
| Staff access                                                   | WildJobs                                      | Deferred            |
| Public profile, saved jobs and preferences                     | WildJobs                                      | Deferred            |
| Learner account, enrolment, purchase, progress and certificate | LearnWorlds                                   | Out of scope        |
| Marketing subscriptions and consent evidence                   | Brevo                                         | Out of scope        |
| Shared design tokens and UI package code                       | `wildteam-shared`                             | Separate repository |

## Deletion boundaries

Deleting a future WildJobs profile must not delete or disable a LearnWorlds account. Disconnecting a future training link removes only the verified association. Organisation-wide data-subject requests require coordinated handling but do not change each service's operational ownership.
