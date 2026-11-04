import type { Metadata } from "next";
import { TrainingBanner } from "@/components/templates/template-parts";
import { JobBrowser, type JobSortOrder } from "@/components/job-browser";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import type { EmploymentType, EngagementType, LocationType } from "@/lib/jobs";
import { getPublicCourses } from "@/lib/public-courses";
import { getPublicJobs } from "@/lib/public-jobs";
import { normaliseCountryCode } from "@/lib/job-filtering";

export const metadata: Metadata = {
  title: "Find conservation jobs",
  description: "Search and explore conservation careers with WildJobs.",
  alternates: { canonical: "/" },
};

const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site"];
const employmentTypes: readonly EmploymentType[] = [
  "Full time",
  "Part time",
  "Permanent",
  "Fixed term",
  "Temporary",
  "Internship",
  "Apprenticeship",
  "Not stated",
];
const engagementTypes: readonly EngagementType[] = ["Paid", "Volunteer"];
const sortOrders: readonly JobSortOrder[] = ["relevance", "newest", "closing"];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function valueOf(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function valuesOf(value: string | string[] | undefined) {
  return typeof value === "string" ? [value] : (value ?? []);
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const [params, jobs, courses, candidateSaveState] = await Promise.all([
    searchParams,
    getPublicJobs(),
    getPublicCourses(),
    getCandidateSaveState(),
  ]);
  const location = valueOf(params.location);
  const employment = valueOf(params.type);
  const engagement = valueOf(params.opportunity);
  const sort = valueOf(params.sort);
  const sector = valueOf(params.sector ?? params.category);
  const salary = Number(valueOf(params.salary));
  const page = Number(valueOf(params.page));

  return (
    <main>
      <JobBrowser
        afterListings={
          <div className="shell job-listings-career-cta">
            <TrainingBanner courseTheme="green" />
          </div>
        }
        candidateSaveState={candidateSaveState}
        courses={courses}
        initialPage={Number.isInteger(page) && page > 0 ? page : 1}
        jobs={jobs}
        initialFilters={{
          roleSlug: valueOf(params.role),
          query: valueOf(params.q),
          locationQuery: valueOf(params.place),
          countryCode: normaliseCountryCode(valueOf(params.country)),
          locationType: locationTypes.includes(location as LocationType) ? (location as LocationType) : "",
          engagementType: engagementTypes.includes(engagement as EngagementType)
            ? (engagement as EngagementType)
            : "",
          employmentType: employmentTypes.includes(employment as EmploymentType)
            ? (employment as EmploymentType)
            : "",
          contractType: valueOf(params.contract),
          category: sector === "Conservation & Wildlife" ? "Wildlife Conservation" : sector,
          courseSlugs: valuesOf(params.course),
          minimumSalary: Number.isFinite(salary) && salary > 0 ? salary : 0,
          sortOrder: sortOrders.includes(sort as JobSortOrder) ? (sort as JobSortOrder) : "relevance",
        }}
      />
    </main>
  );
}
