"use client";

import { Button, Select, TextInput } from "@wildteam-uk/ui";
import { useState } from "react";
import { JobCard } from "@/components/job-card";
import { courseBySlug, courses } from "@/lib/courses";
import type { CandidateSaveState } from "@/lib/candidate-saved-jobs";
import { filterJobs, jobCategories } from "@/lib/job-filtering";
import type { EmploymentType, EngagementType, Job, LocationType } from "@/lib/jobs";

const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site", "Not specified"];
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
    });
  }

  return (
    <section className="job-browser" aria-labelledby="available-jobs-heading">
      <div className="shell job-browser__layout">
        <div className="filter-panel" aria-label="Filter jobs">
          <div className="filter-panel__heading">
            <div>
              <p className="eyebrow">Refine your search</p>
              <h2>Find the right opportunity</h2>
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
          <div className="filter-panel__control">
            <label htmlFor="location-search">Location</label>
            <input
              id="location-search"
              list="job-locations"
              onChange={(event) => {
                setLocationQuery(event.target.value);
                syncUrl(currentFilters({ locationQuery: event.target.value }));
              }}
              placeholder="City, region or country"
              type="search"
              value={locationQuery}
            />
            <datalist id="job-locations">
              {locations.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <Select
            id="engagement-type"
            label="Paid or volunteer"
            value={engagementType}
            onChange={(event) => {
              const value = event.target.value as EngagementType | "";
              setEngagementType(value);
              syncUrl(currentFilters({ engagementType: value }));
            }}
          >
            <option value="">All opportunities</option>
            <option value="Paid">Paid</option>
            <option value="Volunteer">Volunteer</option>
          </Select>
          <Select
            id="location-type"
            label="Work location"
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
            id="contract-type"
            label="Contract type"
            value={contractType}
            onChange={(event) => {
              setContractType(event.target.value);
              syncUrl(currentFilters({ contractType: event.target.value }));
            }}
          >
            <option value="">All contracts</option>
            {contractTypes.map((value) => (
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
            id="minimum-salary"
            label="Minimum advertised salary"
            value={minimumSalary ? String(minimumSalary) : ""}
            onChange={(event) => {
              const value = Number(event.target.value) || 0;
              setMinimumSalary(value);
              syncUrl(currentFilters({ minimumSalary: value }));
            }}
          >
            <option value="">Any salary</option>
            <option value="20000">£20,000+</option>
            <option value="25000">£25,000+</option>
            <option value="30000">£30,000+</option>
            <option value="40000">£40,000+</option>
            <option value="50000">£50,000+</option>
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
        </div>

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
