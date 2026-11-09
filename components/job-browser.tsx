"use client";

import { Button } from "@wildteam-uk/ui";
import { flushSync } from "react-dom";
import { FilterDropdown, JobSearchField } from "./job-search-controls";
import { minimumGbpSalary } from "@/lib/job-salary";
import { careerRoleLabels, isCareerRoleSlug } from "@/lib/career-role-catalog";
import { directoryDeadline } from "@/lib/directory-lifecycle";
import {
  Fragment,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { animateJobDismissal } from "@/lib/animate-job-dismissal";
import {
  restoreAllBrowserDismissedJobs,
  setBrowserJobDismissed,
  useBrowserDismissedJobs,
} from "@/lib/browser-dismissed-jobs";
import { JobCard } from "@/components/job-card";
import { JobSplitView } from "@/components/job-split-view";
import { JobTrainingPromo } from "@/components/job-training-promo";
import { courseBySlug, type Course } from "@/lib/courses";
import type { CandidateSaveState } from "@/lib/candidate-saved-jobs";
import {
  countryName,
  filterJobs,
  jobCategories,
  jobCountries,
  normaliseCountryCode,
  rankCourseFilters,
} from "@/lib/job-filtering";
import type { EmploymentType, EngagementType, Job, LocationType } from "@/lib/jobs";

const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site"];
const jobsPerPage = 25;
const desktopLayoutQuery = "(min-width: 901px)";

function subscribeToDesktopLayout(onChange: () => void) {
  const media = window.matchMedia(desktopLayoutQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getDesktopLayoutSnapshot() {
  return window.matchMedia(desktopLayoutQuery).matches;
}

function getServerLayoutSnapshot() {
  return false;
}

export type JobSortOrder = "closing" | "newest" | "relevance";
type LocationSuggestion = Readonly<{ detail?: string; label: string; value: string }>;
type BrowserFilters = Readonly<{
  roleSlug: string;
  query: string;
  locationQuery: string;
  countryCode: string;
  locationType: LocationType | "";
  engagementType: EngagementType | "";
  employmentType: EmploymentType | "";
  contractType: string;
  category: string;
  courseSlugs: readonly string[];
  minimumSalary: number;
  sortOrder: JobSortOrder;
}>;

function titleCaseCourseName(title: string) {
  return title.replace(
    /(^|[\s-])(\p{L})/gu,
    (_match, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase("en-GB")}`,
  );
}

function courseMatchHeading(courses: readonly Course[]) {
  const [firstCourse, secondCourse] = courses
    .slice(0, 2)
    .map((course) => titleCaseCourseName(course.shortTitle));

  if (courses.length === 1) {
    return `Roles related to ${firstCourse} for wildlife conservation`;
  }

  if (courses.length === 2) {
    return `Roles related to ${firstCourse} and ${secondCourse} for wildlife conservation`;
  }

  const remainingCourseCount = courses.length - 2;
  return `Roles related to ${firstCourse}, ${secondCourse} and ${remainingCourseCount} other WildTeam ${remainingCourseCount === 1 ? "course" : "courses"}`;
}

function buildLocationSuggestions(jobs: readonly Job[]) {
  const suggestions = new Map<string, LocationSuggestion>();
  const countryCodes = new Set<string>();

  function addSuggestion(label: string | undefined, detail?: string) {
    const value = label?.trim();
    if (!value || value === "Location not stated") return;
    const key = value.toLocaleLowerCase("en-GB");
    if (!suggestions.has(key)) suggestions.set(key, { detail, label: value, value });
  }

  for (const job of jobs) {
    const countryCode = job.countryCode?.toUpperCase();
    if (countryCode) countryCodes.add(countryCode);

    if (job.locationType === "Remote") addSuggestion("Remote");
    addSuggestion(
      job.locationLocality,
      [job.locationRegion, countryCode].filter(Boolean).join(", ") || undefined,
    );
    addSuggestion(job.locationRegion, countryCode);

    if (!job.locationLocality && !job.locationRegion) {
      const [label, ...context] = job.location.split(",").map((part) => part.trim());
      addSuggestion(label, context.join(", ") || countryCode);
    }
  }

  for (const countryCode of countryCodes) addSuggestion(countryName(countryCode), "Country");

  return [...suggestions.values()].toSorted((left, right) => left.label.localeCompare(right.label));
}

function LocationAutocomplete({
  onChange,
  suggestions,
  value,
}: {
  onChange: (value: string) => void;
  suggestions: readonly LocationSuggestion[];
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const query = value.trim().toLocaleLowerCase("en-GB");
  const visibleSuggestions = query
    ? suggestions
        .filter((suggestion) =>
          `${suggestion.label} ${suggestion.detail ?? ""}`.toLocaleLowerCase("en-GB").includes(query),
        )
        .slice(0, 8)
    : [];
  const showMenu = isOpen && Boolean(query);

  function selectSuggestion(suggestion: LocationSuggestion) {
    onChange(suggestion.value);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div
      className="job-location-autocomplete"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <input
        aria-activedescendant={
          showMenu && visibleSuggestions[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showMenu}
        autoComplete="off"
        id="location-search"
        onChange={(event) => {
          onChange(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(Boolean(query))}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && visibleSuggestions.length) {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) => Math.min(index + 1, visibleSuggestions.length - 1));
          } else if (event.key === "ArrowUp" && visibleSuggestions.length) {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === "Enter" && showMenu && visibleSuggestions[activeIndex]) {
            event.preventDefault();
            selectSuggestion(visibleSuggestions[activeIndex]);
          } else if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        placeholder="Town, region or country"
        ref={inputRef}
        role="combobox"
        type="search"
        value={value}
      />
      {showMenu ? (
        <div className="job-location-menu" id={listboxId} role="listbox">
          {visibleSuggestions.length ? (
            visibleSuggestions.map((suggestion, index) => (
              <button
                aria-selected={index === activeIndex}
                className="job-location-menu__option"
                id={`${listboxId}-option-${index}`}
                key={`${suggestion.label}-${suggestion.detail ?? ""}`}
                onClick={() => selectSuggestion(suggestion)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                <span>{suggestion.label}</span>
                {suggestion.detail ? <small>{suggestion.detail}</small> : null}
              </button>
            ))
          ) : (
            <p className="job-location-menu__empty" role="status">
              No live-job destinations match “{value.trim()}”
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function JobBrowser({
  afterListings,
  candidateSaveState,
  courses,
  initialPage = 1,
  jobs,
  initialFilters = {},
}: {
  candidateSaveState: CandidateSaveState;
  courses: readonly Course[];
  afterListings?: ReactNode;
  initialPage?: number;
  jobs: readonly Job[];
  initialFilters?: Partial<BrowserFilters>;
}) {
  const [query, setQuery] = useState(initialFilters.query ?? "");
  const [locationQuery, setLocationQuery] = useState(initialFilters.locationQuery ?? "");
  const [countryCode, setCountryCode] = useState(normaliseCountryCode(initialFilters.countryCode ?? ""));
  const [locationType, setLocationType] = useState<LocationType | "">(initialFilters.locationType ?? "");
  const [engagementType, setEngagementType] = useState<EngagementType | "">(
    initialFilters.engagementType ?? "",
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">(
    initialFilters.employmentType ?? "",
  );
  const [category, setCategory] = useState(initialFilters.category ?? "");
  const [roleSlug, setRoleSlug] = useState(initialFilters.roleSlug ?? "");
  const [contractType, setContractType] = useState(initialFilters.contractType ?? "");
  const [courseSlugs, setCourseSlugs] = useState<readonly string[]>(() => {
    const availableCourseSlugs = new Set(courses.map((course) => course.slug));
    return (initialFilters.courseSlugs ?? []).filter((slug) => availableCourseSlugs.has(slug));
  });
  const [minimumSalary, setMinimumSalary] = useState(initialFilters.minimumSalary ?? 0);
  const [sortOrder, setSortOrder] = useState<JobSortOrder>(initialFilters.sortOrder ?? "relevance");
  const [currentPage, setCurrentPage] = useState(initialPage);
  const { ids: dismissedIds, persistent: dismissalsPersistent } = useBrowserDismissedJobs();
  const [lastDismissal, setLastDismissal] = useState<Job>();
  const pendingDismissals = useRef(new Set<number>());
  const resultsRef = useRef<HTMLDivElement>(null);
  const dismissedToggleRef = useRef<HTMLButtonElement>(null);
  const dismissedIdSet = new Set(dismissedIds);
  const dismissedCount = jobs.filter((job) => job.id && dismissedIdSet.has(job.id)).length;
  const visibleJobs = jobs.filter((job) => !job.id || !dismissedIdSet.has(job.id));
  const [layout, setLayout] = useState<"list" | "grid">("grid");
  const canUseGridLayout = useSyncExternalStore(
    subscribeToDesktopLayout,
    getDesktopLayoutSnapshot,
    getServerLayoutSnapshot,
  );
  const filterBarRef = useRef<HTMLDivElement>(null);
  const filterPillsRef = useRef<HTMLDivElement>(null);
  const filterValues = {
    countryCode,
    roleSlug,
    category,
    contractType,
    courseSlugs,
    employmentType,
    engagementType,
    locationQuery,
    locationType,
    minimumSalary,
    query,
  };
  const filteredJobs = filterJobs(visibleJobs, filterValues).toSorted((left, right) => {
    if (sortOrder === "newest") return right.postedAt.localeCompare(left.postedAt);
    if (sortOrder === "closing") {
      return (
        new Date(directoryDeadline(left.postedAt, left.closesAt)).valueOf() -
        new Date(directoryDeadline(right.postedAt, right.closesAt)).valueOf()
      );
    }
    return 0;
  });
  const filteredOrganisationCount = new Set(filteredJobs.map((job) => job.organisation)).size;
  const categories = jobCategories(jobs);
  const countries = jobCountries(jobs);
  const countryContext = filterJobs(visibleJobs, { ...filterValues, countryCode: "" });
  const workplaceContext = filterJobs(visibleJobs, { ...filterValues, locationType: "" });
  const hoursContext = filterJobs(visibleJobs, { ...filterValues, employmentType: "" });
  const contractContext = filterJobs(visibleJobs, { ...filterValues, contractType: "" });
  const salaryContext = filterJobs(visibleJobs, { ...filterValues, minimumSalary: 0 });
  const sectorContext = filterJobs(visibleJobs, { ...filterValues, category: "" });
  const opportunityContext = filterJobs(visibleJobs, { ...filterValues, engagementType: "" });
  const orderedCourses = rankCourseFilters(
    courses,
    filterJobs(visibleJobs, { ...filterValues, courseSlugs: [] }),
  );
  const contractTypes = [
    ...new Set(jobs.flatMap((job) => (job.contractType ? [job.contractType] : []))),
  ].toSorted();
  const locationSuggestions = useMemo(() => buildLocationSuggestions(jobs), [jobs]);
  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / jobsPerPage));
  const activePage = Math.min(currentPage, pageCount);
  const pageStart = (activePage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(pageStart, pageStart + jobsPerPage);
  const hasFilters = Boolean(
    roleSlug ||
    query ||
    locationQuery ||
    countryCode ||
    locationType ||
    engagementType ||
    employmentType ||
    contractType ||
    category ||
    courseSlugs.length ||
    minimumSalary,
  );
  const selectedCourses = courseSlugs.flatMap((slug) => {
    const course = courseBySlug(courses, slug);
    return course ? [course] : [];
  });
  const savedJobIds = new Set(candidateSaveState.savedJobIds);

  useEffect(() => {
    const filterPills = filterPillsRef.current;
    if (!filterPills) return;

    let animationFrame = 0;
    const updateFilterOverflow = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const hasOverflow = filterPills.scrollWidth > filterPills.clientWidth + 1;
        const canScrollLeft = hasOverflow && filterPills.scrollLeft > 1;
        const canScrollRight =
          hasOverflow && filterPills.scrollLeft + filterPills.clientWidth < filterPills.scrollWidth - 1;

        filterPills.classList.toggle("job-filter-pills--overflow-left", canScrollLeft);
        filterPills.classList.toggle("job-filter-pills--overflow-right", canScrollRight);
      });
    };

    const resizeObserver = new ResizeObserver(updateFilterOverflow);
    const mutationObserver = new MutationObserver(updateFilterOverflow);
    resizeObserver.observe(filterPills);
    mutationObserver.observe(filterPills, { childList: true, characterData: true, subtree: true });
    filterPills.addEventListener("scroll", updateFilterOverflow, { passive: true });
    updateFilterOverflow();

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      filterPills.removeEventListener("scroll", updateFilterOverflow);
    };
  }, []);

  useEffect(() => {
    function restorePageFromHistory() {
      const params = new URLSearchParams(window.location.search);
      const page = Number(params.get("page"));
      setCurrentPage(Number.isInteger(page) && page > 0 ? page : 1);
      setCountryCode(normaliseCountryCode(params.get("country") ?? ""));
    }

    window.addEventListener("popstate", restorePageFromHistory);
    return () => window.removeEventListener("popstate", restorePageFromHistory);
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    const updateFilterBarState = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const filterBar = filterBarRef.current;
        if (!filterBar) return;

        const headerHeight = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--site-header-height"),
        );
        const isStuck = window.scrollY > 0 && filterBar.getBoundingClientRect().top <= headerHeight + 0.5;
        filterBar.classList.toggle("job-filter-bar--stuck", isStuck);
      });
    };

    updateFilterBarState();
    window.addEventListener("resize", updateFilterBarState);
    window.addEventListener("scroll", updateFilterBarState, { passive: true });
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateFilterBarState);
      window.removeEventListener("scroll", updateFilterBarState);
    };
  }, []);

  function syncUrl(filters: BrowserFilters, page = 1, addHistoryEntry = false) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.locationQuery) params.set("place", filters.locationQuery);
    if (filters.countryCode) params.set("country", filters.countryCode);
    if (filters.locationType) params.set("location", filters.locationType);
    if (filters.engagementType) params.set("opportunity", filters.engagementType);
    if (filters.employmentType) params.set("type", filters.employmentType);
    if (filters.contractType) params.set("contract", filters.contractType);
    if (filters.category) params.set("sector", filters.category);
    if (filters.roleSlug) params.set("role", filters.roleSlug);
    filters.courseSlugs.forEach((slug) => params.append("course", slug));
    if (filters.minimumSalary) params.set("salary", String(filters.minimumSalary));
    if (filters.sortOrder !== "relevance") params.set("sort", filters.sortOrder);
    if (page > 1) params.set("page", String(page));
    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}`;
    setCurrentPage(page);
    if (addHistoryEntry) window.history.pushState(null, "", nextUrl);
    else window.history.replaceState(null, "", nextUrl);
  }

  function changePage(page: number) {
    syncUrl(currentFilters(), page, true);
    document.querySelector<HTMLElement>(".job-results")?.scrollIntoView({ behavior: "smooth" });
  }

  function currentFilters(overrides: Partial<BrowserFilters> = {}): BrowserFilters {
    return {
      countryCode,
      roleSlug,
      category,
      contractType,
      courseSlugs,
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

  async function toggleJobDismissal(job: Job) {
    if (!job.id || pendingDismissals.current.has(job.id)) return;
    pendingDismissals.current.add(job.id);
    const row = resultsRef.current?.querySelector<HTMLElement>(`[data-job-dismissal="${job.id}"]`) ?? null;
    const rows = Array.from(resultsRef.current?.querySelectorAll<HTMLElement>("[data-job-dismissal]") ?? []);
    const rowIndex = row ? rows.indexOf(row) : -1;
    const neighbourId = (rows[rowIndex + 1] ?? rows[rowIndex - 1])?.dataset.jobDismissal;
    const focused = document.activeElement;
    const shouldMoveFocus = Boolean(row?.contains(focused) || focused?.closest(".job-detail-panel"));
    try {
      await animateJobDismissal(row, () =>
        flushSync(() => {
          setBrowserJobDismissed(job.id!, true);
          setLastDismissal(job);
        }),
      );
      requestAnimationFrame(() => {
        if (!shouldMoveFocus) return;
        const neighbour = neighbourId
          ? resultsRef.current?.querySelector<HTMLElement>(`[data-job-dismissal="${neighbourId}"]`)
          : null;
        const target = neighbour?.querySelector<HTMLElement>("h2 button, h2 a") ?? dismissedToggleRef.current;
        target?.focus({ preventScroll: true });
      });
    } finally {
      pendingDismissals.current.delete(job.id);
    }
  }

  function undoDismissal() {
    if (!lastDismissal?.id) return;
    setBrowserJobDismissed(lastDismissal.id, false);
    setLastDismissal(undefined);
    requestAnimationFrame(() => {
      const restored = resultsRef.current?.querySelector<HTMLElement>(
        `[data-job-dismissal="${lastDismissal.id}"] h2 button, [data-job-dismissal="${lastDismissal.id}"] h2 a`,
      );
      (restored ?? dismissedToggleRef.current)?.focus({ preventScroll: true });
    });
  }

  function clearFilters() {
    setRoleSlug("");
    setQuery("");
    setLocationQuery("");
    setCountryCode("");
    setLocationType("");
    setEngagementType("");
    setEmploymentType("");
    setContractType("");
    setCategory("");
    setCourseSlugs([]);
    setMinimumSalary(0);
    syncUrl({
      countryCode: "",
      roleSlug: "",
      category: "",
      contractType: "",
      courseSlugs: [],
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
      <div className="job-search-hero-art job-search-hero-art--plain" aria-hidden="true" />
      <div className="job-search-hero">
        <div className="job-search-hero__inner shell">
          <div className="job-search-hero__intro">
            <div className="job-search-hero__intro-content">
              <h1 id="jobs-page-heading">Find your dream conservation job</h1>
              <p className="job-search-hero__description">
                Discover your next <strong className="job-search-hero__highlight">meaningful career</strong>{" "}
                protecting wildlife, restoring nature and creating a better future for our{" "}
                <span aria-label="planet Earth" className="job-search-hero__emoji" role="img">
                  🌍
                </span>
                {"."}
              </p>
            </div>
          </div>

          <form
            className="job-search-strip"
            onSubmit={(event) => {
              event.preventDefault();
              syncUrl(currentFilters());
            }}
            role="search"
            aria-label="Search jobs"
          >
            <JobSearchField
              id="job-search"
              label="Role, organisation or skill"
              onChange={(value) => {
                setQuery(value);
                syncUrl(currentFilters({ query: value }));
              }}
              value={query}
            />
            <div className="job-search-field job-search-field--location">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <label className="wt-visually-hidden" htmlFor="location-search">
                Location
              </label>
              <LocationAutocomplete
                onChange={(value) => {
                  setLocationQuery(value);
                  syncUrl(currentFilters({ locationQuery: value }));
                }}
                suggestions={locationSuggestions}
                value={locationQuery}
              />
            </div>
            <button className="job-search-submit" type="submit">
              SEARCH
            </button>
          </form>
        </div>
      </div>

      <div className="job-filter-bar" ref={filterBarRef}>
        <div className="job-filter-bar__inner shell">
          <div
            className="job-filter-pills"
            aria-label="Filter and sort jobs"
            ref={filterPillsRef}
            role="group"
          >
            {courses.length ? (
              <FilterDropdown
                accessibleLabel="Related WildTeam courses"
                className="job-filter-pill--fancy"
                clearLabel="Clear selected courses"
                icon="brand"
                multiple
                onChange={(values) => {
                  setCourseSlugs(values);
                  syncUrl(currentFilters({ courseSlugs: values }));
                }}
                options={orderedCourses.map((course) => ({
                  label: course.shortTitle,
                  value: course.slug,
                  count: course.count,
                }))}
                placeholder="Related courses"
                value={courseSlugs}
              />
            ) : null}
            <FilterDropdown
              accessibleLabel="Role category"
              clearLabel="Any role category"
              icon="leaf"
              onChange={(value) => {
                setCategory(value);
                syncUrl(currentFilters({ category: value }));
              }}
              options={categories.map((value) => ({
                label: value,
                value,
                count: sectorContext.filter(
                  (job) => job.category === value || job.careerAreas?.includes(value),
                ).length,
              }))}
              placeholder="Role category"
              showSectorIcons
              value={category}
            />
            <FilterDropdown
              accessibleLabel="Sort jobs"
              className="job-filter-pill--compact-only job-filter-pill--icon-only"
              clearLabel="Recommended"
              icon="sort"
              onChange={(value) => {
                const nextValue = (value || "relevance") as JobSortOrder;
                setSortOrder(nextValue);
                syncUrl(currentFilters({ sortOrder: nextValue }));
              }}
              options={[
                { label: "Newest first", value: "newest" },
                { label: "Closing soon", value: "closing" },
              ]}
              placeholder="Recommended"
              value={sortOrder === "relevance" ? "" : sortOrder}
            />
            <FilterDropdown
              accessibleLabel="Paid or volunteer"
              clearLabel="All opportunities"
              icon="opportunity"
              onChange={(value) => {
                const nextValue = value as EngagementType | "";
                setEngagementType(nextValue);
                syncUrl(currentFilters({ engagementType: nextValue }));
              }}
              options={[
                {
                  label: "Paid",
                  value: "Paid",
                  count: opportunityContext.filter((job) => job.engagementType === "Paid").length,
                },
                {
                  label: "Volunteer",
                  value: "Volunteer",
                  count: opportunityContext.filter((job) => job.engagementType === "Volunteer").length,
                },
              ]}
              placeholder="Opportunity"
              value={engagementType}
            />
            <FilterDropdown
              accessibleLabel="Country"
              clearLabel="All countries"
              icon="country"
              onChange={(value) => {
                setCountryCode(value);
                syncUrl(currentFilters({ countryCode: value }));
              }}
              options={countries.map((country) => ({
                ...country,
                count: countryContext.filter(
                  (job) => normaliseCountryCode(job.countryCode ?? "") === country.value,
                ).length,
              }))}
              placeholder="Country"
              value={countryCode}
            />
            <FilterDropdown
              accessibleLabel="Work location"
              clearLabel="Any work location"
              icon="location"
              onChange={(value) => {
                const nextValue = value as LocationType | "";
                setLocationType(nextValue);
                syncUrl(currentFilters({ locationType: nextValue }));
              }}
              options={locationTypes.map((value) => ({
                label: value,
                value,
                count: workplaceContext.filter((job) => job.locationType === value).length,
              }))}
              placeholder="Work location"
              value={locationType}
            />
            <FilterDropdown
              accessibleLabel="Contract type"
              clearLabel="Any contract type"
              icon="briefcase"
              onChange={(value) => {
                setContractType(value);
                syncUrl(currentFilters({ contractType: value }));
              }}
              options={contractTypes.map((value) => ({
                label: value,
                value,
                count: contractContext.filter((job) => job.contractType === value).length,
              }))}
              placeholder="Contract type"
              value={contractType}
            />
            <FilterDropdown
              accessibleLabel="Working hours"
              clearLabel="Any working hours"
              icon="clock"
              onChange={(value) => {
                const nextValue = value as EmploymentType | "";
                setEmploymentType(nextValue);
                syncUrl(currentFilters({ employmentType: nextValue }));
              }}
              options={[
                {
                  label: "Full time",
                  value: "Full time",
                  count: hoursContext.filter((job) =>
                    [job.employmentType, job.hoursType, ...(job.hoursTypes ?? [])].includes("Full time"),
                  ).length,
                },
                {
                  label: "Part time",
                  value: "Part time",
                  count: hoursContext.filter((job) =>
                    [job.employmentType, job.hoursType, ...(job.hoursTypes ?? [])].includes("Part time"),
                  ).length,
                },
              ]}
              placeholder="Working hours"
              value={employmentType}
            />
            <FilterDropdown
              accessibleLabel="Minimum annual salary in GBP"
              clearLabel="Any salary"
              icon="salary"
              onChange={(value) => {
                const nextValue = Number(value) || 0;
                setMinimumSalary(nextValue);
                syncUrl(currentFilters({ minimumSalary: nextValue }));
              }}
              options={[
                {
                  label: "£20,000+",
                  value: "20000",
                  count: salaryContext.filter((job) => (minimumGbpSalary(job) ?? 0) >= 20000).length,
                },
                {
                  label: "£25,000+",
                  value: "25000",
                  count: salaryContext.filter((job) => (minimumGbpSalary(job) ?? 0) >= 25000).length,
                },
                {
                  label: "£30,000+",
                  value: "30000",
                  count: salaryContext.filter((job) => (minimumGbpSalary(job) ?? 0) >= 30000).length,
                },
                {
                  label: "£40,000+",
                  value: "40000",
                  count: salaryContext.filter((job) => (minimumGbpSalary(job) ?? 0) >= 40000).length,
                },
                {
                  label: "£50,000+",
                  value: "50000",
                  count: salaryContext.filter((job) => (minimumGbpSalary(job) ?? 0) >= 50000).length,
                },
              ]}
              placeholder="Minimum salary"
              value={minimumSalary ? String(minimumSalary) : ""}
            />
            {hasFilters ? (
              <button className="job-filter-clear" onClick={clearFilters} type="button">
                Reset all
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="job-search-hero__tail" aria-hidden="true" />

      <div className="shell">
        <div className="job-browser__layout">
          <div className="job-results" ref={resultsRef}>
            {roleSlug ? (
              <p className="course-match-note">
                Career role: {isCareerRoleSlug(roleSlug) ? careerRoleLabels[roleSlug] : roleSlug}{" "}
                <button
                  className="job-filter-clear"
                  type="button"
                  onClick={() => {
                    setRoleSlug("");
                    syncUrl(currentFilters({ roleSlug: "" }));
                  }}
                >
                  Clear career role
                </button>
              </p>
            ) : null}
            <div className="job-results__heading">
              <p aria-live="polite">
                {filteredJobs.length} Currently available {filteredJobs.length === 1 ? "role" : "roles"}
                <span className="job-results__organisation-count">
                  {" "}
                  across {filteredOrganisationCount}{" "}
                  {filteredOrganisationCount === 1 ? "organisation" : "organisations"}
                </span>
              </p>
              <div className="job-results__controls">
                {dismissedCount ? (
                  <button
                    className="job-dismissed-toggle"
                    ref={dismissedToggleRef}
                    type="button"
                    onClick={() => {
                      restoreAllBrowserDismissedJobs();
                      setLastDismissal(undefined);
                      syncUrl(currentFilters(), activePage);
                      requestAnimationFrame(() =>
                        resultsRef.current
                          ?.querySelector<HTMLElement>(
                            "[data-job-dismissal] h2 button, [data-job-dismissal] h2 a",
                          )
                          ?.focus({ preventScroll: true }),
                      );
                    }}
                  >
                    Show hidden jobs ({dismissedCount})
                  </button>
                ) : null}
                <div className="job-layout-switch" role="group" aria-label="Job card layout">
                  <button
                    aria-label="List layout"
                    aria-pressed={layout === "list"}
                    onClick={() => setLayout("list")}
                    title="List layout"
                    type="button"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="6" rx="1.5" />
                      <rect x="3" y="14" width="18" height="6" rx="1.5" />
                      <path d="M8 4v6M8 14v6" />
                    </svg>
                  </button>
                  <button
                    aria-label="Grid layout"
                    aria-pressed={layout === "grid"}
                    onClick={() => setLayout("grid")}
                    title="Grid layout"
                    type="button"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="7" height="6" rx="1.5" />
                      <rect x="3" y="14" width="7" height="6" rx="1.5" />
                      <rect x="14" y="4" width="7" height="16" rx="1.5" />
                    </svg>
                  </button>
                </div>
                <div className="job-sort-control job-sort-control--results">
                  <FilterDropdown
                    accessibleLabel="Sort jobs"
                    className="job-sort-dropdown"
                    clearLabel="Recommended"
                    icon="sort"
                    onChange={(value) => {
                      const nextValue = (value || "relevance") as JobSortOrder;
                      setSortOrder(nextValue);
                      syncUrl(currentFilters({ sortOrder: nextValue }));
                    }}
                    options={[
                      { label: "Newest first", value: "newest" },
                      { label: "Closing soon", value: "closing" },
                    ]}
                    placeholder="Recommended"
                    value={sortOrder === "relevance" ? "" : sortOrder}
                  />
                </div>
              </div>
            </div>
            {!dismissalsPersistent ? (
              <p className="job-dismissed-note">
                Browser storage is unavailable. Dismissed jobs are remembered for this visit only.
              </p>
            ) : null}
            <div className="job-dismissal-feedback" role="status" aria-live="polite" aria-atomic="true">
              {lastDismissal ? (
                <div className="job-dismissal-feedback__content">
                  <p>
                    <strong>Job hidden</strong>
                    <span>{lastDismissal.title}</span>
                  </p>
                  <button type="button" onClick={undoDismissal}>
                    Undo
                  </button>
                  <button
                    className="job-dismissal-feedback__close"
                    aria-label="Close job notification"
                    type="button"
                    onClick={() => {
                      setLastDismissal(undefined);
                      dismissedToggleRef.current?.focus({ preventScroll: true });
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </div>
            {selectedCourses.length ? (
              <div className="course-match-note">
                <p className="eyebrow">Course-aware discovery</p>
                <h3>{courseMatchHeading(selectedCourses)}</h3>
                <p className="course-match-note__description">
                  A little smart matching goes a long way. We connect the skills taught in your WildTeam
                  courses with the skills employers are looking for, helping you discover jobs where your
                  training could give you a head start.
                </p>
                <p className="course-match-note__training">
                  Haven&apos;t taken a WildTeam course yet?{" "}
                  <a
                    href="https://training.wildteam.org.uk/courses"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore our training courses
                  </a>{" "}
                  and discover how you could build the skills to take your conservation career further.
                </p>
              </div>
            ) : null}
            {filteredJobs.length && layout === "grid" && canUseGridLayout ? (
              <JobSplitView
                onDismiss={toggleJobDismissal}
                jobs={paginatedJobs}
                saveStateFor={(job) =>
                  candidateSaveState.isSignedIn && job.id && savedJobIds.has(job.id)
                    ? "saved"
                    : candidateSaveState.isSignedIn
                      ? "available"
                      : "signed-out"
                }
              />
            ) : filteredJobs.length ? (
              <div className="job-list">
                {paginatedJobs.map((job, index) => {
                  const resultIndex = pageStart + index;
                  return (
                    <Fragment key={job.slug}>
                      <div className="job-result-item" data-job-dismissal={job.id}>
                        <JobCard
                          compact
                          onDismiss={
                            job.id
                              ? () => {
                                  void toggleJobDismissal(job);
                                }
                              : undefined
                          }
                          job={job}
                          saveState={
                            candidateSaveState.isSignedIn && job.id && savedJobIds.has(job.id)
                              ? "saved"
                              : candidateSaveState.isSignedIn
                                ? "available"
                                : "signed-out"
                          }
                        />
                      </div>
                      {resultIndex >= 2 && (resultIndex - 2) % 10 === 0 ? (
                        <JobTrainingPromo position={resultIndex + 1} />
                      ) : null}
                    </Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No roles to show</h3>
                <p>
                  {hasFilters
                    ? "Try a broader search or clear your filters."
                    : dismissedCount
                      ? "Use Show hidden jobs to bring back roles you have hidden."
                      : "Check back soon for new opportunities."}
                </p>
                {hasFilters ? (
                  <Button type="button" variant="quiet" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
            )}
            {filteredJobs.length ? (
              <nav className="job-pagination" aria-label="Job results pages">
                <button disabled={activePage === 1} onClick={() => changePage(activePage - 1)} type="button">
                  Previous
                </button>
                <p aria-live="polite">
                  Page {activePage} of {pageCount}
                </p>
                <button
                  disabled={activePage === pageCount}
                  onClick={() => changePage(activePage + 1)}
                  type="button"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
      {afterListings}
    </section>
  );
}
