"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function FittedCareerGrid({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frames = root.current?.querySelectorAll<HTMLElement>("[data-career-description-frame]");
    if (!frames) return;
    function fit(frame: HTMLElement) {
      const paragraph = frame.querySelector<HTMLElement>("[data-career-description]");
      if (!paragraph) return;
      const lineHeight = Number.parseFloat(getComputedStyle(paragraph).lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
      const lines = Math.floor((frame.getBoundingClientRect().height + 0.01) / lineHeight);
      paragraph.style.setProperty("--career-description-lines", String(Math.max(1, lines)));
      paragraph.dataset.noLineSpace = String(lines < 1);
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) fit(entry.target as HTMLElement);
    });
    for (const frame of frames) {
      fit(frame);
      observer.observe(frame);
    }
    let active = true;
    void document.fonts.ready.then(() => {
      if (active) for (const frame of frames) fit(frame);
    });
    return () => {
      active = false;
      observer.disconnect();
    };
  }, []);
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
