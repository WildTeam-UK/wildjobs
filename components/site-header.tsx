"use client";

import { BrandLockup } from "@/components/brand-lockup";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    };
    const observer = new ResizeObserver(updateHeaderHeight);

    updateHeaderHeight();
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="shell site-header__inner">
        <Link className="brand" href="/" aria-label="WildTeam Jobs home" onClick={closeMenu}>
          <BrandLockup />
        </Link>
        <button
          className="site-menu-toggle"
          type="button"
          ref={menuButtonRef}
          aria-expanded={open}
          aria-controls="site-navigation"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((current) => !current)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path d={open ? "m6 6 12 12M6 18 18 6" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        <div className={`site-navigation${open ? " is-open" : ""}`} id="site-navigation">
          <nav className="site-nav" aria-label="Main navigation">
            <a
              href="https://news.wildteam.org.uk/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              News
            </a>
            <a
              href="https://training.wildteam.org.uk/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
            >
              Training
            </a>
            <Link href="/conservation-career-guides" onClick={closeMenu}>
              Career guides
            </Link>
          </nav>
          <div className="site-navigation-actions">
            <Link
              className="site-navigation-button site-navigation-button--outline"
              href="/how-we-use-ai"
              onClick={closeMenu}
            >
              How we use AI
            </Link>
            <Link
              className="site-navigation-button site-navigation-button--saved"
              href="/account/saved"
              onClick={closeMenu}
            >
              Saved jobs
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
