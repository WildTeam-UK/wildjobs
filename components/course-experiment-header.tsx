"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BrandLockup } from "./brand-lockup";
import styles from "./course-experiment-header.module.css";

const navigation = [
  {
    label: "Jobs",
    href: "https://jobs.wildteam.org.uk/",
    links: [
      ["Find conservation jobs", "https://jobs.wildteam.org.uk/"],
      ["Career guides", "https://jobs.wildteam.org.uk/conservation-career-guides#career-guides-title"],
      ["Sector guides", "https://jobs.wildteam.org.uk/conservation-career-guides#sector-guides-title"],
      ["Saved jobs", "https://jobs.wildteam.org.uk/saved-jobs"],
    ],
  },
  {
    label: "News",
    href: "https://news.wildteam.org.uk/",
    links: [
      ["Latest conservation news", "https://news.wildteam.org.uk/"],
      ["Good News", "https://news.wildteam.org.uk/good-news-in-conservation"],
      ["Daily and weekly digests", "https://news.wildteam.org.uk/digests"],
    ],
  },
  {
    label: "Training",
    href: "https://training.wildteam.org.uk/",
    links: [
      ["Explore all courses", "https://training.wildteam.org.uk/courses"],
      ["Memberships", "https://training.wildteam.org.uk/memberships"],
      ["Bursaries", "https://training.wildteam.org.uk/bursaries"],
      ["Training for teams", "https://training.wildteam.org.uk/pricing-teams"],
    ],
  },
  {
    label: "About",
    href: "https://www.wildteam.org.uk/",
    links: [
      ["Our cause", "https://www.wildteam.org.uk/our-cause"],
      ["Our team", "https://www.wildteam.org.uk/team"],
      ["Our impact", "https://www.wildteam.org.uk/conservation-impact"],
      ["Our partners", "https://www.wildteam.org.uk/conservation-partners"],
      ["Support us", "https://www.wildteam.org.uk/donate"],
      ["Get in touch", "https://training.wildteam.org.uk/contact-us"],
    ],
  },
] as const;

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

export function CourseExperimentHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const accountDialog = useRef<HTMLDialogElement>(null);
  const root = useRef<HTMLElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
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
      className={styles.header}
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
                <div className={styles.dropdown} id={`${id}-${item.label}`} hidden={expanded !== item.label}>
                  {item.links.map(([label, href]) => (
                    <a href={href} key={label} onClick={close}>
                      {label === "Good News" ? <span className={styles.fancy}>Good News</span> : label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
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
                  <span className={styles.avatar} aria-hidden="true">
                    M
                  </span>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                  </svg>
                )}
                <span className="icon-label">{signedIn ? "Hey, Matt!" : "Sign in"}</span>
                {signedIn ? <Chevron /> : null}
              </button>
              <div
                className={`${styles.dropdown} ${styles.accountDropdown}`}
                id={`${id}-account`}
                hidden={!signedIn || expanded !== "Account"}
              >
                <a href="https://training.wildteam.org.uk/home" onClick={close}>
                  My learning
                </a>
                <a href="https://jobs.wildteam.org.uk/saved-jobs" onClick={close}>
                  Saved jobs
                </a>
                {["Job alerts", "Email preferences", "Account settings"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setPreviewTitle(label);
                      accountDialog.current?.showModal();
                      close();
                    }}
                  >
                    {label}
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
                  Sign out
                </button>
                <span className={styles.previewNote}>Account preview</span>
              </div>
            </div>
            <a className={styles.primary} href="#course-options" onClick={close}>
              Start learning
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
