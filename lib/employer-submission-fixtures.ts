export type SubmissionStatus = "Changes requested" | "New" | "Ready for job review";

export type EmployerSubmission = Readonly<{
  id: string;
  organisation: string;
  roleTitle: string;
  status: SubmissionStatus;
  receivedAt: string;
  contactLabel: string;
  completeness: number;
  notes: readonly string[];
}>;

export const employerSubmissions: readonly EmployerSubmission[] = [
  {
    id: "SUB-208",
    organisation: "Example River Partnership",
    roleTitle: "Catchment Project Officer",
    status: "New",
    receivedAt: "2026-10-28T10:14:00Z",
    contactLabel: "Verified work email",
    completeness: 92,
    notes: ["Application process supplied", "Salary and closing date supplied"],
  },
  {
    id: "SUB-207",
    organisation: "Example Coastal Trust",
    roleTitle: "Volunteer Programme Lead",
    status: "Changes requested",
    receivedAt: "2026-10-28T09:22:00Z",
    contactLabel: "Verified work email",
    completeness: 76,
    notes: ["Salary range needs confirmation", "Hybrid expectations need clarification"],
  },
  {
    id: "SUB-206",
    organisation: "Example Forest Alliance",
    roleTitle: "Woodland Partnerships Manager",
    status: "Ready for job review",
    receivedAt: "2026-10-27T16:40:00Z",
    contactLabel: "Known partner contact",
    completeness: 100,
    notes: ["Employer record matched", "Required information complete"],
  },
];

export function employerSubmissionById(id: string) {
  return employerSubmissions.find((submission) => submission.id === id);
}

export const employerReviewFixtures = [
  {
    name: "Example Coastal Trust",
    status: "Possible duplicate",
    profiles: 2,
    evidence: "Matching website domain and operating location",
  },
  {
    name: "Example Forest Alliance",
    status: "Verified fixture",
    profiles: 1,
    evidence: "Matched to an existing reviewed profile",
  },
  {
    name: "Example River Partnership",
    status: "New organisation",
    profiles: 1,
    evidence: "No existing name or domain match found",
  },
] as const;
