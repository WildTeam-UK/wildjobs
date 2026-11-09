"use client";

import { useRef, useState } from "react";
import { EmployerCard } from "@/components/employer-card";
import { FilterDropdown, JobSearchField } from "@/components/job-search-controls";
import type { PublicEmployer } from "@/lib/public-employer-mapper";
import styles from "./employer-directory.module.css";

export function EmployerDirectory({
  countries,
  employers,
  sectors,
}: {
  countries: readonly { value: string; label: string }[];
  employers: readonly PublicEmployer[];
  sectors: readonly { slug: string; title: string }[];
}) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [hiringOnly, setHiringOnly] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const nameQuery = query.trim().toLocaleLowerCase("en-GB");
  const filteredEmployers = employers.filter(
    (employer) =>
      employer.name.toLocaleLowerCase("en-GB").includes(nameQuery) &&
      (!sector || employer.sectorSlugs.includes(sector)) &&
      (!country || employer.countryCodes.includes(country)) &&
      (!hiringOnly || employer.openRoleCount > 0),
  );
  const hiringCount = filteredEmployers.filter((employer) => employer.openRoleCount > 0).length;
  const openRoleCount = filteredEmployers.reduce((total, employer) => total + employer.openRoleCount, 0);
  const hasFilters = Boolean(nameQuery || sector || country || hiringOnly);

  return (
    <>
      <div className={styles.filters}>
        <div
          className={`${styles.search} job-search-strip job-search-strip--single`}
          role="search"
          aria-label="Employer directory"
        >
          <JobSearchField
            id="employer-search"
            inputRef={searchRef}
            label="Search organisations"
            onChange={setQuery}
            placeholder="Search by organisation name"
            value={query}
          />
        </div>
        <div
          className={`${styles.pills} job-filter-pills--compact`}
          role="group"
          aria-label="Employer filters"
        >
          <FilterDropdown
            accessibleLabel="Sector"
            clearLabel="All sectors"
            icon="leaf"
            onChange={setSector}
            options={sectors.map(({ slug, title }) => ({ value: slug, label: title }))}
            placeholder="Sector"
            showSectorIcons
            value={sector}
          />
          {countries.length ? (
            <FilterDropdown
              accessibleLabel="Country"
              clearLabel="All countries"
              icon="country"
              onChange={setCountry}
              options={countries}
              placeholder="Country"
              value={country}
            />
          ) : null}
          <div className={`job-filter-pill${hiringOnly ? " job-filter-pill--active" : ""}`}>
            <button
              aria-checked={hiringOnly}
              className="job-filter-pill__trigger"
              onClick={() => setHiringOnly((current) => !current)}
              role="switch"
              type="button"
            >
              <span aria-hidden="true" className={styles.switchTrack} />
              <span className="icon-label">Only show organisations hiring</span>
            </button>
          </div>
        </div>
      </div>
      <div className={styles.resultsBar}>
        <p role="status">
          {filteredEmployers.length} {filteredEmployers.length === 1 ? "organisation" : "organisations"} ·{" "}
          {hiringCount} currently hiring · {openRoleCount} live {openRoleCount === 1 ? "role" : "roles"}
        </p>
        {hasFilters ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setQuery("");
              setSector("");
              setCountry("");
              setHiringOnly(false);
              searchRef.current?.focus();
            }}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {filteredEmployers.length ? (
        <div className="employer-grid">
          {filteredEmployers.map((employer) => (
            <EmployerCard key={employer.name} employer={employer} />
          ))}
        </div>
      ) : (
        <div className="staff-empty-state">
          <h2>No organisations match</h2>
          <p>Try a different search or clear your filters.</p>
        </div>
      )}
    </>
  );
}
