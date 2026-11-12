import type { Metadata } from "next";
import { SITE_URL } from "./site-indexing";

export const siteDescription = "Discover conservation jobs and career opportunities from WildTeam.";
export const siteShareImage = {
  url: `${SITE_URL}/share-image.png`,
  width: 1200,
  height: 630,
  alt: "WildJobs by WildTeam — conservation jobs, employers and career guidance",
};

// Next.js replaces nested sharing objects instead of merging their fields.
// Set the complete preview together so titles, descriptions and URLs stay aligned.
export function pageMetadata({
  title,
  description,
  path,
  robots,
  staff = false,
}: {
  title: string;
  description: string;
  path?: string;
  robots?: Metadata["robots"];
  staff?: boolean;
}): Metadata {
  const sharingTitle = `${title} | WildJobs${staff ? " staff" : ""}`;
  const url = path ? new URL(path, SITE_URL).toString() : undefined;
  return {
    // A layout title template does not apply to its own page segment.
    // Use the complete title explicitly, including on the homepage and staff overview.
    title: { absolute: sharingTitle },
    description,
    ...(path ? { alternates: { canonical: path } } : {}),
    ...(robots ? { robots } : {}),
    openGraph: {
      type: "website",
      siteName: "WildJobs",
      locale: "en_GB",
      title: sharingTitle,
      description,
      ...(url ? { url } : {}),
      images: [siteShareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: sharingTitle,
      description,
      images: [{ url: siteShareImage.url, alt: siteShareImage.alt }],
    },
  };
}
