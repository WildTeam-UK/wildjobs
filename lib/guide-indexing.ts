import type { Metadata } from "next";
import { siteIndexingEnabled } from "./site-indexing";

// Explicitly override the template layout's noindex on reviewed production guides.
// Returning undefined would inherit noindex even after editorial publication.
export function guideRobots(isDraft: boolean): Metadata["robots"] {
  return { index: !isDraft && siteIndexingEnabled(), follow: true };
}
