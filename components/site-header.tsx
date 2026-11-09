"use client";

import { usePathname } from "next/navigation";
import { COURSE_EXPERIMENT_PATH } from "@/lib/course-experiment";
import { CourseExperimentHeader } from "./course-experiment-header";

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname === COURSE_EXPERIMENT_PATH) return <CourseExperimentHeader key="training" />;
  if (pathname === "/experiments/navigation/jobs")
    return <CourseExperimentHeader key="jobs-preview" site="jobs" />;
  if (pathname === "/experiments/navigation/news")
    return <CourseExperimentHeader key="news-preview" site="news" />;

  return <CourseExperimentHeader key="jobs" site="jobs" skipHref="#site-content" />;
}
