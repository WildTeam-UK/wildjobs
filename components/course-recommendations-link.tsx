"use client";

import Link from "next/link";
import { JobActionTooltip } from "./job-action-tooltip";

// Keep the tooltip and its link in the same client boundary: a Link passed
// from a Server Component can be deferred and cannot safely be cloned there.
export function CourseRecommendationsLink() {
  return (
    <JobActionTooltip label="These courses relate to skills and responsibilities in this advert. Read how WildJobs recommends training.">
      <Link
        className="job-card__training-why job-card__training-explainer job-filter-pill--fancy"
        href="/course-recommendations/"
      >
        <span className="job-filter-pill__value icon-label">Recommended courses</span>
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16v.5" />
        </svg>
      </Link>
    </JobActionTooltip>
  );
}
