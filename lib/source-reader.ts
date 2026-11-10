import { readRecruitmentAdapter, talentPool } from "./source-adapters";
import { XMLParser } from "fast-xml-parser";
import { parseSourceFeed, type FeedCard } from "./directory-sources";
import { publicUrl, canonicalUrl } from "./directory-url";
import { plainText } from "./directory-text";
import { closingDate, directoryDeadline } from "./directory-lifecycle";
import { createHash } from "node:crypto";
import { sourceConfigSchema, SourceReadError, type SourceInput, type SourcePreview } from "./source-config";
import { sourceCrawler, type SourceTransport } from "./source-crawl";
import type { PublicSourceRequest } from "./directory-http";
import {
  advertPosting,
  assignedJson,
  closedAdvert,
  emptyVacancies,
  jobObjects,
  postingCard,
  sourceDocument,
  structuredPosting,
  visibleSource,
  type Posting,
} from "./source-posting";

type RecordValue = Record<string, unknown>;
const record = (v: unknown): RecordValue =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as RecordValue) : {};
const list = (v: unknown): unknown[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const value = (v: unknown): string => (typeof v === "string" || typeof v === "number" ? String(v) : "");
const sourceHosts =
  /(?:smartrecruiters\.com|teamtailor\.com|icims\.com|jobs\.lever\.co|ats\.rippling\.com|simplify\.hr|catsone\.com|myworkdayjobs\.com|occupop-careers\.com|elmotalent\.com\.au|employmenthero\.com|applynow\.net\.au|webitrent\.com|ultipro\.com|jobvite\.com|paylocity\.com|saashr\.com|peoplestreme\.net|pinpointhq\.com|livevacancies\.co\.uk|webrecruit\.co|webrecruitjobs\.com|hireroadrecruit\.com|postingpanda\.uk|brassring\.com)$/;

export async function readSource(
  input: SourceInput,
  options: {
    transport?: SourceTransport;
    now?: Date;
    organisationNames?: readonly string[];
    discoveryDepth?: number;
    deadline?: number;
  } = {},
) {
  if ((options.discoveryDepth || 0) > 3)
    throw new SourceReadError("unsupported", "The careers links form a loop or need a dedicated connector.");
  const config = sourceConfigSchema.parse(input.config || {});
  const url = publicUrl(input.url).toString();
  const start = new URL(url);
  // Six regional pages require over a minute under the publisher's 10-second delay.
  const budget = start.hostname.replace(/^www\./, "") === "nts.org.uk" ? 85000 : 55000;
  options = { ...options, deadline: options.deadline || Date.now() + budget };
  const pageLink = (href: string, base: string) => {
    const target = publicUrl(href, base),
      parent = new URL(base);
    if (
      target.protocol === "http:" &&
      parent.protocol === "https:" &&
      (target.hostname.replace(/^www\./, "") === parent.hostname.replace(/^www\./, "") ||
        sourceHosts.test(target.hostname))
    )
      target.protocol = "https:";
    return target;
  };
  if (/(?:^|\.)ethicaljobs\.com\.au$/.test(start.hostname))
    throw new SourceReadError(
      "permission",
      "EthicalJobs restricts redistribution. Use the employer's own careers page or an agreed feed.",
    );
  if (config.kind === "manual") {
    if (!config.manual || !config.organisation)
      throw new SourceReadError(
        "unsupported",
        "A manual advert needs an employer, title, description and closing date.",
      );
    return finish(
      [
        postingCard(
          { url, organisation: config.organisation, ...config.manual, postedAt: undefined },
          options.now,
        ),
      ],
      "manual",
      url,
      0,
    );
  }
  let kind: string = config.kind;
  let endpoint = url;
  const origins = [start.origin, ...config.allowedOrigins];
  if (config.kind === "smartrecruiters" || start.hostname === "careers.smartrecruiters.com") {
    const company = start.pathname.split("/").filter(Boolean)[0];
    if (!company || !/^[\w-]+$/.test(company))
      throw new SourceReadError("unsupported", "Use the company's SmartRecruiters careers URL.");
    endpoint = `https://api.smartrecruiters.com/v1/companies/${company}/postings?limit=100&offset=0`;
    origins.push("https://api.smartrecruiters.com");
    kind = "smartrecruiters";
  } else if (config.kind === "lever" || start.hostname === "jobs.lever.co") {
    const company = start.pathname.split("/").filter(Boolean)[0];
    if (!company || !/^[\w-]+$/.test(company))
      throw new SourceReadError("unsupported", "Use the company's Lever careers URL.");
    endpoint = `https://api.lever.co/v0/postings/${company}?mode=json&limit=100&skip=0`;
    origins.push("https://api.lever.co");
    kind = "lever";
  } else if (start.hostname.endsWith("teamtailor.com") && !start.pathname.endsWith(".rss")) {
    endpoint = start.origin + "/jobs.rss";
    kind = "rss";
  } else if (config.kind === "icims" || start.hostname.endsWith(".icims.com")) {
    const target = new URL("/jobs/search", start.origin);
    target.search = "ss=1&in_iframe=1";
    endpoint = target.toString();
    kind = "icims";
  }
  if (start.hostname.endsWith(".livevacancies.co.uk")) origins.push("https://api.core-easywebats.com");
  const crawler = sourceCrawler(origins, options.transport, options.deadline);
  let pages = 0;
  const read = async (next: string, request?: PublicSourceRequest) => {
    pages++;
    return crawler.read(next, request);
  };
  if (start.hostname.endsWith(".myworkdayjobs.com")) {
    const tenant = start.hostname.split(".")[0];
    const segments = start.pathname
      .split("/")
      .filter(Boolean)
      .filter((s) => !/^[a-z]{2}-[a-z]{2}$/i.test(s));
    const site = segments[0];
    if (!tenant || !site || !/^[\w-]+$/.test(site))
      throw new SourceReadError("unsupported", "Use the employer's Workday careers board URL.");
    const base = `${start.origin}/wday/cxs/${tenant}/${site}`;
    const jobs: FeedCard[] = [];
    let total: number | undefined;
    for (let offset = 0; offset < 1000; offset += 20) {
      const listing = record(
        JSON.parse(
          (
            await read(base + "/jobs", {
              method: "POST",
              body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: "" }),
            })
          ).text,
        ),
      );
      if (!Array.isArray(listing.jobPostings) || !Number.isSafeInteger(listing.total))
        throw new SourceReadError("incomplete", "Workday returned an unexpected vacancy response.");
      // Workday returns total=0 on later pages even while returning jobs.
      if (total !== undefined && Number(listing.total) > 0 && total !== listing.total)
        throw new SourceReadError(
          "incomplete",
          "Workday vacancies changed during pagination; retry the complete import.",
        );
      total ??= Number(listing.total);
      const entries = listing.jobPostings as RecordValue[];
      if (!entries.length && offset < total)
        throw new SourceReadError("incomplete", "Workday ended its results before all vacancies were read.");
      for (let index = 0; index < entries.length; index += 4) {
        const batch = await Promise.all(
          entries.slice(index, index + 4).map(async (entry) => {
            const path = value(entry.externalPath);
            if (!path.startsWith("/job/"))
              throw new SourceReadError("incomplete", "Workday returned an unexpected advert path.");
            const detail = record(JSON.parse((await read(base + path)).text));
            const info = record(detail.jobPostingInfo);
            if (!value(info.title) || !value(info.jobDescription))
              throw new SourceReadError("incomplete", "A Workday advert could not be read in full.");
            return postingCard(
              {
                id: value(info.jobReqId) || path,
                url: `${start.origin}/${site}${path}`,
                title: value(info.title),
                description: plainText(value(info.jobDescription)),
                organisation: config.organisation,
                location: [info.location, ...list(info.additionalLocations)].filter(Boolean).join(" · "),
                employmentType: value(info.timeType) + " " + value(info.workerSubType),
                postedAt: value(info.startDate),
                closesAt: value(info.endDate) || null,
                remote: value(info.remoteType),
              },
              options.now,
            );
          }),
        );
        jobs.push(...batch);
      }
      if (offset + entries.length >= total) return finish(jobs, "workday", url, pages);
    }
    throw new SourceReadError("incomplete", "This Workday board exceeds the import budget.");
  }
  let first = await read(endpoint);
  const adapter = await readRecruitmentAdapter({
    first,
    read,
    organisation: config.organisation,
    now: options.now,
  });
  if (adapter) return finish(adapter.items, adapter.kind, adapter.url, pages);
  if (start.hostname.endsWith(".simplify.hr") && /companyVacanciesResultsContainer/.test(first.text)) {
    first = await read(new URL("/vacancy/vacancies?query=&displayOrder=4", start.origin).toString());
    kind = "simplify";
  }
  if (kind === "smartrecruiters") {
    const jobs: FeedCard[] = [];
    let page = first;
    let offset = 0;
    let expectedTotal: number | undefined;
    for (let batch = 0; batch < 30; batch++) {
      const data = record(JSON.parse(page.text));
      if (!Array.isArray(data.content) || !Number.isSafeInteger(data.totalFound))
        throw new SourceReadError("incomplete", "SmartRecruiters returned an unexpected listing response.");
      const total = Number(data.totalFound);
      if (expectedTotal !== undefined && expectedTotal !== total)
        throw new SourceReadError(
          "incomplete",
          "Vacancies changed during pagination. Retry to obtain a complete snapshot.",
        );
      expectedTotal = total;
      const entries = data.content as RecordValue[];
      if (!entries.length && offset < total)
        throw new SourceReadError(
          "incomplete",
          "SmartRecruiters pagination ended before all vacancies were received.",
        );
      for (const entry of entries) {
        const detailUrl = publicUrl(value(entry.ref), endpoint);
        if (detailUrl.origin !== "https://api.smartrecruiters.com")
          throw new SourceReadError("incomplete", "Unexpected SmartRecruiters detail URL.");
        const detail = record(JSON.parse((await read(detailUrl.toString())).text));
        const sections = record(detail.jobAd).sections;
        const description = Object.values(record(sections))
          .map((s) => value(record(s).text))
          .join(" ");
        const location = record(detail.location),
          company = record(detail.company);
        const posting: Posting = {
          id: value(entry.id),
          url: value(detail.applyUrl) || value(detail.postingUrl),
          title: value(detail.name),
          description,
          organisation: value(company.name) || config.organisation,
          location: [location.city, location.region, location.country].filter(Boolean).join(", "),
          country: value(location.country).toUpperCase(),
          postedAt: value(detail.releasedDate),
          employmentType: value(record(detail.typeOfEmployment).label),
          remote: location.remote === true ? "Remote" : "",
        };
        if (!posting.url || !posting.title || description.length < 40)
          throw new SourceReadError(
            "incomplete",
            "A SmartRecruiters vacancy is missing its public URL or advert content.",
          );
        jobs.push(postingCard(posting, options.now));
      }
      offset += entries.length;
      if (offset >= total) return finish(jobs, kind, endpoint, pages);
      const next = new URL(endpoint);
      next.searchParams.set("offset", String(offset));
      page = await read(next.toString());
    }
    throw new SourceReadError("incomplete", "SmartRecruiters exceeded the pagination budget.");
  }
  if (kind === "lever") {
    const jobs: FeedCard[] = [];
    let page = first;
    for (let skip = 0; skip < 3000; skip += 100) {
      const data: unknown = JSON.parse(page.text);
      if (!Array.isArray(data))
        throw new SourceReadError("incomplete", "Lever returned an unexpected listing response.");
      for (const raw of data) {
        const entry = record(raw),
          categories = record(entry.categories);
        const description = [
          value(entry.descriptionPlain) || plainText(value(entry.description)),
          ...list(entry.lists).map((l) => value(record(l).text) + " " + plainText(value(record(l).content))),
          value(entry.additionalPlain),
        ].join(" ");
        if (!value(entry.id) || !value(entry.text) || !value(entry.hostedUrl) || description.length < 40)
          throw new SourceReadError("incomplete", "A Lever vacancy is missing its public advert.");
        jobs.push(
          postingCard(
            {
              id: value(entry.id),
              url: value(entry.hostedUrl),
              title: value(entry.text),
              description,
              organisation: config.organisation,
              location: value(categories.location),
              employmentType: value(categories.commitment),
              remote: value(entry.workplaceType),
              postedAt:
                typeof entry.createdAt === "number" ? new Date(entry.createdAt).toISOString() : undefined,
            },
            options.now,
          ),
        );
      }
      if (data.length < 100) return finish(jobs, kind, endpoint, pages);
      const next = new URL(endpoint);
      next.searchParams.set("skip", String(skip + 100));
      page = await read(next.toString());
    }
    throw new SourceReadError("incomplete", "Lever exceeded the pagination budget.");
  }
  if (/^\s*(?:<\?xml[^>]*>\s*)?<(?:rss|feed|rdf:RDF)\b/i.test(first.text)) {
    const jobs: FeedCard[] = [];
    const seen = new Set<string>();
    let page = first;
    for (let batch = 0; batch < 30; batch++) {
      const parsed = parseSourceFeed(page.text, page.url, options.now, options.organisationNames);
      if (/^comments\b|comments on:/i.test(parsed.name))
        throw new SourceReadError(
          "unsupported",
          "This is a comments feed, not a vacancy feed. Use the careers page or its job-specific feed.",
        );
      if (parsed.items.some((job) => seen.has(job.feed_id)))
        throw new SourceReadError(
          "incomplete",
          "The feed repeated a page. Its previous snapshot has been preserved.",
        );
      for (const card of parsed.items) {
        seen.add(card.feed_id);
        if (card.organisation_name === "Organisation not stated" && config.organisation) {
          card.organisation_name = config.organisation;
          card.feed_hash = createHash("sha256")
            .update(card.feed_hash + config.organisation)
            .digest("hex");
        }
        if (/xmlns:tt=/.test(page.text)) {
          const facts = postingCard(
            {
              url: card.source_url,
              title: card.title,
              description: card.feed_text,
              salary: card.salary_text,
            },
            options.now,
          );
          card.hours_type = facts.hours_type;
          card.contract_type = facts.contract_type;
          card.workplace = facts.workplace;
          card.engagement_type = facts.engagement_type;
        }
        jobs.push(card);
      }
      const xml = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true }).parse(page.text);
      const channel = record(xml.feed || record(xml.rss).channel);
      const nextLink = list(channel.link)
        .map(record)
        .find((l) => l["@_rel"] === "next");
      let next = value(nextLink?.["@_href"]);
      if (!next && /xmlns:tt=/.test(page.text) && parsed.items.length >= 100) {
        const target = new URL(page.url);
        target.searchParams.set("offset", String(jobs.length));
        next = target.toString();
      }
      if (!next) return finish(jobs, "rss", first.url, pages, parsed.name);
      page = await read(publicUrl(next, page.url).toString());
    }
    throw new SourceReadError("incomplete", "The feed exceeded the pagination budget.");
  }
  if (config.kind === "rss")
    throw new SourceReadError("unsupported", "The source did not return an RSS or Atom feed.");
  if (/application\/pdf/i.test(first.contentType))
    throw new SourceReadError(
      "unsupported",
      "Save a vacancy listing page linking to this PDF, or use the manual advert form with a confirmed closing date.",
    );

  const document = sourceDocument(first.text);
  if (config.kind === "auto") {
    const feed = [...document.querySelectorAll('link[rel="alternate"]')].find(
      (link) =>
        /rss|atom/i.test(link.getAttribute("type") || "") &&
        !/comments|commentaire|comentarios/i.test(link.getAttribute("title") || "") &&
        /job|vacan|career/i.test(link.getAttribute("title") || ""),
    );
    if (feed?.getAttribute("href"))
      return readSource(
        {
          ...input,
          url: publicUrl(feed.getAttribute("href")!, first.url).toString(),
          config: { ...config, kind: "rss" },
        },
        { ...options, discoveryDepth: (options.discoveryDepth || 0) + 1 },
      );
    if (/teamtailor/i.test(first.text) && !first.url.endsWith(".rss"))
      return readSource(
        { ...input, url: new URL("/jobs.rss", first.url).toString(), config: { ...config, kind: "rss" } },
        { ...options, discoveryDepth: (options.discoveryDepth || 0) + 1 },
      );
    const recruitment = new Map<string, string>();
    for (const frame of document.querySelectorAll("iframe[src]")) {
      try {
        const target = publicUrl(frame.getAttribute("src")!, first.url);
        if (sourceHosts.test(target.hostname))
          recruitment.set(canonicalUrl(target.toString()), target.toString());
      } catch {
        /* Ignore unrelated frames. */
      }
    }
    for (const anchor of document.querySelectorAll("a[href]")) {
      try {
        const target = pageLink(anchor.getAttribute("href")!, first.url);
        const label = plainText(anchor.innerHTML);
        if (
          target.origin !== new URL(first.url).origin &&
          sourceHosts.test(target.hostname) &&
          /(?:current|open|search|browse|view|explore|list|employee|apply|job|vacan|opportun|position|role)/i.test(
            label,
          ) &&
          !/internship|volunteer|request for|proposal|tender|notification|alert/i.test(label)
        )
          recruitment.set(canonicalUrl(target.toString()), target.toString());
      } catch {
        /* Ignore non-web links. */
      }
    }
    if (recruitment.size === 1)
      return readSource(
        {
          ...input,
          url: [...recruitment.values()][0],
          config: { ...config, allowedOrigins: [...new Set([...config.allowedOrigins, start.origin])] },
        },
        { ...options, discoveryDepth: (options.discoveryDepth || 0) + 1 },
      );
  }
  if (config.kind === "job") {
    const posting = advertPosting(first.text, first.url, config.organisation, config.descriptionSelector);
    if (!posting && !closedAdvert.test(visibleSource(first.text).text))
      throw new SourceReadError("unsupported", "No verifiable individual job advert was found at this URL.");
    return finish(posting ? [postingCard(posting, options.now)] : [], "job", first.url, pages);
  }

  const jobs = new Map<string, FeedCard>();
  const details = new Map<string, string>();
  const hints = new Map<string, { location?: string; closesAt?: string | null }>();
  const visited = new Set<string>();
  let page = first;
  let confirmedEmpty = false;
  for (let batch = 0; batch < 25; batch++) {
    if (visited.has(page.url)) throw new SourceReadError("incomplete", "The vacancy list repeated a page.");
    visited.add(page.url);
    const { document: dom, content, text } = visibleSource(page.text, config.listingSelector);
    if (!content) throw new SourceReadError("incomplete", "The configured vacancy section was not found.");
    const objects = jobObjects(page.text);
    const phenom = record(assignedJson(page.text, "phApp.ddo =")?.eagerLoadRefineSearch);
    if (phenom.status === 200) {
      const entries = record(phenom.data).jobs;
      if (!Array.isArray(entries) || !Number.isSafeInteger(phenom.totalHits))
        throw new SourceReadError("incomplete", "The careers portal returned an unexpected vacancy list.");
      for (const raw of entries) {
        const entry = record(raw),
          id = value(entry.jobSeqNo),
          title = value(entry.title);
        if (!id || !title)
          throw new SourceReadError(
            "incomplete",
            "The careers portal returned an incomplete job identifier.",
          );
        const path =
          new URL(page.url).pathname.replace(/search-results\/?$/, "job/") +
          encodeURIComponent(id) +
          "/" +
          encodeURIComponent(title.replace(/[^\p{L}\p{N}]+/gu, "-"));
        const target = new URL(path, page.url).toString();
        details.set(canonicalUrl(target), target);
      }
      if (phenom.totalHits === 0) confirmedEmpty = true;
    }
    for (const object of objects) {
      const posting = structuredPosting(object, page.url, config.organisation);
      if (!posting.title || posting.description.length < 40 || (!object.url && objects.length > 1))
        throw new SourceReadError(
          "incomplete",
          "A structured vacancy is missing its title, description or individual URL.",
        );
      const job = postingCard(posting, options.now);
      jobs.set(job.feed_id, job);
    }
    const anchors = config.jobLinkSelector
      ? [...content.querySelectorAll(config.jobLinkSelector)]
      : [...content.querySelectorAll("a[href]")];
    for (const anchor of anchors) {
      const href = anchor.getAttribute("href");
      if (!href) continue;
      let candidate: URL;
      try {
        candidate = pageLink(href, page.url);
      } catch {
        continue;
      }
      const label = plainText(anchor.innerHTML);
      const key = canonicalUrl(candidate.toString());
      if (talentPool(label)) continue;
      if (
        key === canonicalUrl(page.url) ||
        /(?:privacy|login|register|sign-in|alerts|benefits|application-process|how-to-apply|volunteer|scholarship|tenders?|procurement)/i.test(
          candidate.pathname,
        )
      )
        continue;
      if (
        candidate.origin !== new URL(page.url).origin &&
        !config.allowedOrigins.some((origin) => new URL(origin).origin === candidate.origin)
      ) {
        if (sourceHosts.test(candidate.hostname) && /job|vacan|opportun|position|apply/i.test(label))
          throw new SourceReadError(
            "unsupported",
            `Vacancies are hosted at ${candidate.origin}. Save that recruitment URL or explicitly allow it in source settings.`,
          );
        continue;
      }
      const detailPath =
        kind === "icims"
          ? /^\/jobs\/\d+\/[^/]+\/job\/?$/i.test(candidate.pathname)
          : /\/(?:jobs?|vacancies|vacancy|careers?|employment|opportunities)\/(?!search(?:\/|$)|page\/|category\/|intro(?:\/|$))[^/?#]+/i.test(
              candidate.pathname,
            ) ||
            /\/vacancy\/\d+/i.test(candidate.pathname) ||
            /(?:vacId|vacancyId|jobId|job_id|REQ|requisition)=/i.test(candidate.search) ||
            /\/vacancies\/\d+\//i.test(candidate.pathname);
      const roleLink =
        label.length < 180 &&
        /\b(?:officer|manager|director|specialist|assistant|coordinator|ecologist|ranger|technician|accountant|analyst|researcher|scientist|intern|adviser|advisor|administrator|head of|chief|solicitor|lawyer|attorney|fellow)\b/i.test(
          label,
        ) &&
        !/^(?:meet|our |how |why |about |contact|download|view all|search)/i.test(label);
      const pdf =
        /\.pdf$/i.test(candidate.pathname) &&
        /vacan|job|position|recruit|officer|manager|assistant|ranger/i.test(label + " " + candidate.pathname);
      if (
        (config.jobLinkSelector || detailPath || pdf || (kind !== "icims" && roleLink)) &&
        !/^(?:view all|search|find jobs|all jobs|careers|job search|next|previous|\d+)$/i.test(label)
      ) {
        details.set(key, candidate.toString());
        const table = anchor.closest("table"),
          row = anchor.closest("tr");
        if (table && row) {
          const headers = [...table.querySelectorAll("th")].flatMap((cell) =>
            Array.from({ length: Math.min(10, Number(cell.getAttribute("colspan")) || 1) }, () =>
              plainText(cell.innerHTML).toLowerCase(),
            ),
          );
          const cells = [...row.querySelectorAll("td")].map((cell) => plainText(cell.innerHTML));
          const location = cells[headers.indexOf("location")],
            date = cells[headers.indexOf("closing date")];
          const parsed = date ? new Date(date) : null;
          hints.set(key, {
            ...(location ? { location } : {}),
            ...(parsed && Number.isFinite(parsed.valueOf())
              ? { closesAt: closingDate(parsed.toISOString().slice(0, 10)) }
              : {}),
          });
        }
      }
    }
    const emptyMessages = [...content.querySelectorAll("p,div,li")]
      .filter((node) => !node.querySelector("p,div,li"))
      .map((node) => plainText(node.innerHTML))
      .filter(
        (message) => !/internship|volunteer|consultanc|scholarship|match your|search criteria/i.test(message),
      );
    confirmedEmpty ||=
      !objects.length &&
      (config.emptySelector
        ? !!content.querySelector(config.emptySelector)
        : emptyMessages.some((message) => emptyVacancies.test(message)) ||
          (!content.children.length && emptyVacancies.test(text)) ||
          (kind === "icims" && /Sorry,? no jobs were found/i.test(text)));
    const next = config.nextSelector
      ? dom.querySelector(config.nextSelector)
      : dom.querySelector(
          'a[rel="next"],link[rel="next"],a[aria-label="Next page"],a[aria-label="Next"],a[title="Next Page"],a.next',
        );
    const href = next?.getAttribute("href");
    const apparentTotal = text.match(/\b(\d+)\s+(?:results|jobs available|vacancies found)\b/i)?.[1];
    if (!href) {
      const toolset = content.querySelector("[data-pagination]")?.getAttribute("data-pagination");
      if (toolset && Number(JSON.parse(toolset).max_pages) > 1)
        throw new SourceReadError(
          "incomplete",
          "The vacancy widget requires verified pagination before import.",
        );
      if (phenom.status === 200 && Number(phenom.totalHits) > details.size)
        throw new SourceReadError("incomplete", "The careers portal did not expose every results page.");
      if (apparentTotal && Number(apparentTotal) > jobs.size + details.size)
        throw new SourceReadError(
          "incomplete",
          "The page reports more jobs than were discovered. Its pagination needs configuration.",
        );
      break;
    }
    if (batch === 24)
      throw new SourceReadError("incomplete", "The vacancy list exceeded the pagination budget.");
    page = await read(publicUrl(href!, page.url).toString());
  }
  if (details.size > 85)
    throw new SourceReadError(
      "incomplete",
      "This board needs a feed or a dedicated connector to import its full vacancy list within the request budget.",
    );
  const links = [...details.values()].filter(
    (target) => ![...jobs.values()].some((job) => job.canonical_url === canonicalUrl(target)),
  );
  for (let offset = 0; offset < links.length; offset += 4) {
    const group = await Promise.all(
      links.slice(offset, offset + 4).map(async (target) => {
        const detail = await read(target);
        if (/application\/pdf/i.test(detail.contentType)) {
          const { getDocumentProxy, extractText } = await import("unpdf");
          const pdf = await getDocumentProxy(new Uint8Array(detail.body), { maxImageSize: 16777216 });
          if (pdf.numPages > 30) {
            await pdf.loadingTask.destroy();
            throw new SourceReadError(
              "unsupported",
              "This vacancy document exceeds the 30-page import limit.",
            );
          }
          let timer: ReturnType<typeof setTimeout> | undefined;
          const extracted = await Promise.race([
            extractText(pdf, { mergePages: true }),
            new Promise<never>((_resolve, reject) => {
              timer = setTimeout(
                () => reject(new SourceReadError("incomplete", "The vacancy PDF extraction timed out.")),
                10000,
              );
            }),
          ]).finally(async () => {
            clearTimeout(timer);
            await pdf.loadingTask.destroy();
          });
          const text = extracted.text;
          if (extracted.totalPages > 30 || text.length < 120)
            throw new SourceReadError(
              "unsupported",
              "A vacancy PDF needs OCR or manual transcription before it can be imported.",
            );
          const safe = text.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
          const heading = plainText(text.split(/\n/).find((line) => line.trim().length > 5) || "");
          const posting = advertPosting(
            `<main><h1>${heading}</h1><p>${safe}</p></main>`,
            target,
            config.organisation,
          );
          if (!posting?.closesAt)
            throw new SourceReadError(
              "unsupported",
              "A vacancy PDF has no verifiable closing date. Review it through the manual advert form to avoid importing an archived role.",
            );
          return posting;
        }
        const posting = advertPosting(
          detail.text,
          detail.url,
          config.organisation,
          config.descriptionSelector,
        );
        if (!posting && !closedAdvert.test(visibleSource(detail.text).text))
          throw new SourceReadError(
            "incomplete",
            `A linked vacancy could not be parsed: ${detail.url.slice(0, 300)}. The source's previous jobs have been preserved.`,
          );
        const hint = hints.get(canonicalUrl(target));
        return posting
          ? {
              ...posting,
              location: posting.location || hint?.location,
              closesAt: posting.closesAt || hint?.closesAt,
            }
          : null;
      }),
    );
    for (const posting of group)
      if (posting) {
        const job = postingCard(posting, options.now);
        jobs.set(job.feed_id, job);
      }
  }
  if (!jobs.size && !confirmedEmpty && !links.length)
    throw new SourceReadError(
      "unsupported",
      "No complete vacancy list was found. Configure its vacancy section and links, save the recruitment-board URL, or add an individual advert manually.",
    );
  return finish([...jobs.values()], kind === "auto" ? "html" : kind, first.url, pages);

  function finish(
    items: FeedCard[],
    reader: string,
    resolvedUrl: string,
    pageCount: number,
    feedName?: string,
  ) {
    const ids = new Set<string>();
    for (const item of items) {
      item.source_content_kind = reader === "rss" ? "feed" : "advert";
      if (ids.has(item.feed_id))
        throw new SourceReadError("incomplete", "The source repeated a vacancy identifier.");
      ids.add(item.feed_id);
      publicUrl(item.source_url);
    }
    const now = options.now || new Date();
    const preview: SourcePreview = {
      kind: reader,
      checkedAt: now.toISOString(),
      count: items.length,
      liveCount: items.filter(
        (item) => new Date(directoryDeadline(item.posted_at, item.closes_at)).valueOf() > now.valueOf(),
      ).length,
      pages: pageCount,
      complete: true,
      url: resolvedUrl,
      jobs: items.slice(0, 10).map((j) => ({
        title: j.title,
        organisation: j.organisation_name,
        location: j.location_text,
        url: j.source_url,
        closesAt: j.closes_at || null,
      })),
    };
    return { name: input.name || feedName || config.organisation || start.hostname, items, preview };
  }
}
