"use client";

import { useId, useState } from "react";
import { EmployerLogo } from "@/components/employer-logo";
import { JobCard } from "@/components/job-card";
import { JobTrainingPromo } from "@/components/job-training-promo";
import { SaveJobControl, type JobSaveState } from "@/components/save-job-control";
import { postedAgoLabel, type Job } from "@/lib/jobs";

export function JobSplitView({
  jobs,
  saveStateFor,
}: {
  jobs: readonly Job[];
  saveStateFor: (job: Job) => JobSaveState;
}) {
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const detailId = useId();
  // A changed filter or page must never leave the detail panel on an absent job.
  const selectedJob = jobs.find((job) => job.slug === selectedSlug) ?? jobs[0];

  if (!selectedJob) return null;

  return (
    <div className="job-split-view">
      <div className="job-split-view__list" role="group" aria-label="Choose a job to preview">
        {jobs.map((job) => {
          const selected = job.slug === selectedJob.slug;
          return (
            <article
              className={`job-preview-card${selected ? " job-preview-card--selected" : ""}`}
              key={job.slug}
            >
              <div className="job-preview-card__identity">
                <EmployerLogo
                  imageClassName="job-preview-card__logo"
                  logoUrl={job.employerLogoUrl}
                  monogramClassName="job-preview-card__monogram"
                  name={job.organisation}
                />
                <div>
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
              <p className="job-preview-card__salary">{job.salary}</p>
              <p className="job-preview-card__posted">{postedAgoLabel(job.publishedAt ?? job.postedAt)}</p>
              <div className="job-preview-card__save">
                <SaveJobControl
                  className="save-action save-action--icon"
                  iconOnly
                  jobId={job.id}
                  jobSlug={job.slug}
                  state={saveStateFor(job)}
                />
              </div>
            </article>
          );
        })}
      </div>
      <section className="job-detail-panel" id={detailId} aria-label="Selected job details">
        <p className="wt-visually-hidden" role="status">
          Showing {selectedJob.title} at {selectedJob.organisation}
        </p>
        <div className="job-detail-panel__content" key={selectedJob.slug}>
          <JobCard compact job={selectedJob} saveState={saveStateFor(selectedJob)} />
          {selectedJob.sourceUrl ? (
            <div className="job-detail-panel__actions">
              <a className="action" href={selectedJob.sourceUrl} rel="noopener noreferrer" target="_blank">
                View original advert <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : null}
        </div>
      </section>
      <div className="job-split-view__promotion">
        <JobTrainingPromo position={0} />
      </div>
    </div>
  );
}
