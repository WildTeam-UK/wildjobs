"use client";

import { Button, Select, TextInput } from "@wildteam-uk/ui";
import { useState } from "react";
import { JobCard } from "@/components/job-card";
import { courseBySlug, courses } from "@/lib/courses";
import type { CandidateSaveState } from "@/lib/candidate-saved-jobs";
import { filterJobs, jobCategories } from "@/lib/job-filtering";
import type { EmploymentType, Job, LocationType } from "@/lib/jobs";

const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site", "Not specified"];
const employmentTypes: readonly EmploymentType[] = [
  "Full time",
  "Part time",
  "Flexible",
  "Permanent",
  "Fixed term",
  "Temporary",
  "Internship",
  "Apprenticeship",
  "Not stated",
];

type BrowserFilters = Readonly<{
  query: string;
  locationType: LocationType | "";
  employmentType: EmploymentType | "";
  category: string;
  courseSlug: string;
}>;

export function JobBrowser({
  candidateSaveState,
  jobs,
  initialFilters = {},
}: {
  candidateSaveState: CandidateSaveState;
  jobs: readonly Job[];
  initialFilters?: Partial<BrowserFilters>;
}) {
  const [query, setQuery] = useState(initialFilters.query ?? "");
  const [locationType, setLocationType] = useState<LocationType | "">(initialFilters.locationType ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    initialFilters.employmentType ?? "",
  );
  const [category, setCategory] = useState(initialFilters.category ?? "");
  const [courseSlug, setCourseSlug] = useState(initialFilters.courseSlug ?? "");
  const filteredJobs = filterJobs(jobs, { query, locationType, employmentType, category, courseSlug });
  const categories = jobCategories(jobs);
  const hasFilters = Boolean(query || locationType || employmentType || category || courseSlug);
  const selectedCourse = courseBySlug(courseSlug);
  const savedJobIds = new Set(candidateSaveState.savedJobIds);

  function syncUrl(filters: BrowserFilters) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.locationType) params.set("location", filters.locationType);
    if (filters.employmentType) params.set("type", filters.employmentType);
    if (filters.category) params.set("category", filters.category);
    if (filters.courseSlug) params.set("course", filters.courseSlug);
    const queryString = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${queryString ? `?${queryString}` : ""}`,
    );
  }

  function currentFilters(overrides: Partial<BrowserFilters> = {}): BrowserFilters {
    return { query, locationType, employmentType, category, courseSlug, ...overrides };
  }

  function clearFilters() {
    setQuery("");
    setLocationType("");
    setEmploymentType("");
    setCategory("");
    setCourseSlug("");
    syncUrl({ query: "", locationType: "", employmentType: "", category: "", courseSlug: "" });
  }

  return (
    <section className="job-browser" aria-labelledby="available-jobs-heading">
      <div className="shell job-browser__layout">
        <aside className="filter-panel" aria-label="Filter jobs">
          <div className="filter-panel__heading">
            <div>
              <p className="eyebrow">Refine your search</p>
              <h2>Find your fit</h2>
            </div>
            {hasFilters ? (
              <Button type="button" variant="quiet" onClick={clearFilters}>
                Clear all
              </Button>
            ) : null}
          </div>
          <TextInput
            id="job-search"
            label="Search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              syncUrl(currentFilters({ query: event.target.value }));
            }}
            placeholder="Role, organisation or skill"
          />
          <Select
            id="location-type"
            label="Location type"
            value={locationType}
            onChange={(event) => {
              const value = event.target.value as LocationType | "";
              setLocationType(value);
              syncUrl(currentFilters({ locationType: value }));
            }}
          >
            <option value="">All location types</option>
            {locationTypes.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            id="job-type"
            label="Job type"
            value={employmentType}
            onChange={(event) => {
              const value = event.target.value as EmploymentType | "";
              setEmploymentType(value);
              syncUrl(currentFilters({ employmentType: value }));
            }}
          >
            <option value="">All job types</option>
            {employmentTypes.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            id="category"
            label="Category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              syncUrl(currentFilters({ category: event.target.value }));
            }}
          >
            <option value="">All categories</option>
            {categories.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select
            id="course"
            label="Related WildTeam course"
            value={courseSlug}
            onChange={(event) => {
              setCourseSlug(event.target.value);
              syncUrl(currentFilters({ courseSlug: event.target.value }));
            }}
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option value={course.slug} key={course.slug}>
                {course.shortTitle}
              </option>
            ))}
          </Select>
        </aside>

        <div className="job-results">
          <div className="job-results__heading">
            <div>
              <p className="eyebrow">Live vacancies</p>
              <h2 id="available-jobs-heading">Available jobs</h2>
            </div>
            <p aria-live="polite">
              {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"} shown
            </p>
          </div>
          {selectedCourse ? (
            <div className="course-match-note">
              <p className="eyebrow">Course-aware discovery</p>
              <h3>Roles related to {selectedCourse.shortTitle.toLocaleLowerCase("en-GB")}</h3>
              <p>
                These matches use capabilities covered by the course. Completing a course does not
                automatically satisfy every requirement in a job listing.
              </p>
            </div>
          ) : null}
          {filteredJobs.length ? (
            <div className="job-list">
              {filteredJobs.map((job) => (
                <JobCard
                  job={job}
                  key={job.slug}
                  saveState={
                    candidateSaveState.isSignedIn && job.id && savedJobIds.has(job.id)
                      ? "saved"
                      : candidateSaveState.isSignedIn
                        ? "available"
                        : "signed-out"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No roles match those filters.</h3>
              <p>Try a broader search or clear the filters to see every current listing.</p>
              <Button type="button" variant="quiet" onClick={clearFilters}>
                Show all jobs
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
