"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const choiceKey = "wildjobs_analytics_consent_v1";
const choiceEvent = "wildjobs:analytics-choice";
const settingsEvent = "wildjobs:analytics-settings";
type Choice = "granted" | "denied";
let memoryChoice: Choice | null = null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getChoice(): Choice | null {
  try {
    const value = window.localStorage.getItem(choiceKey);
    return value === "granted" || value === "denied" ? value : memoryChoice;
  } catch {
    return memoryChoice;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(choiceEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(choiceEvent, listener);
  };
}

function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (!name.startsWith("wildjobs_")) continue;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; path=/; domain=jobs.wildteam.org.uk; SameSite=Lax`;
  }
}

export function AnalyticsConsent({ enabled, containerId }: { enabled: boolean; containerId: string }) {
  const pathname = usePathname();
  const choice = useSyncExternalStore(subscribe, getChoice, () => undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const publicPath = !/^\/(?:admin|account|auth|api|sign-in|create-account|check-email)(?:\/|$)/.test(
    pathname,
  );
  const configured = enabled && /^GTM-[A-Z0-9]+$/.test(containerId);

  useEffect(() => {
    const openSettings = () => setSettingsOpen(true);
    window.addEventListener(settingsEvent, openSettings);
    return () => window.removeEventListener(settingsEvent, openSettings);
  }, []);

  useEffect(() => {
    const existing = document.querySelector("script[data-wildjobs-analytics]");
    if (
      !configured ||
      !publicPath ||
      choice !== "granted" ||
      window.location.hostname !== "jobs.wildteam.org.uk"
    ) {
      if (existing) {
        clearAnalyticsCookies();
        window.location.reload();
      }
      return;
    }
    if (existing) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag =
      window.gtag ??
      function googleTagCommand(...args: unknown[]) {
        void args;
        // oxlint-disable-next-line prefer-rest-params -- Google's command queue uses Arguments objects.
        window.dataLayer!.push(arguments);
      };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("set", {
      cookie_domain: "jobs.wildteam.org.uk",
      cookie_prefix: "wildjobs",
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.dataset.wildjobsAnalytics = containerId;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
    document.head.appendChild(script);
  }, [configured, publicPath, choice, containerId]);

  function saveChoice(next: Choice) {
    memoryChoice = next;
    try {
      window.localStorage.setItem(choiceKey, next);
    } catch {
      /* Keep the choice for this visit. */
    }
    setSettingsOpen(false);
    window.dispatchEvent(new Event(choiceEvent));
  }

  if (!configured || !publicPath || choice === undefined || (choice !== null && !settingsOpen)) return null;
  return (
    <section className="analytics-consent" aria-labelledby="analytics-consent-title">
      <div>
        <h2 id="analytics-consent-title">Help us improve WildJobs</h2>
        <p>
          May we use Google Analytics to understand how this site is used? Saved jobs work either way. You can
          change your choice in Cookie settings.
        </p>
      </div>
      <div className="analytics-consent__actions">
        <button className="action" onClick={() => saveChoice("granted")} type="button">
          Allow analytics
        </button>
        <button className="action action--outline" onClick={() => saveChoice("denied")} type="button">
          No thanks
        </button>
      </div>
    </section>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      className="cookie-settings-button"
      onClick={() => window.dispatchEvent(new Event(settingsEvent))}
      type="button"
    >
      Cookie settings
    </button>
  );
}
