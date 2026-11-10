import { expect, it, vi } from "vitest";
import { canonicalUrl, publicUrl } from "../lib/directory-url";
import { readSource } from "../lib/source-reader";
import { britishRecruitmentDate, structuredPosting } from "../lib/source-posting";
import type { SourceTransport } from "../lib/source-crawl";
const text =
  "Survey woodland habitats and lead local conservation work. Apply with your CV and a covering letter before the advertised deadline.";
function transport(pages: Record<string, unknown>): SourceTransport {
  return vi.fn(async (url, _timeout, allow) => {
    if (!allow(new URL(url))) throw Error("Outside scope");
    if (url.endsWith("/robots.txt"))
      return { url, body: Buffer.from("User-agent: *\nAllow: /"), contentType: "text/plain" };
    const p = pages[url];
    if (p instanceof Error) throw p;
    if (p === undefined) throw Error("Unexpected URL " + url);
    return {
      url,
      body: Buffer.from(typeof p === "string" ? p : JSON.stringify(p)),
      contentType: typeof p === "string" ? "text/html" : "application/json",
    };
  });
}
it("reads complete iTrent adverts without retaining anonymous session parameters", async () => {
  const url = "https://trust.webitrent.com/wrd/run/ETREC106GF.display_srch_all?WVID=public";
  const html = `<main>Results - 1 match found<table><tr><td><h2><a class="job-result-title" href="ETREC107GF.open?VACANCY_ID%3d123Ab%1BUSESSION=temporary&WVID=public">Conservation Officer</a></h2></td></tr><tr><td>${text} Application closing date: 24/11/2026</td></tr></table></main>`;
  const r = await readSource(
    { url, config: { organisation: "Nature Trust" } },
    { transport: transport({ [url]: html }) },
  );
  expect(r.items[0]).toMatchObject({ title: "Conservation Officer", closes_at: "2026-11-24T23:59:59.999Z" });
  expect(r.items[0].source_url).toBe(
    "https://trust.webitrent.com/wrd/run/ETREC107GF.open?VACANCY_ID=123Ab&WVID=public&LANG=USA",
  );
  expect(JSON.stringify(r)).not.toContain("temporary");
  await expect(
    readSource({ url }, { transport: transport({ [url]: html.replace("1 match", "2 matches") }) }),
  ).rejects.toThrow("pagination");
});
it("preserves explicit British board dates and refuses impossible calendar dates", () => {
  expect(britishRecruitmentDate("15/11/2026 00:00:00")).toBe("2026-11-15T23:59:59.999Z");
  expect(britishRecruitmentDate("31/02/2026")).toBeUndefined();
  const p = structuredPosting(
    {
      "@type": "JobPosting",
      title: "Head of External Affairs",
      description: "&quot;" + text + "&quot;",
      datePosted: "04/11/2026 11:36:13",
      validThrough: "15/11/2026 00:00:00",
      hiringOrganization: { name: "&quot;Marine Conservation Society&quot;" },
    },
    "https://jobs.mcsuk.org/MarineConservationSociety/JobDescription/example",
    "Marine Conservation Society",
  );
  expect(p).toMatchObject({
    organisation: "Marine Conservation Society",
    postedAt: "2026-11-04T23:59:59.999Z",
    closesAt: "2026-11-15T23:59:59.999Z",
  });
  expect(p.description).not.toContain("&quot;");
});
const companyId = "11111111-2222-3333-4444-555555555555";
const publicJob = {
  id: "vacancy-1",
  company_id: companyId,
  job_number: "36",
  title: "Conservation Officer",
  description: [{ title: "Role", description: text }],
  location: "Salisbury",
  salary: "£30,000 per annum",
  closing_date: "2026-11-24T12:00:00.000Z",
  job_type: "Full time",
  contract_type: "Permanent",
  visibility: "public",
  status: "Active",
  published_flag: true,
  published_to: { website: { published: true, last_published_date: "2026-11-01T10:00:00.000Z" } },
  internal_notes: "private workflow notes",
  recruiter: { email: "private@example.invalid" },
};
it("imports only published website jobs from the correct LiveVacancies employer and retains no workflow fields", async () => {
  const url = "https://trust.livevacancies.co.uk/";
  const read = transport({
    [url]: "<main>Careers</main>",
    [url + "getcompanydetails"]: { settings: { company_id: companyId } },
    "https://api.core-easywebats.com/v1/job/all": [
      publicJob,
      { ...publicJob, id: "internal-2", visibility: "internal" },
    ],
  });
  const r = await readSource({ url, config: { organisation: "Nature Trust" } }, { transport: read });
  expect(r.items).toHaveLength(1);
  expect(r.items[0]).toMatchObject({
    source_url: url + "#/job/details/36",
    organisation_name: "Nature Trust",
    closes_at: publicJob.closing_date,
  });
  expect(JSON.stringify(r)).not.toContain("private");
  expect(read).toHaveBeenCalledWith(
    "https://api.core-easywebats.com/v1/job/all",
    expect.any(Number),
    expect.any(Function),
    { method: "GET", companyId },
  );
});
it("preserves the previous snapshot when a public advert is malformed or an employer identifier changes", async () => {
  const url = "https://trust.livevacancies.co.uk/";
  for (const entry of [
    { ...publicJob, description: [] },
    { ...publicJob, company_id: "another-employer" },
  ])
    await expect(
      readSource(
        { url },
        {
          transport: transport({
            [url]: "<main>Careers</main>",
            [url + "getcompanydetails"]: { settings: { company_id: companyId } },
            "https://api.core-easywebats.com/v1/job/all": [entry],
          }),
        },
      ),
    ).rejects.toThrow(/required content|another employer/);
});
it("reads every regional vacancy page and fails closed when one region is unavailable", async () => {
  const url = "https://www.nts.org.uk/volunteering-jobs/job-search";
  const region = url + "/north";
  const pages = {
    [url]: `<a href="${region}">North</a>`,
    [region]: `<h1>North</h1><div class="image-text-block__text"><h3>Gardener</h3><p>Closing date: 24 November 2026</p><p>${text}</p><a href="https://documents.example.org/gardener.docx">Download the job description</a></div>`,
  };
  const r = await readSource(
    { url, config: { organisation: "National Trust for Scotland" } },
    { transport: transport(pages) },
  );
  expect(r.items[0]).toMatchObject({
    title: "Gardener",
    location_text: "North",
    source_url: region,
    country_code: "GB",
  });
  await expect(
    readSource({ url }, { transport: transport({ ...pages, [region]: new Error("Source HTTP 503") }) }),
  ).rejects.toThrow("503");
});
it("retains ELMO job headings and dates and excludes talent pools from a vacancy list", async () => {
  const url = "https://trust.elmotalent.com.au/careers/external/jobs",
    job = "https://trust.elmotalent.com.au/careers/external/job/view/1";
  const r = await readSource(
    {
      url,
      config: {
        kind: "html",
        organisation: "Nature Trust",
        jobLinkSelector: 'a[href*="/job/view/"]',
        descriptionSelector: ".portal_content",
      },
    },
    {
      transport: transport({
        [url]: `<a href="${job}">Wildlife Ecologist</a><a href="/careers/external/job/view/2">Expressions of Interest</a>`,
        [job]: `<div class="portal_content"><h3 class="job-ad-title">Wildlife Ecologist</h3><p>Posted: 15/10/2026 Closing Date: 24/11/2026</p><p>${text}</p></div>`,
      }),
    },
  );
  expect(r.items).toHaveLength(1);
  expect(r.items[0]).toMatchObject({
    title: "Wildlife Ecologist",
    posted_at: "2026-10-15T00:00:00.000Z",
    closes_at: "2026-11-24T23:59:59.999Z",
  });
});

