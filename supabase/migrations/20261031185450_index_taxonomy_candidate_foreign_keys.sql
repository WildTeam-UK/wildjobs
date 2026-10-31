create index taxonomy_candidates_job_id_idx
on public.taxonomy_candidates (job_id);

create index taxonomy_candidates_resolved_benefit_id_idx
on public.taxonomy_candidates (resolved_benefit_id)
where resolved_benefit_id is not null;

create index taxonomy_candidates_resolved_occupation_id_idx
on public.taxonomy_candidates (resolved_occupation_id)
where resolved_occupation_id is not null;
