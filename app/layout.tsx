import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import { SITE_URL, siteIndexingEnabled } from "@/lib/site-indexing";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { pageMetadata, siteDescription } from "@/lib/page-metadata";

const vagRounded = localFont({
  src: [
    { path: "../public/fonts/vag-rounded-light.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/vag-rounded-bold.woff", weight: "800", style: "normal" },
    { path: "../public/fonts/vag-rounded-black.woff", weight: "900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-vag-rounded",
});

export const metadata: Metadata = {
  ...pageMetadata({ title: "Conservation careers", description: siteDescription }),
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WildJobs | Conservation careers",
    template: "%s | WildJobs",
  },
  applicationName: "WildJobs",
  creator: "WildTeam",
  publisher: "WildTeam",
  robots: { index: siteIndexingEnabled(), follow: true, noarchive: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-GB" className={vagRounded.variable} data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        <div id="site-content" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter />
        <AnalyticsConsent
          enabled={process.env.VERCEL_ENV === "production"}
          containerId={process.env.NEXT_PUBLIC_GTM_ID ?? ""}
        />
      </body>
    </html>
  );
}