it("keeps only documented numeric application fragments without changing network URL validation", () => {
  const a = "https://trust.livevacancies.co.uk/#/job/details/36";
  expect(publicUrl(a).hash).toBe("");
  expect(canonicalUrl(a)).not.toBe(canonicalUrl(a.replace("36", "37")));
  expect(canonicalUrl("https://trust.livevacancies.co.uk/#/admin")).toBe(
    "https://trust.livevacancies.co.uk/",
  );
});
it("reads every Pinpoint posting, respects hidden pay, and preserves explicit currencies", async () => {
  const url = "https://careers.example.org/postings.json";
  const p = {
    id: "a",
    title: "Lawyer",
    description: text,
    url: "https://careers.example.org/en/postings/a",
    location: { name: "Tokyo" },
    deadline_at: "2026-11-24T23:59:59Z",
    compensation: "¥13,000,000 - ¥15,000,000 / year",
    compensation_currency: "JPY",
    compensation_visible: true,
  };
  const r = await readSource(
    { url, config: { organisation: "Nature Trust" } },
    {
      transport: transport({
        [url]: { data: [p, { ...p, id: "b", url: p.url + "b", compensation_visible: false }] },
      }),
    },
  );
  expect(r.items).toHaveLength(2);
  expect(r.items[0].salary_text).toContain("JPY");
  expect(r.items[1].salary_text).toBe("Not stated");
});
it("reads full inline HTML adverts and fails closed if their application instructions disappear", async () => {
  const url = "https://www.bornfree.org.uk/careers/";
  const html = `<div class="article"><div class="content"><h2>CURRENT VACANCIES</h2><h3>Conservation Manager</h3><p>${text}</p><p>Applications with a cover letter should be sent to the recruitment team by 14th November 2026. Interviews are on 20th November.</p></div></div>`;
  const r = await readSource(
    { url, config: { organisation: "Born Free" } },
    { transport: transport({ [url]: html }) },
  );
  expect(r.items[0]).toMatchObject({ title: "Conservation Manager", closes_at: "2026-11-14T23:59:59.999Z" });
  await expect(
    readSource(
      { url },
      {
        transport: transport({
          [url]:
            '<div class="article"><div class="content"><h3>Conservation Manager</h3><p>More details coming soon.</p></div></div>',
        }),
      },
    ),
  ).rejects.toThrow("inline vacancy");
});
it("does not mark a partly exposed paginated vacancy widget as complete", async () => {
  const url = "https://trust.example.org/jobs";
  const html = `<main><div class="wpv-view-output"><div data-pagination='{"max_pages":2}'><a href="/jobs/1">Ecologist</a></div></div></main>`;
  await expect(
    readSource(
      { url, config: { listingSelector: ".wpv-view-output", jobLinkSelector: "a[href]" } },
      { transport: transport({ [url]: html }) },
    ),
  ).rejects.toThrow("pagination");
});
it("uses OEP deadlines to exclude archived roles and preserves UK winter and summer closing times", async () => {
  const url = "https://www.theoep.org.uk/work-us-job-vacancies";
  for (const [date, expected] of [
    ["Wednesday 28th October 2026", "2026-10-28T23:55:00.000Z"],
    ["Friday 24th July 2026", "2026-07-24T22:55:00.000Z"],
  ]) {
    const html = `<main><div class="textarea"><h1>Our current vacancies:</h1><p><strong>Voluntary role: Independent Committee Member</strong><br>Office for Environmental Protection<br>Salary: £0 - volunteer role<br>Closes: 11:55 pm on ${date}</p><p><a href="https://www.civilservicejobs.service.gov.uk/">More information</a></p></div></main>`;
    const r = await readSource(
      { url, config: { organisation: "Office for Environmental Protection" } },
      { transport: transport({ [url]: html }), now: new Date("2026-11-10T12:00:00Z") },
    );
    expect(r.preview.liveCount).toBe(0);
    expect(r.items[0]).toMatchObject({ closes_at: expected, engagement_type: "Volunteer" });
  }
});

it("distinguishes open application wording from a closed advert", async () => {
  const url = "https://trust.example.org/jobs/1";
  for (const [status, count] of [
    ["Applications are now being accepted", 1],
    ["Applications are no longer being accepted", 0],
  ] as const) {
    const html = `<main><h1>Ecologist</h1><p>${status}. ${text}</p></main>`;
    expect(
      (await readSource({ url, config: { kind: "job" } }, { transport: transport({ [url]: html }) })).preview
        .count,
    ).toBe(count);
  }
});
