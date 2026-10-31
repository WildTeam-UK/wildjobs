# WildJobs listing pipeline

**Status:** Approved product and implementation baseline from 2026-10-31.

This document is the source of truth for automated job ingestion, enrichment, publication and expiry. Earlier beta documents remain useful background, but this pipeline takes precedence where they conflict.

## Operating principles

- Preserve the source content and provenance; normalized values never replace it.
- Run deterministic extraction before one bounded AI pass.
- AI may summarize, classify and map evidence. It must not invent facts.
- Reuse canonical employers and taxonomy terms instead of researching or creating them repeatedly.
- Staff-reviewed values always take precedence over imports and AI.
- Jobs and employer profiles have separate readiness and publication decisions.
- Course relevance and employer-profile richness enhance a job but do not block an otherwise complete listing.
- Expired jobs leave public search but remain available as structured historical data.
- Routine operation is automatic; staff work is limited to an exception queue.

## Pipeline

```text
discover -> clean -> deduplicate -> resolve employer -> enrich once
         -> validate -> publish -> expire -> retain for analysis
```

### 1. Discover

An approved feed or API creates or updates a private source record. Store the source identifier, canonical URL, original values, content hash, first-seen time and last-seen time.

No public job or employer is created at this stage.

### 2. Clean and deduplicate

Normalize URLs and deterministic values, then check for:

- the same source identifier;
- the same canonical or application URL;
- the same normalized title and canonical employer;
- a changed version of an already known vacancy.

Ambiguous matches go to the exception queue. They are not published automatically.

### 3. Resolve the employer

Match a canonical employer using verified names, aliases and official website domains. Create a private employer identity only when no safe match exists.

Employer identity is required for a job. A complete public employer profile is not.

### 4. Enrich once

Deterministic extraction runs first. One bounded structured AI pass then handles semantic fields and taxonomy mappings that remain unresolved.

Every enriched value stores its original wording, normalized value, evidence, confidence, method and policy version. Unknown values remain unknown.

AI is not rerun on a schedule. It may run again only after a staff request or a material source change that invalidates existing enrichment.

### 5. Validate publication readiness

A job is ready only when it has:

- title;
- canonical employer identity;
- short summary;
- full description;
- original source URL;
- application URL or clear application instructions;
- location plus on-site, hybrid or remote interpretation;
- paid or volunteer status;
- source closing date, or the 30-day fallback expiry;
- at least one career area;
- no unresolved duplicate risk.

Salary, hours, contract, experience, responsibilities and requirements are retained when advertised. A genuinely unstated optional field does not block publication.

Employer profile content, capabilities and relevant courses are independent enhancements and do not block publication.

### 6. Publish

Publication creates the public job and an auditable decision. It must preserve the complete description and the original source attribution.

Publishing a job does not automatically publish its employer profile.

### 7. Expire and retain

- When a source closing date exists, expire the job after that date.
- Otherwise, expire it 30 days after WildJobs first discovered it.
- Expiry is deterministic and uses no AI.
- Expired jobs leave public discovery but their structured data and evidence remain available for aggregate career analysis.

## Job field dictionary

Each source-derived field can carry a raw value, normalized value, evidence, confidence and staff override.

### Required to publish

| Field            | Normalized form                                          |
| ---------------- | -------------------------------------------------------- |
| Title            | Clean display title plus canonical occupation mapping    |
| Employer         | Canonical employer ID; preserve source wording           |
| Summary          | Concise evidence-based summary                           |
| Description      | Complete source-supported vacancy description            |
| Source           | Approved source ID and original URL                      |
| Application      | Secure URL or clear instructions                         |
| Location         | One or more structured locations and working arrangement |
| Engagement       | Paid or volunteer                                        |
| Lifetime         | Closing date or deterministic fallback expiry            |
| Career area      | One or more canonical career-area IDs                    |
| Duplicate status | Clear, possible duplicate or confirmed duplicate         |

### Capture when advertised

- salary currency, minimum, maximum and pay period;
- full-time, part-time or flexible hours;
- permanent, fixed-term, temporary or contract arrangement;
- experience or seniority level;
- responsibilities;
- essential and desirable requirements;
- qualifications;
- travel or driving-licence requirements;
- visa sponsorship or right-to-work restrictions;
- background-check requirements;
- application documents, closing time and timezone;
- application accommodations or accessibility information;
- job-specific benefits.

### Location model

A job may have multiple locations. Preserve the source location text and, when supported, normalize:

- address lines;
- city or locality;
- county, state or region;
- postcode;
- ISO country code;
- optional coordinates;
- precision: exact address, postcode, locality, region or country;
- on-site, hybrid or remote;
- remote eligibility scope;
- travel requirements.

Never substitute an employer headquarters address for a job location.

## Employer enrichment

Employer enrichment runs only for a new, incomplete, stale or staff-requested employer. Later vacancies reuse the canonical record.

Use official employer sources to collect, when available:

- canonical and short names, aliases and verified domain;
- logo, website and careers URL;
- overview and mission;
- conservation focus and organisation type;
- headquarters and operating locations;
- employer-wide benefits;
- culture and flexible-working information;
- accessibility or inclusion information;
- organisation size where explicitly supported.

Employer-wide benefits and vacancy-specific benefits remain separate. An employer page has its own completeness and publication decision.

## Taxonomy rules

Canonical taxonomies cover occupations, career areas, conservation focus, capabilities, benefits, organisation types, experience levels, contract types, working patterns, workplace types and geography.

- Store taxonomy IDs rather than AI-generated display strings.
- Support aliases and parent-child relationships.
- Preserve the source wording behind every mapping.
- AI maps only to active terms supplied in its request.
- Unmatched concepts enter a review queue; they do not become public terms automatically.
- Taxonomy and mapping policy versions are retained so historical statistics remain interpretable.

Canonical occupation mappings make later career pages possible. For example, source titles such as `Reserve Ranger` and `Countryside Ranger` can contribute to a `Park ranger` career page without losing their original titles.

## Value precedence

From highest to lowest authority:

1. staff-reviewed value;
2. verified structured value from the official source;
3. deterministic extraction from official source content;
4. evidence-supported AI classification;
5. unknown.

Lower-authority processing must never overwrite a higher-authority value.

## Source permissions

Each source configuration must state whether WildJobs may display full descriptions, summaries, logos and other supplied content. The pipeline must enforce that policy before publication.

## Automation controls and rollout

Automatic publication remains in shadow mode while this pipeline is implemented. Re-enabling it requires:

1. end-to-end database coverage of ingestion through publication;
2. repair of the description-preservation defect;
3. a representative shadow comparison reviewed by staff;
4. staged activation for one record, then one source, then general operation.
