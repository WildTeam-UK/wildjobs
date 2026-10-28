import type { Metadata } from "next";
import { JobBrowser } from "@/components/job-browser";
import type { EmploymentType, LocationType } from "@/lib/jobs";
import { getPublicJobs } from "@/lib/public-jobs";

export const metadata: Metadata = {
  title: "Find conservation jobs",
  description: "Search and explore conservation careers with WildJobs.",
};
const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site"];
const employmentTypes: readonly EmploymentType[] = [
  "Full time",
  "Part time",
  "Flexible",
  "Permanent",
  "Fixed term",
  "Temporary",
  "Internship",
  "Apprenticeship",
];
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function valueOf(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, jobs] = await Promise.all([searchParams, getPublicJobs()]);
  const location = valueOf(params.location);
  const employment = valueOf(params.type);
  return (
    <main>
      <section className="interior-hero">
        <div className="shell interior-hero__layout">
          <div>
            <p className="eyebrow">Find jobs</p>
            <h1>Discover your next conservation role.</h1>
          </div>
          <p>Search by role, working pattern, career area or a WildTeam course you know.</p>
        </div>
      </section>
      <JobBrowser
        jobs={jobs}
        initialFilters={{
          query: valueOf(params.q),
          locationType: locationTypes.includes(location as LocationType) ? (location as LocationType) : "",
          employmentType: employmentTypes.includes(employment as EmploymentType)
            ? (employment as EmploymentType)
            : "",
          category: valueOf(params.category),
          courseSlug: valueOf(params.course),
        }}
      />
    </main>
  );
}
