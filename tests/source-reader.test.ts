import { expect, it, vi } from "vitest";
import { readSource } from "../lib/source-reader";
import { sourceRobotsAllows, type SourceTransport } from "../lib/source-crawl";
import { postingCard } from "../lib/source-posting";
import { sourceCatalogue } from "../lib/source-catalogue";

const job = (id: string, extra = {}) => ({
  "@type": "JobPosting",
  identifier: id,
  title: "Ecologist",
  description:
    "Survey and restore woodland habitats. Work alongside volunteers to monitor protected wildlife.",
  url: `https://trust.example.org/jobs/${id}`,
  hiringOrganization: { name: "Nature Trust" },
  ...extra,
});
const jsonld = (value: unknown) => `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
function transport(pages: Record<string, string | Error>): SourceTransport {
  return vi.fn(async (url, _timeout, allow) => {
    if (!allow(new URL(url))) throw new Error("Outside scope");
    if (url.endsWith("/robots.txt"))
      return { body: Buffer.from("User-agent: *\nAllow: /"), contentType: "text/plain", url };
    const page = pages[url];
    if (page instanceof Error) throw page;
    if (page === undefined) throw new Error(`Unexpected URL ${url}`);
    return {
      body: Buffer.from(page),
      contentType: page.startsWith("[") || page.startsWith("{") ? "application/json" : "text/html",
      url,
    };
  });
}
it("normalises structured jobs without inventing employment facts or restarting undated hashes", () => {
  const posting = {
    url: "https://trust.example.org/jobs/1",
    title: "Ranger",
    description: "Manage a nature reserve and support volunteers.",
    organisation: "Nature Trust",
  };
  const first = postingCard(posting, new Date("2026-11-01"));
  expect(first).toMatchObject({
    workplace: "Not specified",
    hours_type: "Not specified",
    contract_type: "Not specified",
    engagement_type: "Not specified",
  });
  expect(postingCard(posting, new Date("2026-11-09")).feed_hash).toBe(first.feed_hash);
});
it("reads all structured listing pages before returning a complete snapshot", async () => {
  const read = transport({
    "https://trust.example.org/jobs": `<main>2 results</main>${jsonld(job("1"))}<a rel="next" href="/jobs?page=2">Next</a>`,
    "https://trust.example.org/jobs?page=2": `<main>1 result</main>${jsonld(job("2"))}`,
  });
  const result = await readSource({ url: "https://trust.example.org/jobs" }, { transport: read });
  expect(result.items).toHaveLength(2);
  expect(result.preview).toMatchObject({ count: 2, pages: 2, complete: true });
});
it("rejects partial pagination and repeated pages rather than returning a smaller replacement", async () => {
  const root = `<main>Jobs</main>${jsonld(job("1"))}<a rel="next" href="/jobs?page=2">Next</a>`;
  await expect(
    readSource(
      { url: "https://trust.example.org/jobs" },
      {
        transport: transport({
          "https://trust.example.org/jobs": root,
          "https://trust.example.org/jobs?page=2": new Error("Source HTTP 503"),
        }),
      },
    ),
  ).rejects.toThrow("503");
  await expect(
    readSource(
      { url: "https://trust.example.org/jobs" },
      {
        transport: transport({
          "https://trust.example.org/jobs": root,
          "https://trust.example.org/jobs?page=2": root,
        }),
      },
    ),
  ).rejects.toThrow("repeated");
});
it("accepts a verified empty page and rejects a JavaScript shell or a login challenge", async () => {
  const url = "https://trust.example.org/jobs";
  expect(
    (
      await readSource(
        { url },
        { transport: transport({ [url]: "<main>There are no open vacancies at this moment.</main>" }) },
      )
    ).preview.count,
  ).toBe(0);
  await expect(
    readSource(
      { url },
      { transport: transport({ [url]: "<main><h1>Careers</h1><div id='jobs'></div></main>" }) },
    ),
  ).rejects.toThrow("No complete vacancy list");
  await expect(
    readSource(
      { url },
      { transport: transport({ [url]: "<title>Just a moment</title><main>There are no vacancies</main>" }) },
    ),
  ).rejects.toThrow("challenge");
});
it("does not treat a general careers hub as an individual job", async () => {
  const url = "https://trust.example.org/careers";
  await expect(
    readSource(
      { url, config: { kind: "job" } },
      {
        transport: transport({
          [url]:
            "<main><h1>Careers</h1>Apply to join our team and enjoy our benefits. We work together to support wildlife and nature and protect reserves across the country.</main>",
        }),
      },
    ),
  ).rejects.toThrow("No verifiable individual");
});

it("uses an advert's main heading inside its content header and rejects navigation headings", async () => {
  const url = "https://trust.example.org/jobs/1";
  const description =
    "Apply to survey and restore woodland habitats. You will lead volunteer teams and work with partner organisations to protect local wildlife. Closing date: 20 November 2026.";
  const correct = await readSource(
    { url, config: { kind: "job", organisation: "Nature Trust" } },
    {
      transport: transport({
        [url]: `<main><h2>Filter your site experience by topic</h2><header><h1>Ecologist</h1></header><p>${description}</p></main>`,
      }),
    },
  );
  expect(correct.items[0].title).toBe("Ecologist");
  await expect(
    readSource(
      { url, config: { kind: "job" } },
      {
        transport: transport({
          [url]: `<main><h2>Filter Your Site Experience by Topic</h2><p>${description}</p></main>`,
        }),
      },
    ),
  ).rejects.toThrow("No verifiable individual");
});
it("follows explicitly configured advert links, preserves employer identity and excludes closed adverts", async () => {
  const result = await readSource(
    {
      url: "https://trust.example.org/jobs",
      config: { organisation: "Nature Trust", jobLinkSelector: "a.role" },
    },
    {
      transport: transport({
        "https://trust.example.org/jobs":
          '<main><a class="role" href="/roles/1">Ecologist</a><a class="role" href="/roles/2">Ranger</a></main>',
        "https://trust.example.org/roles/1": `<main><h1>Ecologist</h1></main>${jsonld(job("1"))}`,
        "https://trust.example.org/roles/2": "<main><h1>Ranger</h1>This position has been filled.</main>",
      }),
    },
  );
  expect(result.items).toHaveLength(1);
  expect(result.items[0].organisation_name).toBe("Nature Trust");
});
it("requires explicit scope for a linked recruitment host and checks crawl restrictions", async () => {
  const url = "https://trust.example.org/jobs";
  const read = transport({ [url]: '<main><a href="https://jobs.lever.co/trust">View jobs</a></main>' });
  await expect(readSource({ url, config: { kind: "html" } }, { transport: read })).rejects.toThrow(
    "hosted at",
  );
  const blocked: SourceTransport = async (target) => ({
    url: target,
    contentType: "text/plain",
    body: Buffer.from("User-agent: WildJobs\nDisallow: /jobs"),
  });
  await expect(readSource({ url }, { transport: blocked })).rejects.toThrow("robots.txt");
  expect(
    sourceRobotsAllows(
      "User-agent: *\nDisallow: /\nUser-agent: WildJobs\nAllow: /jobs\nDisallow: /jobs/private",
      new URL(url),
    ),
  ).toBe(true);
  expect(
    sourceRobotsAllows("User-agent: *\nDisallow: /jobs/*\nAllow: /jobs/public$", new URL(url + "/private")),
  ).toBe(false);
});
it("does not read EthicalJobs content without an agreed route", async () => {
  const read = vi.fn();
  await expect(
    readSource({ url: "https://www.ethicaljobs.com.au/members/acf" }, { transport: read }),
  ).rejects.toThrow("restricts redistribution");
  expect(read).not.toHaveBeenCalled();
});
it("reads Lever's published jobs through its public postings endpoint", async () => {
  const result = await readSource(
    { url: "https://jobs.lever.co/trust", config: { organisation: "Nature Trust" } },
    {
      transport: transport({
        "https://api.lever.co/v0/postings/trust?mode=json&limit=100&skip=0": JSON.stringify([
          {
            id: "123",
            text: "Ranger",
            hostedUrl: "https://jobs.lever.co/trust/123",
            descriptionPlain:
              "Manage a nature reserve and work alongside volunteers to restore native woodland.",
            categories: { location: "London", commitment: "Full-time" },
            createdAt: 1793534400000,
          },
        ]),
      }),
    },
  );
  expect(result.preview.kind).toBe("lever");
  expect(result.items[0]).toMatchObject({
    organisation_name: "Nature Trust",
    location_text: "London",
    hours_type: "Full time",
  });
});
it("keeps all 71 proposed sources with unique URLs and direct alternatives to EthicalJobs", () => {
  expect(sourceCatalogue).toHaveLength(71);
  expect(new Set(sourceCatalogue.map((source) => source.url)).size).toBe(71);
  expect(sourceCatalogue.some((source) => source.url.includes("ethicaljobs.com.au"))).toBe(false);
});

it("does not discover WordPress comments feeds as job sources", async () => {
  const url = "https://trust.example.org/careers";
  const result = await readSource(
    { url },
    {
      transport: transport({
        [url]:
          '<link rel="alternate" type="application/rss+xml" title="Comments on: Careers" href="/careers/feed"><main><p>There are no open vacancies.</p></main>',
      }),
    },
  );
  expect(result.preview.kind).toBe("html");
  await expect(
    readSource(
      { url: url + "/feed", config: { kind: "rss" } },
      {
        transport: transport({
          [url + "/feed"]: "<rss><channel><title>Comments on: Careers</title></channel></rss>",
        }),
      },
    ),
  ).rejects.toThrow("comments feed");
});

it("reads Workday's public search pages when subsequent totals use its zero sentinel", async () => {
  const origin = "https://trust.wd1.myworkdayjobs.com",
    endpoint = origin + "/wday/cxs/trust/External";
  const entries = Array.from({ length: 21 }, (_, index) => ({
    title: `Ranger ${index}`,
    externalPath: `/job/London/Ranger_JR${index}`,
  }));
  const pages = Object.fromEntries(
    entries.map((entry, index) => [
      endpoint + entry.externalPath,
      JSON.stringify({
        jobPostingInfo: {
          title: entry.title,
          jobReqId: `JR${index}`,
          jobDescription: "Manage woodland and work with volunteer teams to restore native habitats.",
          location: "London",
          timeType: "Full time",
          startDate: "2026-11-01",
        },
      }),
    ]),
  );
  const fallback = transport(pages);
  const read: SourceTransport = async (url, timeout, allow, request) => {
    if (request) {
      expect(request.method).toBe("POST");
      const offset = JSON.parse(request.method === "POST" ? request.body : "{}").offset;
      return {
        url,
        contentType: "application/json",
        body: Buffer.from(
          JSON.stringify({ total: offset === 0 ? 21 : 0, jobPostings: entries.slice(offset, offset + 20) }),
        ),
      };
    }
    return fallback(url, timeout, allow);
  };
  const result = await readSource(
    { url: origin + "/External", config: { organisation: "Nature Trust" } },
    { transport: read },
  );
  expect(result.preview).toMatchObject({ kind: "workday", count: 21, complete: true });
});

it("excludes the iCIMS welcome page and recognises an unfiltered empty search", async () => {
  const endpoint = "https://trust.icims.com/jobs/search?ss=1&in_iframe=1";
  const result = await readSource(
    { url: "https://trust.icims.com/jobs/search" },
    {
      transport: transport({
        [endpoint]:
          '<main><a href="/jobs/intro">Welcome page</a><p>Sorry, no jobs were found that match your search criteria.</p></main>',
      }),
    },
  );
  expect(result.items).toHaveLength(0);
});

it("extracts a dated vacancy PDF and rejects an undated document", async () => {
  function pdf(lines: string[]) {
    const stream = `BT /F1 12 Tf 40 750 Td ${lines.map((line, index) => `${index ? "0 -18 Td " : ""}(${line.replace(/[()\\]/g, "\\$&")}) Tj`).join("\n")} ET`;
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    ];
    let body = "%PDF-1.4\n";
    const offsets = [0];
    for (let index = 0; index < objects.length; index++) {
      offsets.push(Buffer.byteLength(body));
      body += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    }
    const xref = Buffer.byteLength(body);
    body += `xref\n0 6\n0000000000 65535 f \n${offsets
      .slice(1)
      .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
      .join("")}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(body);
  }
  const base = "https://trust.example.org/jobs",
    target = "https://trust.example.org/ranger.pdf";
  const run = (dated: boolean) =>
    readSource(
      { url: base, config: { organisation: "Nature Trust" } },
      {
        transport: async (url, timeout, allow) => {
          if (url === target)
            return {
              url,
              contentType: "application/pdf",
              body: pdf([
                "Ranger",
                "Job description: Manage woodland and protect wildlife habitats.",
                "Support volunteers and monitor species across our nature reserves.",
                "Apply with your CV and a covering letter.",
                ...(dated ? ["Closing date: 20 November 2026"] : []),
              ]),
            };
          return transport({ [base]: '<main><a href="/ranger.pdf">Ranger job description</a></main>' })(
            url,
            timeout,
            allow,
          );
        },
      },
    );
  expect((await run(true)).items[0]).toMatchObject({
    title: "Ranger",
    closes_at: "2026-11-20T23:59:59.999Z",
  });
  await expect(run(false)).rejects.toThrow("no verifiable closing date");
});
