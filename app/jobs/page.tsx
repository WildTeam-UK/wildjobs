import type { Metadata } from "next";
import { JobBrowser } from "@/components/job-browser";
import { getCandidateSaveState } from "@/lib/candidate-saved-jobs";
import type { EmploymentType, EngagementType, LocationType } from "@/lib/jobs";
import { getPublicJobs } from "@/lib/public-jobs";

export const metadata: Metadata = {
  title: "Find conservation jobs",
  description: "Search and explore conservation careers with WildJobs.",
};
const locationTypes: readonly LocationType[] = ["Remote", "Hybrid", "On-site", "Not specified"];
const employmentTypes: readonly EmploymentType[] = [
  "Full time",
  "Part time",
  "Flexible",
  "Permanent",
  "Fixed term",
  "Temporary",
  "Internship",
  "Apprenticeship",
  "Not stated",
];
const engagementTypes: readonly EngagementType[] = ["Paid", "Volunteer"];
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
function valueOf(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, jobs, candidateSaveState] = await Promise.all([
    searchParams,
    getPublicJobs(),
    getCandidateSaveState(),
  ]);
  const location = valueOf(params.location);
  const employment = valueOf(params.type);
  const engagement = valueOf(params.opportunity);
  const salary = Number(valueOf(params.salary));
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
        candidateSaveState={candidateSaveState}
        jobs={jobs}
        initialFilters={{
          query: valueOf(params.q),
          locationQuery: valueOf(params.place),
          locationType: locationTypes.includes(location as LocationType) ? (location as LocationType) : "",
          engagementType: engagementTypes.includes(engagement as EngagementType)
            ? (engagement as EngagementType)
            : "",
          employmentType: employmentTypes.includes(employment as EmploymentType)
            ? (employment as EmploymentType)
            : "",
          contractType: valueOf(params.contract),
          category: valueOf(params.category),
          courseSlug: valueOf(params.course),
          minimumSalary: Number.isFinite(salary) && salary > 0 ? salary : 0,
        }}
      />
    </main>
  );
}
