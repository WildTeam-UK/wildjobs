import { advertClosingDate } from "./directory-lifecycle";
import type { PublicSourceRequest } from "./directory-http";
import { SourceReadError } from "./source-config";
import { normaliseSalary } from "./job-salary";
import { plainText } from "./directory-text";
import {
  sourceDocument,
  postingCard,
  britishRecruitmentDate,
  emptyVacancies,
  advertPosting,
} from "./source-posting";
import type { FeedCard } from "./directory-sources";

export type RecruitmentPage = { text: string; url: string; contentType: string; body: Uint8Array };
export type RecruitmentReader = (url: string, request?: PublicSourceRequest) => Promise<RecruitmentPage>;
export function talentPool(title: string) {
  return /^(?:expressions? of interest|submit an expression|join (?:our|the) talent|talent (?:pool|community))\b/i.test(
    title.trim(),
  );
}

export async function readRecruitmentAdapter({
  first,
  organisation,
  now,
  read,
}: {
  first: RecruitmentPage;
  organisation: string;
  now?: Date;
  read: RecruitmentReader;
}): Promise<{ items: FeedCard[]; kind: string; url: string } | null> {
  const start = new URL(first.url);
  const host = start.hostname.replace(/^www\./, "");
  if (host === "theoep.org.uk" && start.pathname === "/work-us-job-vacancies") {
    const dom = sourceDocument(first.text),
      section = dom.querySelector(".textarea");
    if (!section || !/Our current vacancies:/i.test(plainText(section.innerHTML)))
      throw new SourceReadError("incomplete", "The current OEP vacancy section was not found.");
    const paragraphs = [...section.querySelectorAll("p")].filter((p) => /Closes:/i.test(p.textContent));
    if (!paragraphs.length && !emptyVacancies.test(plainText(section.innerHTML)))
      throw new SourceReadError("incomplete", "The OEP vacancy section did not confirm an empty result.");
    const items = paragraphs.map((p) => {
      const title = plainText(p.querySelector("strong")?.innerHTML || ""),
        description = plainText(p.innerHTML);
      const clock = description.match(
        /Closes:\s*(\d{1,2}):(\d{2})\s*([ap]m)\s+on\s+[A-Za-z]+\s+(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4})/i,
      );
      const date = clock ? advertClosingDate("Closing date: " + clock[4]) : null;
      if (!title || !date || !clock || Number(clock[1]) < 1 || Number(clock[1]) > 12 || Number(clock[2]) > 59)
        throw new SourceReadError(
          "incomplete",
          "An OEP role lacks its title or precise application deadline.",
        );
      const hour = (Number(clock[1]) % 12) + (clock[3].toLowerCase() === "pm" ? 12 : 0),
        target = new Date(date);
      target.setUTCHours(hour, Number(clock[2]), 0, 0);
      let time = target.valueOf();
      // Convert the advertised UK local deadline without assuming winter time.
      for (let i = 0; i < 2; i++) {
        const parts = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/London",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23",
        }).formatToParts(new Date(time));
        const v = Object.fromEntries(parts.map((p) => [p.type, p.value]));
        time +=
          target.valueOf() -
          Date.UTC(
            Number(v.year),
            Number(v.month) - 1,
            Number(v.day),
            Number(v.hour),
            Number(v.minute),
            Number(v.second),
          );
      }
      return postingCard(
        {
          id: first.url + "|" + title,
          url: first.url,
          title,
          description,
          organisation,
          closesAt: new Date(time).toISOString(),
          employmentType: /voluntar|volunteer/i.test(description) ? "Volunteer" : "",
        },
        now,
      );
    });
    return { items, kind: "inline-html", url: first.url };
  }
  if ((host === "bornfree.org.uk" || host === "landcareaustralia.org.au") && start.pathname === "/careers/") {
    const dom = sourceDocument(first.text);
    const headings = [
      ...dom.querySelectorAll(
        host === "bornfree.org.uk" ? ".article .content h3" : ".elementor-widget-text-editor h4",
      ),
    ];
    if (!headings.length)
      throw new SourceReadError("incomplete", "The published inline vacancy section was not found.");
    const jobs: FeedCard[] = [];
    for (const heading of headings) {
      const siblings = [...heading.parentNode!.childNodes],
        offset = siblings.indexOf(heading);
      const next = siblings.findIndex((n, i) => i > offset && headings.includes(n as typeof heading));
      const html = siblings
        .slice(offset, next < 0 ? undefined : next)
        .map((n) => (n.nodeType === 1 ? (n as typeof heading).outerHTML : n.textContent || ""))
        .join(" ");
      const title = plainText(heading.innerHTML);
      const posting = advertPosting(
        `<main><h1>${heading.innerHTML}</h1>${html}</main>`,
        first.url,
        organisation,
      );
      if (!posting)
        throw new SourceReadError(
          "incomplete",
          "An inline vacancy lacks verified role and application information.",
        );
      jobs.push(postingCard({ ...posting, id: first.url + "|" + title }, now));
    }
    return { items: jobs, kind: "inline-html", url: first.url };
  }
  if (start.pathname.endsWith("/postings.json") || start.hostname.endsWith(".pinpointhq.com")) {
    const data = JSON.parse(first.text);
    if (!Array.isArray(data.data) || data.data.length > 5000 || data.links?.next)
      throw new SourceReadError("incomplete", "Pinpoint did not return a complete public postings feed.");
    const jobs = data.data.map((j: Record<string, unknown>) => {
      if (
        typeof j.id !== "string" ||
        typeof j.title !== "string" ||
        typeof j.description !== "string" ||
        typeof j.url !== "string"
      )
        throw new SourceReadError("incomplete", "A Pinpoint posting is missing its public advert fields.");
      const description = plainText(
        [j.description, j.key_responsibilities, j.skills_knowledge_expertise, j.benefits]
          .filter((v) => typeof v === "string")
          .join(" "),
      );
      if (description.length < 120)
        throw new SourceReadError("incomplete", "A Pinpoint posting lacks its published description.");
      const location = j.location as { name?: string; city?: string; country?: string };
      return postingCard(
        {
          id: j.id,
          title: j.title,
          url: j.url,
          description,
          organisation,
          location: location?.name || location?.city || "",
          closesAt: typeof j.deadline_at === "string" ? j.deadline_at : null,
          employmentType: typeof j.employment_type_text === "string" ? j.employment_type_text : "",
          remote: typeof j.workplace_type_text === "string" ? j.workplace_type_text : "",
          salary:
            j.compensation_visible === true && typeof j.compensation === "string"
              ? normaliseSalary(j.compensation, {
                  currency: typeof j.compensation_currency === "string" ? j.compensation_currency : undefined,
                  defaultAnnual: false,
                })
              : "",
        },
        now,
      );
    });
    return { items: jobs, kind: "pinpoint", url: first.url };
  }
  if (start.hostname.endsWith(".livevacancies.co.uk")) {
    const settings = JSON.parse((await read(start.origin + "/getcompanydetails")).text)?.settings;
    const companyId = settings?.company_id;
    if (typeof companyId !== "string" || !/^([a-f0-9]{8}-)([a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(companyId))
      throw new SourceReadError("incomplete", "The recruitment board did not identify its public employer.");
    const entries: unknown = JSON.parse(
      (await read("https://api.core-easywebats.com/v1/job/all", { method: "GET", companyId })).text,
    );
    if (!Array.isArray(entries) || entries.length > 5000)
      throw new SourceReadError("incomplete", "The recruitment board returned an unexpected vacancy list.");
    const jobs: FeedCard[] = [];
    for (const raw of entries) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw))
        throw new SourceReadError("incomplete", "A recruitment entry was malformed.");
      const j = raw as Record<string, unknown>;
      if (j.company_id !== companyId)
        throw new SourceReadError("incomplete", "The recruitment board returned another employer's entries.");
      // Only public website adverts are retained. Never copy ATS workflow, staff or campaign fields.
      const publication = (
        j.published_to as { website?: { published?: boolean; last_published_date?: string } }
      )?.website;
      if (
        j.visibility !== "public" ||
        j.status !== "Active" ||
        j.published_flag !== true ||
        publication?.published !== true
      )
        continue;
      const id = String(j.id || ""),
        number = String(j.job_number || ""),
        title = typeof j.title === "string" ? plainText(j.title) : "";
      const description = Array.isArray(j.description)
        ? plainText(
            j.description.map((b) => (typeof b?.description === "string" ? b.description : "")).join(" "),
          )
        : "";
      if (
        !id ||
        !/^\d+$/.test(number) ||
        !title ||
        description.length < 120 ||
        typeof j.closing_date !== "string" ||
        !Number.isFinite(new Date(j.closing_date).valueOf())
      )
        throw new SourceReadError(
          "incomplete",
          "A public recruitment advert lacks required content or a verified deadline.",
        );
      jobs.push(
        postingCard(
          {
            id,
            url: start.origin + "/#/job/details/" + number,
            title,
            description,
            organisation,
            location: typeof j.location === "string" ? j.location : "",
            salary: typeof j.salary === "string" ? j.salary : "",
            postedAt: publication.last_published_date,
            closesAt: j.closing_date,
            employmentType: [j.job_type, j.contract_type, j.hours]
              .filter((v) => typeof v === "string")
              .join(" "),
          },
          now,
        ),
      );
    }
    return { items: jobs, kind: "hireful", url: first.url };
  }
  if (start.hostname.endsWith(".webitrent.com")) {
    const dom = sourceDocument(first.text);
    const links = [...dom.querySelectorAll("a.job-result-title")];
    const text = plainText(dom.body.innerHTML);
    const expected = text.match(/Results\s*[-–]\s*(\d+)\s+match(?:es)?\s+found/i)?.[1];
    if (expected === undefined)
      throw new SourceReadError("incomplete", "iTrent did not declare a complete vacancy result count.");
    const jobs = new Map<string, FeedCard>();
    for (const link of links) {
      const href = link.getAttribute("href") || "";
      const id = href.match(/VACANCY_ID(?:=|%3d)([\w-]+)/i)?.[1];
      const table = link.closest("table");
      const title = plainText(link.innerHTML);
      const description = plainText(table?.innerHTML || "");
      const date = description.match(/Application closing date\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1];
      const closesAt = date ? britishRecruitmentDate(date) : undefined;
      if (!id || !title || description.length < 120 || !closesAt)
        throw new SourceReadError(
          "incomplete",
          "An iTrent vacancy lacks a verified title, description or deadline.",
        );
      const target = new URL("ETREC107GF.open", start);
      target.searchParams.set("VACANCY_ID", id);
      const view = start.searchParams.get("WVID");
      if (view) target.searchParams.set("WVID", view);
      target.searchParams.set("LANG", "USA");
      jobs.set(
        id,
        postingCard({ id, url: target.toString(), title, description, organisation, closesAt }, now),
      );
    }
    if (jobs.size !== Number(expected))
      throw new SourceReadError(
        "incomplete",
        "iTrent pagination needs configuration before all vacancies can be imported.",
      );
    return { items: [...jobs.values()], kind: "itrent", url: first.url };
  }
  if (
    start.hostname.replace(/^www\./, "") === "nts.org.uk" &&
    start.pathname === "/volunteering-jobs/job-search"
  ) {
    const dom = sourceDocument(first.text);
    const regional = [
      ...new Set(
        [...dom.querySelectorAll("a[href]")]
          .map((a) => new URL(a.getAttribute("href")!, start))
          .filter(
            (u) =>
              u.origin === start.origin && /^\/volunteering-jobs\/job-search\/[^/]+\/?$/.test(u.pathname),
          )
          .map((u) => u.toString()),
      ),
    ];
    if (!regional.length || regional.length > 12)
      throw new SourceReadError("incomplete", "The complete regional vacancy index could not be verified.");
    const jobs: FeedCard[] = [];
    for (const url of regional) {
      const page = await read(url),
        region = sourceDocument(page.text);
      const location = plainText(region.querySelector("h1")?.innerHTML || "");
      const blocks = [...region.querySelectorAll(".image-text-block__text")].filter((b) =>
        b.querySelector("h3"),
      );
      if (
        !blocks.length &&
        !emptyVacancies.test(plainText(region.body.innerHTML)) &&
        !(
          location &&
          /If you.{1,10}interested in applying for any of the opportunities below/i.test(
            plainText(region.body.innerHTML),
          )
        )
      )
        throw new SourceReadError(
          "incomplete",
          `A regional careers page did not expose its complete vacancy section: ${url}`,
        );
      for (const block of blocks) {
        const title = plainText(block.querySelector("h3")!.innerHTML),
          description = plainText(block.innerHTML);
        const document = [...block.querySelectorAll("a[href]")].find((a) =>
          /Download the job description/i.test(a.textContent),
        );
        const date = description.match(/Closing date:\s*(\d{1,2} [A-Za-z]+ \d{4}|Ongoing)/i)?.[1];
        const closesAt = date && date !== "Ongoing" ? new Date(date + " 23:59:59 UTC") : undefined;
        if (
          !title ||
          !document ||
          description.length < 120 ||
          !date ||
          (closesAt && !Number.isFinite(closesAt.valueOf()))
        )
          throw new SourceReadError(
            "incomplete",
            "A regional vacancy lacks verified application information or closing status.",
          );
        jobs.push(
          postingCard(
            {
              id: url + "|" + title,
              url,
              title,
              description,
              organisation,
              location,
              country: "GB",
              closesAt: closesAt?.toISOString(),
            },
            now,
          ),
        );
      }
    }
    return { items: jobs, kind: "regional-html", url: first.url };
  }
  return null;
}
