export const workplaceTypes = ["remote", "hybrid", "on_site"] as const;
export const contractTypes = [
  "permanent",
  "fixed_term",
  "temporary",
  "internship",
  "apprenticeship",
] as const;
export const hoursTypes = ["full_time", "part_time", "flexible"] as const;
export const experienceLevels = ["entry", "developing", "experienced", "leadership", "open"] as const;
export const engagementTypes = ["paid", "volunteer"] as const;

export type JobIntakeInput = {
  applicationUrl: string;
  canonicalUrl: string;
  closesAt: string;
  contractType: (typeof contractTypes)[number] | null;
  countryCode: string;
  description: string;
  engagementType: (typeof engagementTypes)[number] | null;
  employerName: string;
  employerSlug: string;
  employerWebsiteUrl: string | null;
  experienceLevel: (typeof experienceLevels)[number] | null;
  hoursType: (typeof hoursTypes)[number] | null;
  jobSlug: string;
  locationText: string;
  postedAt: string | null;
  requirements: string;
  responsibilities: string;
  salaryText: string | null;
  sourceId: number;
  summary: string;
  title: string;
  workplaceType: (typeof workplaceTypes)[number] | null;
};

export type JobIntakeValidation = { data: JobIntakeInput; error?: never } | { data?: never; error: string };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalChoice<const T extends readonly string[]>(value: string, choices: T) {
  if (value === "not_specified") return null;
  return choices.includes(value) ? (value as T[number]) : undefined;
}

function hasLength(value: string, minimum: number, maximum: number) {
  return value.length >= minimum && value.length <= maximum;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

export function toSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150)
    .replace(/-$/g, "");
}

export function validateJobIntake(
  formData: FormData,
  today = new Date().toISOString().slice(0, 10),
): JobIntakeValidation {
  const sourceId = Number(textValue(formData, "sourceId"));
  const canonicalUrl = textValue(formData, "canonicalUrl");
  const employerName = textValue(formData, "employerName");
  const employerWebsiteUrl = textValue(formData, "employerWebsiteUrl");
  const title = textValue(formData, "title");
  const summary = textValue(formData, "summary");
  const description = textValue(formData, "description");
  const engagementType = textValue(formData, "engagementType");
  const responsibilities = textValue(formData, "responsibilities");
  const requirements = textValue(formData, "requirements");
  const locationText = textValue(formData, "locationText");
  const countryCode = textValue(formData, "countryCode").toUpperCase();
  const workplaceType = textValue(formData, "workplaceType");
  const contractType = textValue(formData, "contractType");
  const hoursType = textValue(formData, "hoursType");
  const experienceLevel = textValue(formData, "experienceLevel");
  const salaryText = textValue(formData, "salaryText");
  const salaryNotStated = formData.has("salaryNotStated");
  const applicationUrl = textValue(formData, "applicationUrl");
  const postedAt = textValue(formData, "postedAt");
  const closesAt = textValue(formData, "closesAt");

  if (!Number.isSafeInteger(sourceId) || sourceId < 1) return { error: "Choose an approved vacancy source." };
  if (!isHttpsUrl(canonicalUrl)) return { error: "Enter the HTTPS address of the original vacancy." };
  if (!hasLength(employerName, 2, 160)) return { error: "Enter the employer name." };
  if (employerWebsiteUrl && !isHttpsUrl(employerWebsiteUrl)) {
    return { error: "The employer website must use HTTPS." };
  }
  if (!hasLength(title, 2, 180)) return { error: "Enter the vacancy title." };
  if (!hasLength(summary, 20, 500)) return { error: "Add a summary between 20 and 500 characters." };
  if (!hasLength(description, 40, 20_000)) return { error: "Add a clear vacancy description." };
  if (!hasLength(locationText, 2, 240)) return { error: "Enter the location shown by the employer." };
  if (!/^[A-Z]{2}$/.test(countryCode)) return { error: "Enter a two-letter country code, such as GB." };
  const normalisedWorkplaceType = optionalChoice(workplaceType, workplaceTypes);
  const normalisedContractType = optionalChoice(contractType, contractTypes);
  const normalisedHoursType = optionalChoice(hoursType, hoursTypes);
  const normalisedExperienceLevel = optionalChoice(experienceLevel, experienceLevels);
  const normalisedEngagementType = optionalChoice(engagementType, engagementTypes);
  if (normalisedWorkplaceType === undefined) {
    return { error: "Choose how the role is based." };
  }
  if (normalisedContractType === undefined) {
    return { error: "Choose the contract type." };
  }
  if (normalisedHoursType === undefined) {
    return { error: "Choose the working pattern." };
  }
  if (normalisedExperienceLevel === undefined) {
    return { error: "Choose the experience level." };
  }
  if (normalisedEngagementType === undefined) {
    return { error: "Choose whether this is a paid or volunteer opportunity." };
  }
  if (!salaryNotStated && !hasLength(salaryText, 2, 240)) {
    return { error: "Enter the advertised salary or mark it as not stated." };
  }
  if (!isHttpsUrl(applicationUrl)) return { error: "The application address must use HTTPS." };
  if (postedAt && !isDate(postedAt)) return { error: "Enter a valid publication date." };
  if (!isDate(closesAt) || closesAt < today) return { error: "The closing date must be today or later." };
  if (postedAt && postedAt > closesAt)
    return { error: "The publication date must be before the closing date." };

  const employerSlug = toSlug(employerName);
  const jobSlug = toSlug(`${title}-${employerName}-${closesAt}`);
  if (!employerSlug || !jobSlug) return { error: "The employer and title need letters or numbers." };

  return {
    data: {
      applicationUrl,
      canonicalUrl,
      closesAt,
      contractType: normalisedContractType,
      countryCode,
      description,
      engagementType: normalisedEngagementType,
      employerName,
      employerSlug,
      employerWebsiteUrl: employerWebsiteUrl || null,
      experienceLevel: normalisedExperienceLevel,
      hoursType: normalisedHoursType,
      jobSlug,
      locationText,
      postedAt: postedAt || null,
      requirements,
      responsibilities,
      salaryText: salaryNotStated ? null : salaryText,
      sourceId,
      summary,
      title,
      workplaceType: normalisedWorkplaceType,
    },
  };
}
