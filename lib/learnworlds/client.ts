import "server-only";

import { load } from "cheerio";
import { z } from "zod";

import { environmentValue, requireEnvironmentValue } from "../environment";

const MAX_PAGES = 20;
const MAX_RESPONSE_BYTES = 1_500_000;

const courseSchema = z
  .object({
    access: z.string().nullish(),
    course_url: z.string().nullish(),
    description: z.string().nullish(),
    id: z.union([z.string(), z.number()]),
    public_url: z.string().nullish(),
    status: z.string().nullish(),
    title: z.string().min(1),
    url: z.string().nullish(),
  })
  .passthrough();

const coursePageSchema = z
  .object({
    data: z.array(courseSchema),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type LearnWorldsCourse = Readonly<{
  availabilityStatus: "available" | "unavailable";
  id: string;
  publicUrl: string;
  summary: string;
  title: string;
}>;

type LearnWorldsConfig = Readonly<{
  accessToken: string;
  apiUrl: URL;
  approvedCourseIds: ReadonlySet<string>;
  clientId: string;
  publicBaseUrl: URL;
}>;

function validatedHttpsUrl(name: string, value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be a credential-free HTTPS URL.`);
  }
  return url;
}

export function isLearnWorldsCourseSyncConfigured() {
  return Boolean(
    environmentValue(process.env.LEARNWORLDS_API_URL) &&
    environmentValue(process.env.LEARNWORLDS_CLIENT_ID) &&
    environmentValue(process.env.LEARNWORLDS_ACCESS_TOKEN) &&
    environmentValue(process.env.LEARNWORLDS_PUBLIC_BASE_URL) &&
    environmentValue(process.env.LEARNWORLDS_APPROVED_COURSE_IDS),
  );
}

function getLearnWorldsConfig(): LearnWorldsConfig {
  const apiUrl = validatedHttpsUrl(
    "LEARNWORLDS_API_URL",
    requireEnvironmentValue("LEARNWORLDS_API_URL", process.env.LEARNWORLDS_API_URL),
  );
  const publicBaseUrl = validatedHttpsUrl(
    "LEARNWORLDS_PUBLIC_BASE_URL",
    requireEnvironmentValue("LEARNWORLDS_PUBLIC_BASE_URL", process.env.LEARNWORLDS_PUBLIC_BASE_URL),
  );
  if (!apiUrl.pathname.replace(/\/$/, "").endsWith("/v2")) {
    throw new Error("LEARNWORLDS_API_URL must be the version 2 API base URL.");
  }

  const approvedCourseIds = new Set(
    requireEnvironmentValue("LEARNWORLDS_APPROVED_COURSE_IDS", process.env.LEARNWORLDS_APPROVED_COURSE_IDS)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  if (!approvedCourseIds.size || approvedCourseIds.size > 100) {
    throw new Error("LEARNWORLDS_APPROVED_COURSE_IDS must contain between 1 and 100 course IDs.");
  }

  return {
    accessToken: requireEnvironmentValue("LEARNWORLDS_ACCESS_TOKEN", process.env.LEARNWORLDS_ACCESS_TOKEN),
    apiUrl,
    approvedCourseIds,
    clientId: requireEnvironmentValue("LEARNWORLDS_CLIENT_ID", process.env.LEARNWORLDS_CLIENT_ID),
    publicBaseUrl,
  };
}

function plainText(value: string | null | undefined) {
  const text = load(value ?? "")
    .text()
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 1_000);
}

function courseAvailability(status: string | null | undefined, access: string | null | undefined) {
  const values = [status, access].filter(Boolean).map((value) => value!.toLocaleLowerCase("en-GB"));
  if (
    values.some((value) =>
      ["closed", "coming_soon", "draft", "inactive", "private", "unpublished"].includes(value),
    )
  ) {
    return "unavailable" as const;
  }
  return "available" as const;
}

function publicCourseUrl(config: LearnWorldsConfig, course: z.infer<typeof courseSchema>) {
  const candidate = course.public_url ?? course.course_url ?? course.url;
  if (candidate) {
    try {
      const url = new URL(candidate, config.publicBaseUrl);
      if (url.protocol === "https:" && url.origin === config.publicBaseUrl.origin) return url.toString();
    } catch {
      // Fall through to the deterministic public course URL.
    }
  }
  return new URL(`course/${encodeURIComponent(String(course.id))}`, config.publicBaseUrl).toString();
}

function totalPages(meta: Record<string, unknown> | undefined) {
  for (const key of ["total_pages", "totalPages", "last_page", "lastPage"]) {
    const value = meta?.[key];
    if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  }
  return undefined;
}

async function fetchCoursePage(config: LearnWorldsConfig, page: number) {
  const url = new URL(`${config.apiUrl.toString().replace(/\/$/, "")}/courses`);
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.accessToken}`,
      "Lw-Client": config.clientId,
    },
    redirect: "error",
    signal: AbortSignal.timeout(8_000),
  });
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  const contentType = response.headers.get("content-type")?.toLocaleLowerCase("en-GB") ?? "";
  if (
    !response.ok ||
    !contentType.includes("application/json") ||
    (contentLength && contentLength > MAX_RESPONSE_BYTES)
  ) {
    throw new Error("LearnWorlds did not return the approved course catalogue.");
  }
  const body = await response.arrayBuffer();
  if (body.byteLength > MAX_RESPONSE_BYTES) {
    throw new Error("The LearnWorlds course response was too large.");
  }
  return coursePageSchema.parse(JSON.parse(new TextDecoder().decode(body)));
}

export async function fetchApprovedLearnWorldsCourses() {
  const config = getLearnWorldsConfig();
  const courses = new Map<string, LearnWorldsCourse>();
  const seenCourseIds = new Set<string>();

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await fetchCoursePage(config, page);
    const pageCourseIds = result.data.map((course) => String(course.id));
    const repeatedPage = pageCourseIds.length > 0 && pageCourseIds.every((id) => seenCourseIds.has(id));
    if (repeatedPage) break;
    pageCourseIds.forEach((id) => seenCourseIds.add(id));
    for (const rawCourse of result.data) {
      const id = String(rawCourse.id);
      if (!config.approvedCourseIds.has(id)) continue;
      courses.set(id, {
        availabilityStatus: courseAvailability(rawCourse.status, rawCourse.access),
        id,
        publicUrl: publicCourseUrl(config, rawCourse),
        summary: plainText(rawCourse.description) || rawCourse.title.trim(),
        title: rawCourse.title.trim(),
      });
    }

    const pageCount = totalPages(result.meta);
    if ((pageCount && page >= pageCount) || (!pageCount && result.data.length < 50)) break;
    if (page === MAX_PAGES) throw new Error("The LearnWorlds course catalogue exceeded the page limit.");
  }

  return {
    approvedCourseIds: config.approvedCourseIds,
    courses: [...courses.values()],
  };
}
