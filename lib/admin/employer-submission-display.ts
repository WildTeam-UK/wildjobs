export const employerSubmissionStatusLabels: Readonly<Record<string, string>> = {
  accepted: "Accepted",
  changes_requested: "Changes requested",
  new: "New",
  ready_for_job_review: "Ready for job review",
  rejected: "Rejected",
};

export const workplaceTypeLabels: Readonly<Record<string, string>> = {
  hybrid: "Hybrid",
  on_site: "On-site",
  remote: "Remote",
};

export function employerSubmissionStatusLabel(status: string) {
  return employerSubmissionStatusLabels[status] ?? status;
}

export function workplaceTypeLabel(workplaceType: string) {
  return workplaceTypeLabels[workplaceType] ?? workplaceType;
}

export function parseEmployerSubmissionId(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function formatSubmissionTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}
