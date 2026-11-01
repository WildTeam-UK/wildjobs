export type JobBrief = {
  conservationContext: string;
  desirable: string[];
  practical: string[];
  applicationChecklist: string[];
  missingInformation: string[];
};

export function readJobBrief(value: unknown): JobBrief | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const raw = value as Record<string, unknown>;
  if (typeof raw.conservationContext !== "string") return;
  const strings = (name: string) =>
    Array.isArray(raw[name])
      ? (raw[name] as unknown[]).filter((item): item is string => typeof item === "string")
      : [];
  return {
    conservationContext: raw.conservationContext,
    desirable: strings("desirable"),
    practical: strings("practical"),
    applicationChecklist: strings("applicationChecklist"),
    missingInformation: strings("missingInformation"),
  };
}
