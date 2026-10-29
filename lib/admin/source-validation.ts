export const sourceTypes = ["manual_curation", "feed", "api", "employer_submission"] as const;

export type SourceType = (typeof sourceTypes)[number];

type SourceInput = {
  authoritativeBaseUrl: string;
  isActive: boolean;
  name: string;
  sourceType: SourceType;
};

export type SourceValidation =
  | { data: SourceInput; error?: never }
  | { data?: never; error: "invalid-name" | "invalid-type" | "invalid-url" };

export type SourceStatusValidation =
  | { data: { isActive: boolean; sourceId: number }; error?: never }
  | { data?: never; error: "invalid-source" | "invalid-status" };

export function validateSource(formData: FormData): SourceValidation {
  const nameValue = formData.get("name");
  const sourceTypeValue = formData.get("sourceType");
  const urlValue = formData.get("authoritativeBaseUrl");
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const authoritativeBaseUrl = typeof urlValue === "string" ? urlValue.trim() : "";

  if (name.length < 2 || name.length > 120) return { error: "invalid-name" };
  if (typeof sourceTypeValue !== "string" || !sourceTypes.includes(sourceTypeValue as SourceType)) {
    return { error: "invalid-type" };
  }

  try {
    const url = new URL(authoritativeBaseUrl);
    if (url.protocol !== "https:") return { error: "invalid-url" };
  } catch {
    return { error: "invalid-url" };
  }

  return {
    data: {
      authoritativeBaseUrl,
      isActive: formData.get("isActive") === "on",
      name,
      sourceType: sourceTypeValue as SourceType,
    },
  };
}

export function validateSourceStatus(formData: FormData): SourceStatusValidation {
  const sourceIdValue = formData.get("sourceId");
  const statusValue = formData.get("status");
  const sourceId = typeof sourceIdValue === "string" ? Number(sourceIdValue) : Number.NaN;

  if (!Number.isSafeInteger(sourceId) || sourceId <= 0) return { error: "invalid-source" };
  if (statusValue !== "active" && statusValue !== "paused") return { error: "invalid-status" };

  return { data: { isActive: statusValue === "active", sourceId } };
}
