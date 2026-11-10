import { afterEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Job } from "../lib/jobs";
vi.mock("../components/save-job-control", () => ({ SaveJobControl: () => null }));
import { JobCard } from "../components/job-card";

afterEach(() => vi.useRealTimers());

it("keeps job age and status markup stable when hydration crosses a minute boundary", () => {
  vi.useFakeTimers();
  const job: Job = {
    slug: "ranger",
    title: "Ranger",
    organisation: "Nature Trust",
    summary: "Restore habitats",
    location: "Exeter",
    locationType: "On-site",
    employmentType: "Full time",
    salary: "Not stated",
    category: "Wildlife Conservation",
    sourceName: "Nature Trust careers",
    relatedCourseSlugs: [],
    postedAt: "2026-11-10T11:00:01Z",
    observedAt: "2026-11-10T11:00:59.990Z",
  };
  const render = () =>
    renderToStaticMarkup(createElement(JobCard, { job, compact: true, showSaveAction: false }));
  vi.setSystemTime(new Date(job.observedAt!));
  const server = render();
  vi.setSystemTime(new Date("2026-11-10T11:01:02Z"));
  const browser = render();
  expect(server).toContain("Posted just now");
  expect(browser).toBe(server);
});
