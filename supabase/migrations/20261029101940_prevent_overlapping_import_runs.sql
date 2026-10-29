update public.import_runs
set status = 'failed',
    finished_at = now(),
    error_summary = 'The import did not finish and was closed before a later source check.'
where status = 'started';

create unique index import_runs_one_active_run_per_source_idx
on public.import_runs (source_id)
where status = 'started';
