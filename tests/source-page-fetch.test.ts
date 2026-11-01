import { describe, expect, it } from "vitest";

import { isApprovedVacancyDetailUrl } from "../lib/admin/source-url-validation";

describe("approved vacancy detail URLs", () => {
  it("accepts only EnvironmentJob vacancy pages for the reviewed feed", () => {
    const sourceUrl = "https://environmentjob.co.uk/jobs.rss";

    expect(
      isApprovedVacancyDetailUrl(
        "https://environmentjob.co.uk/jobs/112187-senior-climate-change-officer",
        "feed",
        sourceUrl,
      ),
    ).toBe(true);
    expect(
      isApprovedVacancyDetailUrl("https://environmentjob.co.uk/organisations/71", "feed", sourceUrl),
    ).toBe(false);
    expect(
      isApprovedVacancyDetailUrl(
        "https://example.org/jobs/112187-senior-climate-change-officer",
        "feed",
        sourceUrl,
      ),
    ).toBe(false);
  });
});
