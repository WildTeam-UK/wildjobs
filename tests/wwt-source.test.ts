import { describe, expect, it } from "vitest";

import { isSupportedWwtSource, parseWwtVacancies } from "../lib/admin/wwt-source";

const listing = `
  <article>
    <h2 class="vsr-job__title">
      <a href="971/researcher-wetland-bioscience.html">Researcher, Wetland &amp; BioScience</a>
    </h2>
    <div class='vsr-job__date-posted'>Closing Date: 01/11/2026</div>
  </article>
  <article>
    <h2 class="vsr-job__title">
      <a href="981/reserve-warden.html">Reserve Warden</a>
    </h2>
    <div class='vsr-job__date-posted'>Closing Date: 06/11/2026</div>
  </article>
  <article>
    <h2 class="vsr-job__title">
      <a href="35/volunteer-educational-activities-assistant.html">Volunteer Activities Assistant</a>
    </h2>
  </article>
`;

describe("WWT vacancy source", () => {
  it("parses stable vacancy identities and approved fields", () => {
    expect(parseWwtVacancies(listing)).toEqual([
      {
        canonicalUrl: "https://vacancies.wwt.org.uk/vacancies/971/researcher-wetland-bioscience.html",
        closesAt: "2026-11-01",
        externalId: "971",
        title: "Researcher, Wetland & BioScience",
      },
      {
        canonicalUrl: "https://vacancies.wwt.org.uk/vacancies/981/reserve-warden.html",
        closesAt: "2026-11-06",
        externalId: "981",
        title: "Reserve Warden",
      },
      {
        canonicalUrl:
          "https://vacancies.wwt.org.uk/vacancies/35/volunteer-educational-activities-assistant.html",
        closesAt: null,
        externalId: "35",
        title: "Volunteer Activities Assistant",
      },
    ]);
  });

  it("ignores malformed, off-domain and duplicate records", () => {
    const unsafe = `${listing}
      <h2 class="vsr-job__title"><a href="https://example.org/vacancies/999/bad.html">Bad</a></h2>
      <div class="vsr-job__date-posted">Closing Date: 01/11/2026</div>
      <h2 class="vsr-job__title"><a href="https://[">Broken address</a></h2>
      <h2 class="vsr-job__title"><a href="971/researcher-wetland-bioscience.html">Duplicate</a></h2>
      <div class="vsr-job__date-posted">Closing Date: 31/02/2026</div>`;

    expect(parseWwtVacancies(unsafe)).toHaveLength(3);
  });

  it("accepts only the verified WWT search endpoint", () => {
    expect(isSupportedWwtSource("https://vacancies.wwt.org.uk/vacancies/vacancy-search-results.aspx")).toBe(
      true,
    );
    expect(isSupportedWwtSource("https://vacancies.wwt.org.uk/registration.aspx")).toBe(false);
    expect(isSupportedWwtSource("https://example.org/vacancies/vacancy-search-results.aspx")).toBe(false);
  });
});
