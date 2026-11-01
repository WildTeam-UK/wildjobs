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
    expiresAt?: string | null;
    engagementType?: string | null;
    countryCode?: string | null;
    description: string | null;
    locationText: string | null;
    status: string;
    summary: string | null;
  };
  sources: readonly {
    canonicalUrl: string | null;
    verifiedAt: string | null;
    publicationAllowed?: boolean;
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
      label:
        "Original brief, location, engagement, country, application route and listing lifetime are complete",
      ready:
        (input.job.summary?.trim().length ?? 0) >= 20 &&
        (input.job.description?.trim().length ?? 0) >= 80 &&
        hasText(input.job.locationText) &&
        Boolean(input.job.applicationUrl) &&
        Boolean(input.job.engagementType && input.job.countryCode) &&
        Boolean((input.job.closesAt ?? input.job.expiresAt ?? "") >= input.today),
    },
    {
      key: "source",
      label: "A permitted authoritative source was checked within the last 48 hours",
      ready: input.sources.some((source) =>
        Boolean(
          source.publicationAllowed &&
          source.canonicalUrl &&
          source.verifiedAt &&
          Date.parse(source.verifiedAt) >= Date.parse(`${input.today}T00:00:00Z`) - 48 * 3600000,
        ),
      ),
    },
    {
      key: "employer",
      label: "Employer profiles are reviewed independently of this vacancy",
      ready: true,
    },
  ];
}
