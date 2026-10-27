import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

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
  metadataBase: new URL("https://jobs.wildteam.org.uk"),
  title: {
    default: "WildJobs | Conservation careers",
    template: "%s | WildJobs",
  },
  description: "Discover conservation jobs and career opportunities from WildTeam.",
  applicationName: "WildJobs",
  creator: "WildTeam",
  publisher: "WildTeam",
  robots: { index: false, follow: false, noarchive: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-GB" className={vagRounded.variable} data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
