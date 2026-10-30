"use client";

import { Button } from "@wildteam-uk/ui";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { JobCard } from "@/components/job-card";
import { courseBySlug, courses } from "@/lib/courses";
import type { CandidateSaveState } from "@/lib/candidate-saved-jobs";
import { filterJobs, jobCategories } from "@/lib/job-filtering";
import type { EmploymentType, EngagementType, Job, LocationType } from "@/lib/jobs";

const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site", "Not specified"];
const discoveryEmojis = ["🔎", "🧭", "✨", "💡", "🔭", "🗺️"] as const;
const natureEmojis = ["🌱", "🌿", "🌳", "🌊", "🍄", "🌸"] as const;
const wildlifeEmojis = ["🐘", "🦊", "🦉", "🐢", "🦋", "🐬", "🦏", "🐝"] as const;
export type JobSortOrder = "closing" | "newest" | "relevance";
type FilterIconName =
  | "briefcase"
  | "brand"
  | "clock"
  | "course"
  | "leaf"
  | "location"
  | "opportunity"
  | "salary"
  | "sort";
type FilterOption = Readonly<{ label: string; value: string }>;
type HeroEmojis = Readonly<{ discovery: string; nature: string; wildlife: string }>;
type BrowserFilters = Readonly<{
  query: string;
  locationQuery: string;
  locationType: LocationType | "";
  engagementType: EngagementType | "";
  employmentType: EmploymentType | "";
  contractType: string;
  category: string;
  courseSlugs: readonly string[];
  minimumSalary: number;
  sortOrder: JobSortOrder;
}>;

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function FilterIcon({ name }: { name: FilterIconName }) {
  if (name === "brand") {
    return (
      <svg
        className="job-filter-pill__icon job-filter-pill__icon--brand"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <path
          className="job-filter-pill__brand-heart"
          d="M12 21C7.5 19.8 4.3 17.6 2.8 14.4 1 10.7 1.8 5.7 5.5 3.9 8.1 2.6 10.5 4.2 12 6.5c1.5-2.3 3.9-3.9 6.5-2.6 3.7 1.8 4.5 6.8 2.7 10.5C19.7 17.6 16.5 19.8 12 21Z"
        />
        <path className="job-filter-pill__brand-branches" d="M12 18.5v-10" />
        <path
          className="job-filter-pill__brand-branches"
          d="M12 12.2c-2.3-.5-4-1.6-5.3-3.4M12 12.2c2.3-.5 4-1.6 5.3-3.4"
        />
        <path
          className="job-filter-pill__brand-branches"
          d="M12 16c-3-.6-5.2-2-6.8-4.2M12 16c3-.6 5.2-2 6.8-4.2"
        />
      </svg>
    );
  }

  const paths = {
    briefcase: (
      <>
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <path d="M3 12h18M10 12v2h4v-2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    course: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C11 4 5 8 5 14a5 5 0 0 0 5 5c6 0 10-6 10-15Z" />
        <path d="M4 20c3-5 7-8 12-10" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    opportunity: (
      <>
        <path d="M12 21s-8-4.7-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.3-8 11-8 11Z" />
      </>
    ),
    salary: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5a3 3 0 0 0-5.5 1.7v4.3c0 1.7-1 2.5-2 3h8M8.5 13h5" />
      </>
    ),
    sort: (
      <>
        <path d="M4 7h11M4 12h8M4 17h5" />
        <path d="m16 14 3 3 3-3M19 17V7" />
      </>
    ),
  } satisfies Record<Exclude<FilterIconName, "brand">, ReactNode>;

  return (
    <svg className="job-filter-pill__icon" aria-hidden="true" viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

type SingleFilterDropdownProps = {
  accessibleLabel: string;
  className?: string;
  clearLabel: string;
  icon: FilterIconName;
  onChange: (value: string) => void;
  options: readonly FilterOption[];
  placeholder: string;
  value: string;
  multiple?: false;
};

type MultiFilterDropdownProps = Omit<SingleFilterDropdownProps, "multiple" | "onChange" | "value"> & {
  multiple: true;
  onChange: (value: readonly string[]) => void;
  value: readonly string[];
};

function FilterDropdown(props: SingleFilterDropdownProps | MultiFilterDropdownProps) {
  const { accessibleLabel, className = "", clearLabel, icon, options, placeholder } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selectedValues = props.multiple ? props.value : props.value ? [props.value] : [];
  const selectedLabel = props.multiple
    ? selectedValues.length > 1
      ? `${selectedValues.length} courses`
      : (options.find((option) => option.value === selectedValues[0])?.label ?? placeholder)
    : (options.find((option) => option.value === props.value)?.label ?? placeholder);
  const allOptions = [{ label: clearLabel, value: "" }, ...options];
  const selectedIndex = Math.max(
    0,
    allOptions.findIndex((option) => selectedValues.includes(option.value)),
  );

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    function closeOnViewportChange() {
      setIsOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("wheel", closeOnViewportChange, { capture: true, passive: true });
    document.addEventListener("touchmove", closeOnViewportChange, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("wheel", closeOnViewportChange, true);
      document.removeEventListener("touchmove", closeOnViewportChange, true);
    };
  }, [isOpen]);

  function openMenu(focusIndex = selectedIndex) {
    const trigger = buttonRef.current;
    if (trigger) {
      const triggerBounds = trigger.getBoundingClientRect();
      const menuWidth = Math.min(260, window.innerWidth - 32);
      const menuHeight = Math.min(allOptions.length * 43 + 16, 320);
      const idealLeft = triggerBounds.left + triggerBounds.width / 2 - menuWidth / 2;
      const fitsBelow = triggerBounds.bottom + 8 + menuHeight <= window.innerHeight - 16;
      setMenuPosition({
        left: Math.min(Math.max(16, idealLeft), window.innerWidth - menuWidth - 16),
        top: fitsBelow ? triggerBounds.bottom + 8 : Math.max(16, triggerBounds.top - menuHeight - 8),
        width: menuWidth,
      });
    }
    setIsOpen(true);
    requestAnimationFrame(() => optionRefs.current[focusIndex]?.focus({ preventScroll: true }));
  }

  function navigateMenu(event: ReactKeyboardEvent<HTMLDivElement>) {
    const currentIndex = optionRefs.current.findIndex((option) => option === document.activeElement);
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown") nextIndex = Math.min(currentIndex + 1, allOptions.length - 1);
    else if (event.key === "ArrowUp") nextIndex = Math.max(currentIndex - 1, 0);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = allOptions.length - 1;
    else return;

    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      className={`job-filter-pill${selectedValues.length ? " job-filter-pill--active" : ""}${isOpen ? " job-filter-pill--open" : ""}${className ? ` ${className}` : ""}`}
      ref={rootRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`${accessibleLabel}: ${selectedLabel}`}
        className="job-filter-pill__trigger"
        onClick={() => {
          if (isOpen) setIsOpen(false);
          else openMenu();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu();
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(allOptions.length - 1);
          }
        }}
        ref={buttonRef}
        type="button"
      >
        <FilterIcon name={icon} />
        <span className="job-filter-pill__value">{selectedLabel}</span>
        <svg className="job-filter-pill__chevron" aria-hidden="true" viewBox="0 0 12 8">
          <path d="m1 1.5 5 5 5-5" />
        </svg>
      </button>
      {isOpen ? (
        <div
          aria-label={accessibleLabel}
          className="job-filter-menu"
          id={menuId}
          onKeyDown={navigateMenu}
          role="menu"
          style={menuPosition}
        >
          {allOptions.map((option, index) => (
            <button
              aria-checked={
                props.multiple && !option.value
                  ? undefined
                  : option.value
                    ? selectedValues.includes(option.value)
                    : selectedValues.length === 0
              }
              className="job-filter-menu__option"
              key={option.value}
              onClick={() => {
                if (props.multiple) {
                  props.onChange(
                    option.value
                      ? selectedValues.includes(option.value)
                        ? selectedValues.filter((value) => value !== option.value)
                        : [...selectedValues, option.value]
                      : [],
                  );
                } else {
                  props.onChange(option.value);
                  setIsOpen(false);
                  buttonRef.current?.focus();
                }
              }}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              role={props.multiple ? (option.value ? "menuitemcheckbox" : "menuitem") : "menuitemradio"}
              type="button"
            >
              <span>{option.label}</span>
              {(option.value ? selectedValues.includes(option.value) : !props.multiple) ? (
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path d="m3 8 3 3 7-7" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

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
  const [courseSlugs, setCourseSlugs] = useState<readonly string[]>(initialFilters.courseSlugs ?? []);
  const [minimumSalary, setMinimumSalary] = useState(initialFilters.minimumSalary ?? 0);
  const [sortOrder, setSortOrder] = useState<JobSortOrder>(initialFilters.sortOrder ?? "relevance");
  const [heroEmojis, setHeroEmojis] = useState<HeroEmojis>({
    discovery: discoveryEmojis[0],
    nature: natureEmojis[0],
    wildlife: wildlifeEmojis[0],
  });
  const [isHeroCompact, setIsHeroCompact] = useState(false);
  const compactTransitionUntilRef = useRef(0);
  const expandedHeroHeightRef = useRef(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const isHeroCompactRef = useRef(false);
  const lastScrollYRef = useRef(0);
  isHeroCompactRef.current = isHeroCompact;
  const filteredJobs = filterJobs(jobs, {
    category,
    contractType,
    courseSlugs,
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
    courseSlugs.length ||
    minimumSalary,
  );
  const selectedCourses = courseSlugs.flatMap((slug) => {
    const course = courseBySlug(slug);
    return course ? [course] : [];
  });
  const savedJobIds = new Set(candidateSaveState.savedJobIds);

  useEffect(() => {
    setHeroEmojis({
      discovery: randomItem(discoveryEmojis),
      nature: randomItem(natureEmojis),
      wildlife: randomItem(wildlifeEmojis),
    });
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    lastScrollYRef.current = window.scrollY;

    const updateCompactState = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const previousScrollY = lastScrollYRef.current;
        lastScrollYRef.current = currentScrollY;

        if (performance.now() < compactTransitionUntilRef.current) return;

        setIsHeroCompact((isCompact) => {
          if (!isCompact && currentScrollY > 96) {
            compactTransitionUntilRef.current = performance.now() + 480;
            return true;
          }
          if (isCompact && currentScrollY <= 8 && currentScrollY < previousScrollY) {
            compactTransitionUntilRef.current = performance.now() + 480;
            return false;
          }
          return isCompact;
        });
      });
    };

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateCompactState);
    };
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    expandedHeroHeightRef.current = hero.getBoundingClientRect().height;
    const observer = new ResizeObserver(() => {
      const currentHeight = hero.getBoundingClientRect().height;
      const transitionIsSettled = performance.now() >= compactTransitionUntilRef.current;

      if (!isHeroCompactRef.current && transitionIsSettled) {
        expandedHeroHeightRef.current = currentHeight;
      }

      const compensation = Math.max(0, expandedHeroHeightRef.current - currentHeight);
      hero.style.marginBottom = `${compensation}px`;
    });

    observer.observe(hero);
    return () => {
      observer.disconnect();
      hero.style.marginBottom = "";
    };
  }, []);

  function syncUrl(filters: BrowserFilters) {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.locationQuery) params.set("place", filters.locationQuery);
    if (filters.locationType) params.set("location", filters.locationType);
    if (filters.engagementType) params.set("opportunity", filters.engagementType);
    if (filters.employmentType) params.set("type", filters.employmentType);
    if (filters.contractType) params.set("contract", filters.contractType);
    if (filters.category) params.set("category", filters.category);
    filters.courseSlugs.forEach((slug) => params.append("course", slug));
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

  function clearFilters() {
    setQuery("");
    setLocationQuery("");
    setLocationType("");
    setEngagementType("");
    setEmploymentType("");
    setContractType("");
    setCategory("");
    setCourseSlugs([]);
    setMinimumSalary(0);
    syncUrl({
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
    <section
      className={`job-browser${isHeroCompact ? " job-browser--hero-compact" : ""}`}
      aria-labelledby="jobs-page-heading"
    >
      <div className={`job-search-hero${isHeroCompact ? " job-search-hero--compact" : ""}`} ref={heroRef}>
        <div className="job-search-hero__inner shell">
          <div className="job-search-hero__intro">
            <div className="job-search-hero__intro-content">
              <h1 id="jobs-page-heading">Do work that matters.</h1>
              <p className="job-search-hero__description">
                Discover{" "}
                <span aria-hidden="true" className="job-search-hero__emoji">
                  {heroEmojis.discovery}
                </span>{" "}
                your next meaningful career protecting wildlife{" "}
                <span aria-hidden="true" className="job-search-hero__emoji">
                  {heroEmojis.wildlife}
                </span>
                , restoring nature{" "}
                <span aria-hidden="true" className="job-search-hero__emoji">
                  {heroEmojis.nature}
                </span>{" "}
                and creating a better future for our planet.{" "}
                <span aria-hidden="true" className="job-search-hero__emoji">
                  🌍
                </span>
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
              options={courses.map((course) => ({ label: course.shortTitle, value: course.slug }))}
              placeholder="Related courses"
              value={courseSlugs}
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
                { label: "Paid", value: "Paid" },
                { label: "Volunteer", value: "Volunteer" },
              ]}
              placeholder="Opportunity"
              value={engagementType}
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
              options={locationTypes.map((value) => ({ label: value, value }))}
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
              options={contractTypes.map((value) => ({ label: value, value }))}
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
                { label: "Full time", value: "Full time" },
                { label: "Part time", value: "Part time" },
                { label: "Flexible", value: "Flexible" },
              ]}
              placeholder="Working hours"
              value={employmentType}
            />
            <FilterDropdown
              accessibleLabel="Category"
              clearLabel="Any category"
              icon="leaf"
              onChange={(value) => {
                setCategory(value);
                syncUrl(currentFilters({ category: value }));
              }}
              options={categories.map((value) => ({ label: value, value }))}
              placeholder="Category"
              value={category}
            />
            <FilterDropdown
              accessibleLabel="Minimum advertised salary"
              clearLabel="Any salary"
              icon="salary"
              onChange={(value) => {
                const nextValue = Number(value) || 0;
                setMinimumSalary(nextValue);
                syncUrl(currentFilters({ minimumSalary: nextValue }));
              }}
              options={[
                { label: "£20,000+", value: "20000" },
                { label: "£25,000+", value: "25000" },
                { label: "£30,000+", value: "30000" },
                { label: "£40,000+", value: "40000" },
                { label: "£50,000+", value: "50000" },
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

      <div className="shell">
        <div className="job-browser__layout">
          <div className="job-results">
            <div className="job-results__heading">
              <p aria-live="polite">
                {filteredJobs.length} Currently available {filteredJobs.length === 1 ? "role" : "roles"}
              </p>
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
            {selectedCourses.length ? (
              <div className="course-match-note">
                <p className="eyebrow">Course-aware discovery</p>
                <h3>
                  {selectedCourses.length === 1
                    ? `Roles related to ${selectedCourses[0].shortTitle.toLocaleLowerCase("en-GB")}`
                    : `Roles related to ${selectedCourses.length} selected courses`}
                </h3>
                <p>
                  These matches use capabilities covered by your courses. Completing a course does not
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
