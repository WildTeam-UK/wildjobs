alter table public.courses
add column capability_taxonomy_source_hash text,
add column capability_taxonomy_policy_version text,
add column capability_taxonomy_generated_at timestamptz,
add constraint courses_capability_taxonomy_source_hash_valid check (
  capability_taxonomy_source_hash is null
  or capability_taxonomy_source_hash ~ '^[a-f0-9]{64}$'
),
add constraint courses_capability_taxonomy_policy_version_length check (
  capability_taxonomy_policy_version is null
  or char_length(capability_taxonomy_policy_version) between 1 and 80
);

alter table public.capabilities
add column provenance text not null default 'staff',
add column confidence smallint not null default 100,
add column policy_version text,
add constraint capabilities_provenance_valid check (
  provenance in ('staff', 'course_summary_ai', 'reviewed_candidate')
),
add constraint capabilities_confidence_valid check (confidence between 1 and 100),
add constraint capabilities_policy_version_length check (
  policy_version is null or char_length(policy_version) between 1 and 80
);

alter table public.course_learning_outcomes
alter column reviewed_at drop not null,
add column provenance text not null default 'staff',
add column confidence smallint not null default 100,
add column evidence_text text,
add column policy_version text,
add constraint course_learning_outcomes_provenance_valid check (
  provenance in ('staff', 'course_summary_ai')
),
add constraint course_learning_outcomes_confidence_valid check (confidence between 1 and 100),
add constraint course_learning_outcomes_evidence_length check (
  evidence_text is null or char_length(evidence_text) between 2 and 500
),
add constraint course_learning_outcomes_policy_version_length check (
  policy_version is null or char_length(policy_version) between 1 and 80
);

alter table public.course_capabilities
alter column reviewed_at drop not null,
add column provenance text not null default 'staff',
add column confidence smallint not null default 100,
add column policy_version text,
add constraint course_capabilities_provenance_valid check (
  provenance in ('staff', 'course_summary_ai')
),
add constraint course_capabilities_confidence_valid check (confidence between 1 and 100),
add constraint course_capabilities_policy_version_length check (
  policy_version is null or char_length(policy_version) between 1 and 80
);
