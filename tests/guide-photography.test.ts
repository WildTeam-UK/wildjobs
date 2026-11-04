import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { guideCatalog } from "../lib/guide-content";
import { guidePhotography } from "../lib/guide-photography";
import { guideStructuredData } from "../lib/guide-seo";
import { SITE_URL } from "../lib/site-indexing";

it.each(guideCatalog)("gives $slug a credited local photograph matching its Article metadata", (guide) => {
  const photo = guidePhotography[guide.slug];
  expect(photo.image).toMatch(/^\/images\/.+\.jpg$/);
  expect(existsSync(join(process.cwd(), "public", photo.image))).toBe(true);
  expect(photo.imageAlt.length).toBeGreaterThan(10);
  expect(photo.creatorName).not.toBe("");
  expect(new URL(photo.sourceUrl).hostname).toBe("unsplash.com");
  expect(guideStructuredData({ guide, isDraft: false })["@graph"][0]).toMatchObject({
    image: [SITE_URL + photo.image],
  });
});
