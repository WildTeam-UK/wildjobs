export type ManualPublicationCheck = {
  key: "employer" | "source" | "status" | "vacancy";
  label: string;
  ready: boolean;
};

type Input = {
  employer: {
    mission: string | null;
    overview: string | null;
    websiteUrl: string | null;
  };
  job: {
    applicationUrl: string | null;
    closesAt: string | null;
    description: string | null;
    locationText: string | null;
    status: string;
    summary: string | null;
  };
  sources: readonly {
    canonicalUrl: string | null;
    verifiedAt: string | null;
  }[];
  today: string;
};

function hasText(value: string | null) {
  return Boolean(value?.trim());
}

export function manualPublicationChecks(input: Input): ManualPublicationCheck[] {
  return [
    {
      key: "status",
      label:
        input.job.status === "in_review"
          ? "Vacancy has been reviewed and saved"
          : "Open Edit reviewed details and save once to move this draft into review",
      ready: input.job.status === "in_review",
    },
    {
      key: "vacancy",
      label: "Summary, description, location, application link and current closing date are complete",
      ready:
        hasText(input.job.summary) &&
        hasText(input.job.description) &&
        hasText(input.job.locationText) &&
        Boolean(input.job.applicationUrl) &&
        Boolean(input.job.closesAt && input.job.closesAt >= input.today),
    },
    {
      key: "source",
      label: "At least one authoritative source has been verified",
      ready: input.sources.some((source) => Boolean(source.canonicalUrl && source.verifiedAt)),
    },
    {
      key: "employer",
      label: "Employer website, mission and overview are complete",
      ready:
        Boolean(input.employer.websiteUrl) &&
        hasText(input.employer.mission) &&
        hasText(input.employer.overview),
    },
  ];
}
