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

type JobIntakeInput = {
  applicationUrl: string;
  canonicalUrl: string;
  closesAt: string;
  contractType: (typeof contractTypes)[number];
  countryCode: string;
  description: string;
  employerName: string;
  employerSlug: string;
  employerWebsiteUrl: string | null;
  experienceLevel: (typeof experienceLevels)[number];
  hoursType: (typeof hoursTypes)[number];
  jobSlug: string;
  locationText: string;
  postedAt: string | null;
  requirements: string;
  responsibilities: string;
  salaryText: string;
  sourceId: number;
  summary: string;
  title: string;
  workplaceType: (typeof workplaceTypes)[number];
};

export type JobIntakeValidation = { data: JobIntakeInput; error?: never } | { data?: never; error: string };

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
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
  const responsibilities = textValue(formData, "responsibilities");
  const requirements = textValue(formData, "requirements");
  const locationText = textValue(formData, "locationText");
  const countryCode = textValue(formData, "countryCode").toUpperCase();
  const workplaceType = textValue(formData, "workplaceType");
  const contractType = textValue(formData, "contractType");
  const hoursType = textValue(formData, "hoursType");
  const experienceLevel = textValue(formData, "experienceLevel");
  const salaryText = textValue(formData, "salaryText");
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
  if (!workplaceTypes.includes(workplaceType as JobIntakeInput["workplaceType"])) {
    return { error: "Choose how the role is based." };
  }
  if (!contractTypes.includes(contractType as JobIntakeInput["contractType"])) {
    return { error: "Choose the contract type." };
  }
  if (!hoursTypes.includes(hoursType as JobIntakeInput["hoursType"])) {
    return { error: "Choose the working pattern." };
  }
  if (!experienceLevels.includes(experienceLevel as JobIntakeInput["experienceLevel"])) {
    return { error: "Choose the experience level." };
  }
  if (!hasLength(salaryText, 2, 240)) return { error: "Enter the salary exactly as advertised." };
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
      contractType: contractType as JobIntakeInput["contractType"],
      countryCode,
      description,
      employerName,
      employerSlug,
      employerWebsiteUrl: employerWebsiteUrl || null,
      experienceLevel: experienceLevel as JobIntakeInput["experienceLevel"],
      hoursType: hoursType as JobIntakeInput["hoursType"],
      jobSlug,
      locationText,
      postedAt: postedAt || null,
      requirements,
      responsibilities,
      salaryText,
      sourceId,
      summary,
      title,
      workplaceType: workplaceType as JobIntakeInput["workplaceType"],
    },
  };
}
