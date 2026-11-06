"use client";

import { useState } from "react";
import { EmployerCard } from "@/components/employer-card";
import type { PublicEmployer } from "@/lib/public-employer-mapper";
import styles from "./employer-directory.module.css";

export function EmployerDirectory({
  employers,
  sectors,
}: {
  employers: readonly PublicEmployer[];
  sectors: readonly { slug: string; title: string }[];
}) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [hiringOnly, setHiringOnly] = useState(false);
  const nameQuery = query.trim().toLocaleLowerCase("en-GB");
  const filteredEmployers = employers.filter(
    (employer) =>
      employer.name.toLocaleLowerCase("en-GB").includes(nameQuery) &&
      (!sector || employer.sectorSlugs.includes(sector)) &&
      (!hiringOnly || employer.openRoleCount > 0),
  );
  const hiringCount = filteredEmployers.filter((employer) => employer.openRoleCount > 0).length;
  const openRoleCount = filteredEmployers.reduce((total, employer) => total + employer.openRoleCount, 0);
  const hasFilters = Boolean(nameQuery || sector || hiringOnly);

  return (
    <>
      <div className={styles.filters} role="search" aria-label="Employer directory">
        <label className={styles.field}>
          Search organisations
          <input
            type="search"
            placeholder="Search by organisation name"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </label>
        <label className={styles.field}>
          Sector
          <select value={sector} onChange={(event) => setSector(event.currentTarget.value)}>
            <option value="">All sectors</option>
            {sectors.map(({ slug, title }) => (
              <option key={slug} value={slug}>
                {title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.hiring}>
          <input
            type="checkbox"
            role="switch"
            checked={hiringOnly}
            onChange={(event) => setHiringOnly(event.currentTarget.checked)}
          />
          Only show organisations hiring
        </label>
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
              setHiringOnly(false);
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
