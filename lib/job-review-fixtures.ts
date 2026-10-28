import { jobBySlug } from "./jobs";

export type ReviewStatus = "Duplicate warning" | "Needs review" | "Published" | "Ready to publish";
export type PreviewJobState = "active" | "changed" | "expired" | "withdrawn";

export type ReviewRecord = Readonly<{
  jobSlug: string;
  source: string;
  sourceReference: string;
  receivedAt: string;
  completeness: number;
  status: ReviewStatus;
  issues: readonly string[];
  audit: readonly string[];
}>;

export const reviewRecords: readonly ReviewRecord[] = [
  {
    jobSlug: "community-conservation-coordinator",
    source: "Curated partner submission",
    sourceReference: "partner-demo-1042",
    receivedAt: "2026-10-28T08:42:00Z",
    completeness: 100,
    status: "Ready to publish",
    issues: [],
    audit: [
      "Source record received",
      "Required fields checked",
      "Salary and closing date confirmed",
      "Ready for a staff publishing decision",
    ],
  },
  {
    jobSlug: "marine-restoration-officer",
    source: "Demonstration feed",
    sourceReference: "feed-demo-882",
    receivedAt: "2026-10-28T08:39:00Z",
    completeness: 82,
    status: "Needs review",
    issues: ["Application process needs a clearer description", "Reasonable-adjustment contact is unknown"],
    audit: ["Source record received", "Automatic field mapping completed", "Assigned for staff review"],
  },
  {
    jobSlug: "biodiversity-data-analyst",
    source: "Curated partner submission",
    sourceReference: "partner-demo-1039",
    receivedAt: "2026-10-28T08:31:00Z",
    completeness: 94,
    status: "Duplicate warning",
    issues: ["Possible duplicate of a record received on 27 October"],
    audit: ["Source record received", "Potential source URL match found", "Merge decision required"],
  },
  {
    jobSlug: "forest-programme-manager",
    source: "Manual staff entry",
    sourceReference: "manual-demo-47",
    receivedAt: "2026-10-27T15:12:00Z",
    completeness: 100,
    status: "Published",
    issues: [],
    audit: ["Draft created by staff", "Second-person review completed", "Published to the prototype"],
  },
];

export const previewJobStates: Record<
  Exclude<PreviewJobState, "active">,
  Readonly<{ label: string; title: string; message: string }>
> = {
  changed: {
    label: "Listing updated",
    title: "Important details have changed.",
    message:
      "Review the salary, location and closing date again before deciding whether this role still suits you.",
  },
  expired: {
    label: "Vacancy closed",
    title: "Applications are no longer open.",
    message: "WildJobs keeps this clear so an expired opportunity is never presented as available.",
  },
  withdrawn: {
    label: "Vacancy withdrawn",
    title: "The employer has removed this opportunity.",
    message: "The application route is no longer available. Explore current roles for similar opportunities.",
  },
};

export function reviewRecordBySlug(slug: string) {
  return reviewRecords.find((record) => record.jobSlug === slug);
}

export function reviewJob(record: ReviewRecord) {
  return jobBySlug(record.jobSlug);
}

export function parsePreviewJobState(value: string | string[] | undefined): PreviewJobState {
  return value === "changed" || value === "expired" || value === "withdrawn" ? value : "active";
}
