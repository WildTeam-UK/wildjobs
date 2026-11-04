"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { BrandLockup } from "./brand-lockup";
import { CourseMenuIcon } from "./course-menu-icon";
import styles from "./course-experiment-header.module.css";

const navigation = [
  {
    label: "Jobs",
    href: "https://jobs.wildteam.org.uk/",
    links: [
      ["Find conservation jobs", "https://jobs.wildteam.org.uk/", "search"],
      [
        "Career guides",
        "https://jobs.wildteam.org.uk/conservation-career-guides#career-guides-title",
        "compass",
      ],
      [
        "Sector guides",
        "https://jobs.wildteam.org.uk/conservation-career-guides#sector-guides-title",
        "leaf",
      ],
      ["Saved jobs", "https://jobs.wildteam.org.uk/saved-jobs", "heart"],
    ],
  },
  {
    label: "News",
    href: "https://news.wildteam.org.uk/",
    links: [
      ["Latest conservation news", "https://news.wildteam.org.uk/", "news"],
      ["Good News", "https://news.wildteam.org.uk/good-news-in-conservation", "sparkles"],
      ["Daily and weekly digests", "https://news.wildteam.org.uk/digests", "mail"],
    ],
  },
  {
    label: "Training",
    href: "https://training.wildteam.org.uk/",
    links: [
      ["Explore all courses", "https://training.wildteam.org.uk/courses", "book"],
      ["Memberships", "https://training.wildteam.org.uk/memberships", "badge"],
      ["Bursaries", "https://training.wildteam.org.uk/bursaries", "gift"],
      ["Training for teams", "https://training.wildteam.org.uk/pricing-teams", "users"],
    ],
  },
  {
    label: "About",
    href: "https://www.wildteam.org.uk/",
    links: [
      ["Our cause", "https://www.wildteam.org.uk/our-cause", "leaf"],
      ["Our team", "https://www.wildteam.org.uk/team", "users"],
      ["Our impact", "https://www.wildteam.org.uk/conservation-impact", "chart"],
      ["Our partners", "https://www.wildteam.org.uk/conservation-partners", "handshake"],
      ["Support us", "https://www.wildteam.org.uk/donate", "heart"],
      ["Get in touch", "https://training.wildteam.org.uk/contact-us", "message"],
    ],
  },
] as const;

