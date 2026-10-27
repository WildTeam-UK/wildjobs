import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

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
    <html lang="en-GB" data-scroll-behavior="smooth">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
