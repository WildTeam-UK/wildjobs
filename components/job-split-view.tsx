"use client";

import { Fragment, useId, useState } from "react";
import { ShareJobControl } from "@/components/share-job-control";
import { DismissJobControl } from "@/components/dismiss-job-control";
import { EmployerLogo } from "@/components/employer-logo";
import { JobCard, JobFactIcon } from "@/components/job-card";
import { JobTrainingPromo } from "@/components/job-training-promo";
import { SaveJobControl, type JobSaveState } from "@/components/save-job-control";
import { compactJobLocation, postedAgoLabel, type Job } from "@/lib/jobs";
import { formatSalaryLabel } from "@/lib/job-salary";

export function JobSplitView({
  jobs,
  onDismiss,
  saveStateFor,
}: {
  jobs: readonly Job[];
  onDismiss: (job: Job) => Promise<void>;
  saveStateFor: (job: Job) => JobSaveState;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const detailId = useId();
  // A changed filter or page must never leave the detail panel on an absent job.
  const selectedJob = jobs.find((job) => job.slug === selectedSlug) ?? jobs[0];

  if (!selectedJob) return null;

  async function dismissPreviewJob(job: Job) {
    const index = jobs.findIndex((candidate) => candidate.slug === job.slug);
    const neighbour = jobs[index + 1] ?? jobs[index - 1];
    await onDismiss(job);
    if (job.slug === selectedJob?.slug) setSelectedSlug(neighbour?.slug);
  }

  return (
    <div className="job-split-view">
      <div className="job-split-view__list" role="group" aria-label="Choose a job to preview">
        {jobs.map((job, index) => {
          const selected = job.slug === selectedJob.slug;
          return (
            <Fragment key={job.slug}>
              <div className="job-result-item" data-job-dismissal={job.id}>
                <article className={`job-preview-card${selected ? " job-preview-card--selected" : ""}`}>
                  <div className="job-preview-card__identity">
                    <EmployerLogo
                      imageClassName="job-preview-card__logo"
                      logoUrl={job.employerLogoUrl}
                      monogramClassName="job-preview-card__monogram"
                      name={job.organisation}
                    />
                    <div className="job-preview-card__identity-copy">
                      <h2 className="job-preview-card__title">
                        <button
                          aria-controls={detailId}
                          aria-label={`Preview ${job.title} at ${job.organisation}`}
                          aria-pressed={selected}
                          className="job-preview-card__select"
                          onClick={() => setSelectedSlug(job.slug)}
                          type="button"
                        >
                          {job.title}
                        </button>
                      </h2>
                      <p className="job-preview-card__organisation">{job.organisation}</p>
                    </div>
                  </div>
                  <div className="job-preview-card__facts">
                    <p className="job-preview-card__fact">
                      <JobFactIcon type="salary" />
                      <span className="wt-visually-hidden">Salary: </span>
                      <span className="icon-label">{formatSalaryLabel(job.salary)}</span>
                    </p>
                    <p className="job-preview-card__fact">
                      <JobFactIcon type="location" />
                      <span className="wt-visually-hidden">Location: </span>
                      <span className="icon-label">{compactJobLocation(job)}</span>
                    </p>
                  </div>
                  <p className="job-preview-card__posted">
                    {postedAgoLabel(job.publishedAt ?? job.postedAt)}
                  </p>
                  <div className="job-preview-card__save">
                    {job.id ? (
                      <DismissJobControl
                        onClick={() => {
                          void dismissPreviewJob(job);
                        }}
                        title={job.title}
                      />
                    ) : null}
                    <SaveJobControl
                      className="save-action save-action--icon"
                      iconOnly
                      jobId={job.id}
                      jobSlug={job.slug}
                      state={saveStateFor(job)}
                    />
                    {job.sourceUrl ? (
                      <ShareJobControl title={`${job.title} at ${job.organisation}`} url={job.sourceUrl} />
                    ) : null}
                  </div>
                </article>
              </div>
              {index === 2 ? <JobTrainingPromo compact position={3} /> : null}
            </Fragment>
          );
        })}
      </div>
      <section className="job-detail-panel" id={detailId} aria-label="Selected job details">
        <p className="wt-visually-hidden" role="status">
          Showing {selectedJob.title} at {selectedJob.organisation}
        </p>
        <div className="job-detail-panel__content" key={selectedJob.slug}>
          <JobCard
            compact
            detailPanel
            onDismiss={
              selectedJob.id
                ? () => {
                    void dismissPreviewJob(selectedJob);
                  }
                : undefined
            }
            job={selectedJob}
            saveState={saveStateFor(selectedJob)}
          />
          <div className="job-detail-panel__actions">
            {selectedJob.sourceUrl ? (
              <a className="action" href={selectedJob.sourceUrl} rel="noopener noreferrer" target="_blank">
                Apply via {selectedJob.sourceName}
              </a>
            ) : null}
            <p className="job-card__posted">
              {postedAgoLabel(selectedJob.publishedAt ?? selectedJob.postedAt)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
