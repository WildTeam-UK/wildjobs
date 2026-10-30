"use client";

import { BrandWordmark } from "@wildteam-uk/ui";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);

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
        <Link className="brand" href="/" aria-label="WildJobs home">
          <BrandWordmark className="brand__wordmark" product="JOBS" />
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <Link href="/">Find jobs</Link>
          <Link href="/careers">Explore careers</Link>
          <Link href="/employers">Employers</Link>
          <Link href="/for-employers">For employers</Link>
          <Link className="site-nav__saved" href="/account/saved">
            Saved jobs
          </Link>
        </nav>
      </div>
    </header>
  );
}
