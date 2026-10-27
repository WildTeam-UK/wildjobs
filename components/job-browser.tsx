"use client";

import { Select, TextInput } from "@wildteam-uk/ui";
import { useState } from "react";
import { JobCard } from "@/components/job-card";
import { filterJobs, jobCategories } from "@/lib/job-filtering";
import type { EmploymentType, Job, LocationType } from "@/lib/jobs";

const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site"];
const employmentTypes: readonly EmploymentType[] = ["Full time", "Part time", "Fixed term", "Internship"];

export function JobBrowser({ jobs }: { jobs: readonly Job[] }) {
  const [query, setQuery] = useState("");
  const [locationType, setLocationType] = useState<LocationType | "">("");
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [category, setCategory] = useState("");
  const filteredJobs = filterJobs(jobs, { query, locationType, employmentType, category });
  const categories = jobCategories(jobs);
  const hasFilters = Boolean(query || locationType || employmentType || category);

  function clearFilters() {
    setQuery("");
    setLocationType("");
    setEmploymentType("");
    setCategory("");
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
              <button type="button" onClick={clearFilters}>
                Clear all
              </button>
            ) : null}
          </div>
          <TextInput
            id="job-search"
            label="Search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Role, organisation or skill"
          />
          <Select
            id="location-type"
            label="Location type"
            value={locationType}
            onChange={(event) => setLocationType(event.target.value as LocationType | "")}
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
            onChange={(event) => setEmploymentType(event.target.value as EmploymentType | "")}
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
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </Select>
        </aside>

        <div className="job-results">
          <div className="job-results__heading">
            <div>
              <p className="eyebrow">Demonstration vacancies</p>
              <h2 id="available-jobs-heading">Available jobs</h2>
            </div>
            <p aria-live="polite">
              {filteredJobs.length} {filteredJobs.length === 1 ? "role" : "roles"} shown
            </p>
          </div>
          {filteredJobs.length ? (
            <div className="job-list">
              {filteredJobs.map((job) => (
                <JobCard job={job} key={job.slug} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No roles match those filters.</h3>
              <p>Try a broader search or clear the filters to see every demonstration listing.</p>
              <button type="button" onClick={clearFilters}>
                Show all jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
