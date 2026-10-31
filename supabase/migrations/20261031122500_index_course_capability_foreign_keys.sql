create index capability_candidates_resolved_capability_id_idx
on public.capability_candidates (resolved_capability_id)
where resolved_capability_id is not null;

create index capability_candidates_source_record_id_idx
on public.capability_candidates (source_record_id)
where source_record_id is not null;

create index course_capabilities_outcome_id_idx
on public.course_capabilities (outcome_id)
where outcome_id is not null;

create index job_capabilities_source_record_id_idx
on public.job_capabilities (source_record_id)
where source_record_id is not null;
