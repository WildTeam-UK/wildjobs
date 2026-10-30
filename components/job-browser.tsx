"use client";

import { Button, Select, VisuallyHidden } from "@wildteam-uk/ui";
import { useState } from "react";
import { JobCard } from "@/components/job-card";
import { courseBySlug, courses } from "@/lib/courses";
import type { CandidateSaveState } from "@/lib/candidate-saved-jobs";
import { filterJobs, jobCategories } from "@/lib/job-filtering";
import type { EmploymentType, EngagementType, Job, LocationType } from "@/lib/jobs";

const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site", "Not specified"];
export type JobSortOrder = "closing" | "newest" | "relevance";
type BrowserFilters = Readonly<{
  query: string;
  locationQuery: string;
  locationType: LocationType | "";
  engagementType: EngagementType | "";
  employmentType: EmploymentType | "";
  contractType: string;
  category: string;
  courseSlug: string;
  minimumSalary: number;
  sortOrder: JobSortOrder;
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
  const [locationQuery, setLocationQuery] = useState(initialFilters.locationQuery ?? "");
  const [locationType, setLocationType] = useState<LocationType | "">(initialFilters.locationType ?? "");
  const [engagementType, setEngagementType] = useState<EngagementType | "">(
    initialFilters.engagementType ?? "",
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    initialFilters.employmentType ?? "",
  );
  const [category, setCategory] = useState(initialFilters.category ?? "");
  const [contractType, setContractType] = useState(initialFilters.contractType ?? "");
  const [courseSlug, setCourseSlug] = useState(initialFilters.courseSlug ?? "");
  const [minimumSalary, setMinimumSalary] = useState(initialFilters.minimumSalary ?? 0);
  const [sortOrder, setSortOrder] = useState<JobSortOrder>(initialFilters.sortOrder ?? "relevance");
  const filteredJobs = filterJobs(jobs, {
    category,
    contractType,
    courseSlug,
    employmentType,
    engagementType,
    locationQuery,
    locationType,
    minimumSalary,
    query,
  }).toSorted((left, right) => {
    if (sortOrder === "newest") return right.postedAt.localeCompare(left.postedAt);
    if (sortOrder === "closing") {
      if (!left.closesAt) return 1;
      if (!right.closesAt) return -1;
      return left.closesAt.localeCompare(right.closesAt);
    }
    return 0;
  });
  const categories = jobCategories(jobs);
  const contractTypes = [
    ...new Set(jobs.flatMap((job) => (job.contractType ? [job.contractType] : []))),
  ].toSorted();
  const locations = [
    ...new Set(jobs.map((job) => job.location).filter((value) => value !== "Location not stated")),
  ].toSorted();
  const hasFilters = Boolean(
    query ||
    locationQuery ||
    locationType ||
    engagementType ||
    employmentType ||
    contractType ||
    category ||
    courseSlug ||
    minimumSalary,
  );
  const selectedCourse = courseBySlug(courseSlug);
  const savedJobIds = new Set(candidateSaveState.savedJobIds);

  function syncUrl(filters: BrowserFilters) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.locationQuery) params.set("place", filters.locationQuery);
    if (filters.locationType) params.set("location", filters.locationType);
    if (filters.engagementType) params.set("opportunity", filters.engagementType);
    if (filters.employmentType) params.set("type", filters.employmentType);
    if (filters.contractType) params.set("contract", filters.contractType);
    if (filters.category) params.set("category", filters.category);
    if (filters.courseSlug) params.set("course", filters.courseSlug);
    if (filters.minimumSalary) params.set("salary", String(filters.minimumSalary));
    if (filters.sortOrder !== "relevance") params.set("sort", filters.sortOrder);
    const queryString = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${queryString ? `?${queryString}` : ""}`,
    );
  }

  function currentFilters(overrides: Partial<BrowserFilters> = {}): BrowserFilters {
    return {
      category,
      contractType,
      courseSlug,
      employmentType,
      engagementType,
      locationQuery,
      locationType,
      minimumSalary,
      query,
      sortOrder,
      ...overrides,
    };
  }

  function clearFilters() {
    setQuery("");
    setLocationQuery("");
    setLocationType("");
    setEngagementType("");
    setEmploymentType("");
    setContractType("");
    setCategory("");
    setCourseSlug("");
    setMinimumSalary(0);
    syncUrl({
      category: "",
      contractType: "",
      courseSlug: "",
      employmentType: "",
      engagementType: "",
      locationQuery: "",
      locationType: "",
      minimumSalary: 0,
      query: "",
      sortOrder,
    });
  }

  return (
    <section className="job-browser" aria-labelledby="jobs-page-heading">
      <div className="job-search-hero">
        <div className="job-search-hero__inner shell">
          <p className="eyebrow">Conservation careers</p>
          <h1 id="jobs-page-heading">Find conservation jobs</h1>

          <form
            className="job-search-strip"
            onSubmit={(event) => {
              event.preventDefault();
              syncUrl(currentFilters());
            }}
            role="search"
            aria-label="Search jobs"
          >
            <div className="job-search-field">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 5 5" />
              </svg>
              <label className="wt-visually-hidden" htmlFor="job-search">
                Role, organisation or skill
              </label>
              <input
                id="job-search"
                onChange={(event) => {
                  setQuery(event.target.value);
                  syncUrl(currentFilters({ query: event.target.value }));
                }}
                placeholder="Role, organisation or skill"
                type="search"
                value={query}
              />
            </div>
            <div className="job-search-field job-search-field--location">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <label className="wt-visually-hidden" htmlFor="location-search">
                Location
              </label>
              <input
                id="location-search"
                list="job-locations"
                onChange={(event) => {
                  setLocationQuery(event.target.value);
                  syncUrl(currentFilters({ locationQuery: event.target.value }));
                }}
                placeholder="Town, region or country"
                type="search"
                value={locationQuery}
              />
              <datalist id="job-locations">
                {locations.map((value) => (
                  <option key={value} value={value} />
                ))}
              </datalist>
            </div>
            <button className="job-search-submit" type="submit">
              Search
            </button>
          </form>

          <div className="job-filter-pills" aria-label="Filter jobs" role="group">
            <label className={`job-filter-pill${engagementType ? " job-filter-pill--active" : ""}`}>
              <VisuallyHidden>Paid or volunteer</VisuallyHidden>
              <select
                value={engagementType}
                onChange={(event) => {
                  const value = event.target.value as EngagementType | "";
                  setEngagementType(value);
                  syncUrl(currentFilters({ engagementType: value }));
                }}
              >
                <option value="">Opportunity</option>
                <option value="Paid">Paid</option>
                <option value="Volunteer">Volunteer</option>
              </select>
            </label>
            <label className={`job-filter-pill${locationType ? " job-filter-pill--active" : ""}`}>
              <VisuallyHidden>Work location</VisuallyHidden>
              <select
                value={locationType}
                onChange={(event) => {
                  const value = event.target.value as LocationType | "";
                  setLocationType(value);
                  syncUrl(currentFilters({ locationType: value }));
                }}
              >
                <option value="">Work location</option>
                {locationTypes.map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={`job-filter-pill${contractType ? " job-filter-pill--active" : ""}`}>
              <VisuallyHidden>Contract type</VisuallyHidden>
              <select
                value={contractType}
                onChange={(event) => {
                  setContractType(event.target.value);
                  syncUrl(currentFilters({ contractType: event.target.value }));
                }}
              >
                <option value="">Contract type</option>
                {contractTypes.map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={`job-filter-pill${employmentType ? " job-filter-pill--active" : ""}`}>
              <VisuallyHidden>Working hours</VisuallyHidden>
              <select
                value={employmentType}
                onChange={(event) => {
                  const value = event.target.value as EmploymentType | "";
                  setEmploymentType(value);
                  syncUrl(currentFilters({ employmentType: value }));
                }}
              >
                <option value="">Working hours</option>
                <option value="Full time">Full time</option>
                <option value="Part time">Part time</option>
                <option value="Flexible">Flexible</option>
              </select>
            </label>
            <label className={`job-filter-pill${category ? " job-filter-pill--active" : ""}`}>
              <VisuallyHidden>Category</VisuallyHidden>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  syncUrl(currentFilters({ category: event.target.value }));
                }}
              >
                <option value="">Category</option>
                {categories.map((value) => (
                  <option value={value} key={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={`job-filter-pill${minimumSalary ? " job-filter-pill--active" : ""}`}>
              <VisuallyHidden>Minimum advertised salary</VisuallyHidden>
              <select
                value={minimumSalary ? String(minimumSalary) : ""}
                onChange={(event) => {
                  const value = Number(event.target.value) || 0;
                  setMinimumSalary(value);
                  syncUrl(currentFilters({ minimumSalary: value }));
                }}
              >
                <option value="">Minimum salary</option>
                <option value="20000">£20,000+</option>
                <option value="25000">£25,000+</option>
                <option value="30000">£30,000+</option>
                <option value="40000">£40,000+</option>
                <option value="50000">£50,000+</option>
              </select>
            </label>
            <label className={`job-filter-pill${courseSlug ? " job-filter-pill--active" : ""}`}>
              <VisuallyHidden>Related WildTeam course</VisuallyHidden>
              <select
                value={courseSlug}
                onChange={(event) => {
                  setCourseSlug(event.target.value);
                  syncUrl(currentFilters({ courseSlug: event.target.value }));
                }}
              >
                <option value="">Related course</option>
                {courses.map((course) => (
                  <option value={course.slug} key={course.slug}>
                    {course.shortTitle}
                  </option>
                ))}
              </select>
            </label>
            {hasFilters ? (
              <button className="job-filter-clear" onClick={clearFilters} type="button">
                Reset all
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="job-browser__layout">
          <div className="job-results">
            <div className="job-results__heading">
              <p aria-live="polite">
                {filteredJobs.length} Currently available {filteredJobs.length === 1 ? "role" : "roles"}
              </p>
              <div className="job-sort-control">
                <Select
                  id="job-sort"
                  label={<VisuallyHidden>Sort jobs</VisuallyHidden>}
                  value={sortOrder}
                  onChange={(event) => {
                    const value = event.target.value as JobSortOrder;
                    setSortOrder(value);
                    syncUrl(currentFilters({ sortOrder: value }));
                  }}
                >
                  <option value="relevance">Recommended</option>
                  <option value="newest">Newest first</option>
                  <option value="closing">Closing soon</option>
                </Select>
              </div>
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
                    compact
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
      </div>
    </section>
  );
}
