"use client";

import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { SectorIcon } from "./sector-icon";

type FilterIconName =
  | "briefcase"
  | "brand"
  | "clock"
  | "country"
  | "course"
  | "leaf"
  | "location"
  | "opportunity"
  | "salary"
  | "sort";
type FilterOption = Readonly<{ label: string; value: string; count?: number }>;

export function JobSearchField({
  id,
  label,
  onChange,
  placeholder = label,
  value,
  inputRef,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
  inputRef?: Ref<HTMLInputElement>;
}) {
  return (
    <div className="job-search-field">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 5 5" />
      </svg>
      <label className="wt-visually-hidden" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        ref={inputRef}
        type="search"
        value={value}
      />
    </div>
  );
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
    country: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z" />
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
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <circle cx="12" cy="12" r="2.75" />
        <path d="M6 8.5H5.5v.5M18 8.5h.5v.5M6 15.5H5.5V15M18 15.5h.5V15" />
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
  showSectorIcons?: boolean;
};

type MultiFilterDropdownProps = Omit<SingleFilterDropdownProps, "multiple" | "onChange" | "value"> & {
  multiple: true;
  onChange: (value: readonly string[]) => void;
  value: readonly string[];
};

export function FilterDropdown(props: SingleFilterDropdownProps | MultiFilterDropdownProps) {
  const { accessibleLabel, className = "", clearLabel, icon, options, placeholder } = props;
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selectedValues = props.multiple ? props.value : props.value ? [props.value] : [];
  const selectedLabel =
    props.multiple && selectedValues.length > 1
      ? `${selectedValues.length} courses`
      : (options.find((option) => option.value === selectedValues[0])?.label ?? placeholder);
  const orderedOptions = options.every((option) => option.count !== undefined)
    ? options.toSorted(
        (left, right) => (right.count ?? 0) - (left.count ?? 0) || left.label.localeCompare(right.label),
      )
    : options;
  const allOptions: readonly FilterOption[] = [{ label: clearLabel, value: "" }, ...orderedOptions];
  const isOptionDisabled = (option: FilterOption) =>
    option.count === 0 && !selectedValues.includes(option.value);
  const selectedIndex = Math.max(
    0,
    allOptions.findIndex((option) => selectedValues.includes(option.value)),
  );
  useEffect(() => {
    if (!isOpen) return;
    const isInside = (target: EventTarget | null) =>
      rootRef.current?.contains(target as Node) || menuRef.current?.contains(target as Node);
    function outside(event: PointerEvent) {
      if (!isInside(event.target)) setIsOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }
    function moved(event: WheelEvent | TouchEvent) {
      if (!isInside(event.target)) setIsOpen(false);
    }
    function resized() {
      setIsOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("wheel", moved, { capture: true, passive: true });
    document.addEventListener("touchmove", moved, { capture: true, passive: true });
    window.addEventListener("resize", resized);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("wheel", moved, true);
      document.removeEventListener("touchmove", moved, true);
      window.removeEventListener("resize", resized);
    };
  }, [isOpen]);
  function openMenu(focusIndex = selectedIndex) {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const bounds = trigger.getBoundingClientRect(),
      width = Math.min(300, window.innerWidth - 32),
      height = Math.min(allOptions.length * 43 + 16, 320);
    setMenuPosition({
      left: Math.min(
        Math.max(16, bounds.left + bounds.width / 2 - width / 2),
        window.innerWidth - width - 16,
      ),
      top:
        bounds.bottom + 8 + height <= window.innerHeight - 16
          ? bounds.bottom + 8
          : Math.max(16, bounds.top - height - 8),
      width,
    });
    setIsOpen(true);
    const enabled = allOptions
      .map((option, index) => (isOptionDisabled(option) ? -1 : index))
      .filter((index) => index >= 0);
    const target =
      focusIndex === allOptions.length - 1
        ? enabled.at(-1)
        : (enabled.find((index) => index >= focusIndex) ?? enabled[0]);
    requestAnimationFrame(() => optionRefs.current[target ?? 0]?.focus({ preventScroll: true }));
  }
  function navigateMenu(event: ReactKeyboardEvent<HTMLDivElement>) {
    const available = allOptions
      .map((option, index) => (isOptionDisabled(option) ? -1 : index))
      .filter((index) => index >= 0);
    const current = optionRefs.current.findIndex((option) => option === document.activeElement),
      position = available.indexOf(current);
    const next =
      event.key === "ArrowDown"
        ? Math.min(position + 1, available.length - 1)
        : event.key === "ArrowUp"
          ? Math.max(position - 1, 0)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? available.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    optionRefs.current[available[next]]?.focus();
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
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(event.key === "ArrowUp" ? allOptions.length - 1 : selectedIndex);
          }
        }}
        ref={buttonRef}
        type="button"
      >
        <FilterIcon name={icon} />
        <span className="job-filter-pill__value icon-label">{selectedLabel}</span>
        <svg className="job-filter-pill__chevron" aria-hidden="true" viewBox="0 0 12 8">
          <path d="m1 1.5 5 5 5-5" />
        </svg>
      </button>
      {isOpen
        ? createPortal(
            <div
              aria-label={accessibleLabel}
              className="job-filter-menu"
              id={menuId}
              onKeyDown={navigateMenu}
              ref={menuRef}
              role="menu"
              style={menuPosition}
            >
              {allOptions.map((option, index) => {
                const checked = option.value
                  ? selectedValues.includes(option.value)
                  : selectedValues.length === 0;
                return (
                  <button
                    aria-checked={props.multiple && !option.value ? undefined : checked}
                    className="job-filter-menu__option"
                    disabled={isOptionDisabled(option)}
                    key={option.value}
                    onClick={() => {
                      if (props.multiple)
                        props.onChange(
                          option.value
                            ? selectedValues.includes(option.value)
                              ? selectedValues.filter((value) => value !== option.value)
                              : [...selectedValues, option.value]
                            : [],
                        );
                      else {
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
                    {props.showSectorIcons && option.value ? <SectorIcon title={option.label} /> : null}
                    <span className="job-filter-menu__label icon-label">{option.label}</span>
                    {option.count !== undefined ? (
                      <span className="job-filter-menu__count icon-label" aria-label={`${option.count} jobs`}>
                        {option.count}
                      </span>
                    ) : null}
                    {checked ? (
                      <svg aria-hidden="true" viewBox="0 0 16 16">
                        <path d="m3 8 3 3 7-7" />
                      </svg>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