function Chevron() {
  return (
    <svg className={styles.chevron} aria-hidden="true" viewBox="0 0 16 16">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function CourseExperimentHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const accountDialog = useRef<HTMLDialogElement>(null);
  const root = useRef<HTMLElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const conversionButton = useRef<HTMLAnchorElement>(null);
  const toggleRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const id = useId();

  function close() {
    setExpanded(null);
    setMobileOpen(false);
  }

  useEffect(() => {
    const header = root.current;
    if (!header) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    };
    const observer = new ResizeObserver(updateHeight);
    observer.observe(header);
    updateHeight();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hero = document.getElementById("course-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const pastHero = entry.boundingClientRect.bottom <= (root.current?.offsetHeight ?? 0);
        if (
          pastHero &&
          !window.matchMedia("(max-width: 900px)").matches &&
          root.current?.querySelector("nav")?.contains(document.activeElement)
        ) {
          conversionButton.current?.focus({ preventScroll: true });
        }
        setScrolled(pastHero);
        setExpanded(null);
      },
      { rootMargin: `-${root.current?.offsetHeight ?? 0}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) close();
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (expanded) {
        toggleRefs.current[expanded]?.focus();
        setExpanded(null);
      } else if (mobileOpen) {
        setMobileOpen(false);
        mobileButton.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [expanded, mobileOpen]);

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <a className={styles.skip} href="#course-main">
        Skip to course
      </a>
      <div className={`shell ${styles.inner}`}>
        <a href="https://www.wildteam.org.uk/" className={`brand ${styles.brand}`} aria-label="WildTeam home">
          <BrandLockup />
        </a>
        <a
          className={`${styles.primary} ${styles.mobileCta}`}
          href="#course-options"
          onClick={close}
          aria-hidden={!scrolled}
          inert={!scrolled}
        >
          Enrol now
        </a>
        <button
          className={styles.mobileToggle}
          ref={mobileButton}
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-controls={`${id}-nav`}
          aria-expanded={mobileOpen}
          onClick={() => {
            setMobileOpen(!mobileOpen);
            setExpanded(null);
          }}
          type="button"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d={mobileOpen ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        <div id={`${id}-nav`} className={`${styles.navigation} ${mobileOpen ? styles.open : ""}`}>
          <div className={styles.navSlot}>
            <div className={styles.courseContext} aria-hidden={!scrolled} inert={!scrolled}>
              <strong>Project Management for Wildlife Conservation</strong>
              <span>Build your skills from £29/month</span>
            </div>
            <nav aria-label="Main navigation" className={styles.links}>
              {navigation.map((item) => (
                <div
                  className={`${styles.item} ${item.label === "Training" ? styles.active : ""}`}
                  key={item.label}
                >
                  <div className={styles.label}>
                    <a
                      href={item.href}
                      aria-current={item.label === "Training" ? "true" : undefined}
                      onClick={close}
                    >
                      {item.label}
                    </a>
                    <button
                      type="button"
                      aria-label={`${item.label} menu`}
                      aria-expanded={expanded === item.label}
                      aria-controls={`${id}-${item.label}`}
                      ref={(element) => {
                        toggleRefs.current[item.label] = element;
                      }}
                      onClick={() => setExpanded(expanded === item.label ? null : item.label)}
                    >
                      <Chevron />
                    </button>
                  </div>
                  <div
                    className={styles.dropdown}
                    id={`${id}-${item.label}`}
                    hidden={expanded !== item.label}
                    inert={expanded !== item.label}
                  >
                    {item.links.map(([label, href, icon]) => (
                      <a href={href} key={label} onClick={close}>
                        <CourseMenuIcon name={icon} />
                        <span className="icon-label">
                          {label === "Good News" ? <span className={styles.fancy}>Good News</span> : label}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          <div className={styles.actions}>
            <div className={styles.item}>
              <button
                type="button"
                className={styles.signIn}
                aria-label={signedIn ? "Hey, Matt! Account menu" : "Sign in"}
                aria-expanded={signedIn ? expanded === "Account" : undefined}
                aria-controls={signedIn ? `${id}-account` : undefined}
                ref={(element) => {
                  toggleRefs.current.Account = element;
                }}
                onClick={() => {
                  if (!signedIn) {
                    setSignedIn(true);
                    setExpanded("Account");
                  } else setExpanded(expanded === "Account" ? null : "Account");
                }}
              >
                {signedIn ? (
                  <Image
                    className={styles.avatar}
                    src="/images/course-experiment/demo-avatar.jpg"
                    alt=""
                    width={32}
                    height={32}
                    sizes="32px"
                  />
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <circle cx="12" cy="7.5" r="3.5" />
                    <path d="M5 20v-1a7 7 0 0 1 14 0v1" />
                  </svg>
                )}
                <span className="icon-label">{signedIn ? "Hey, Matt!" : "Sign in"}</span>
                {signedIn ? <Chevron /> : null}
              </button>
              <div
                className={`${styles.dropdown} ${styles.accountDropdown}`}
                id={`${id}-account`}
                hidden={!signedIn || expanded !== "Account"}
                inert={!signedIn || expanded !== "Account"}
              >
                <a href="https://training.wildteam.org.uk/home" onClick={close}>
                  <CourseMenuIcon name="book" />
                  <span className="icon-label">My learning</span>
                </a>
                <a href="https://jobs.wildteam.org.uk/saved-jobs" onClick={close}>
                  <CourseMenuIcon name="heart" />
                  <span className="icon-label">Saved jobs</span>
                </a>
                {(
                  [
                    ["Job alerts", "bell"],
                    ["Email preferences", "mail"],
                    ["Account settings", "settings"],
                  ] as const
                ).map(([label, icon]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setPreviewTitle(label);
                      accountDialog.current?.showModal();
                      close();
                    }}
                  >
                    <CourseMenuIcon name={icon} />
                    <span className="icon-label">{label}</span>
                  </button>
                ))}
                <button
                  className={styles.signOut}
                  type="button"
                  onClick={() => {
                    setSignedIn(false);
                    setExpanded(null);
                    toggleRefs.current.Account?.focus();
                  }}
                >
                  <CourseMenuIcon name="logout" />
                  <span className="icon-label">Sign out</span>
                </button>
                <span className={styles.previewNote}>Account preview</span>
              </div>
            </div>
            <a className={styles.primary} ref={conversionButton} href="#course-options" onClick={close}>
              {scrolled ? "Enrol now" : "Start learning"}
            </a>
          </div>
        </div>
      </div>
      <dialog
        className={styles.accountDialog}
        ref={accountDialog}
        aria-labelledby={`${id}-account-preview-title`}
        onClose={() => {
          if (window.matchMedia("(max-width: 900px)").matches) mobileButton.current?.focus();
          else toggleRefs.current.Account?.focus();
        }}
      >
        <h2 id={`${id}-account-preview-title`}>{previewTitle}</h2>
        <p>
          This is a preview of the shared WildTeam account. {previewTitle} will be available here when shared
          sign-in is connected.
        </p>
        <button type="button" className={styles.primary} onClick={() => accountDialog.current?.close()}>
          Back to the course
        </button>
      </dialog>
    </header>
  );
}
