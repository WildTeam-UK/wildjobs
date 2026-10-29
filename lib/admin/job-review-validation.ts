import { contractTypes, experienceLevels, hoursTypes, workplaceTypes } from "./job-intake-validation";

type JobReviewInput = {
  applicationUrl: string;
  canonicalUrl: string;
  closesAt: string;
  contractType: (typeof contractTypes)[number] | null;
  countryCode: string;
  description: string;
  employerMission: string;
  employerOverview: string;
  employerWebsiteUrl: string;
  experienceLevel: (typeof experienceLevels)[number] | null;
  hoursType: (typeof hoursTypes)[number] | null;
  locationText: string;
  postedAt: string | null;
  requirements: string;
  responsibilities: string;
  salaryText: string | null;
  summary: string;
  title: string;
  workplaceType: (typeof workplaceTypes)[number] | null;
};

export type JobReviewValidation = { data: JobReviewInput; error?: never } | { data?: never; error: string };

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

export function validateJobReview(
  formData: FormData,
  today = new Date().toISOString().slice(0, 10),
): JobReviewValidation {
  const canonicalUrl = textValue(formData, "canonicalUrl");
  const employerWebsiteUrl = textValue(formData, "employerWebsiteUrl");
  const employerMission = textValue(formData, "employerMission");
  const employerOverview = textValue(formData, "employerOverview");
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
  const salaryNotStated = formData.has("salaryNotStated");
  const applicationUrl = textValue(formData, "applicationUrl");
  const postedAt = textValue(formData, "postedAt");
  const closesAt = textValue(formData, "closesAt");

  if (!isHttpsUrl(canonicalUrl)) return { error: "Enter the HTTPS address of the original vacancy." };
  if (!isHttpsUrl(employerWebsiteUrl)) return { error: "Enter the employer’s HTTPS website." };
  if (!hasLength(employerMission, 20, 400)) {
    return { error: "Add a concise employer mission between 20 and 400 characters." };
  }
  if (!hasLength(employerOverview, 40, 1_200)) {
    return { error: "Add an employer overview between 40 and 1,200 characters." };
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
  if (!salaryNotStated && !hasLength(salaryText, 2, 240)) {
    return { error: "Enter the advertised salary or mark it as not stated." };
  }
  if (!isHttpsUrl(applicationUrl)) return { error: "The application address must use HTTPS." };
  if (postedAt && !isDate(postedAt)) return { error: "Enter a valid publication date." };
  if (!isDate(closesAt) || closesAt < today) return { error: "The closing date must be today or later." };
  if (postedAt && postedAt > closesAt) {
    return { error: "The publication date must be before the closing date." };
  }

  return {
    data: {
      applicationUrl,
      canonicalUrl,
      closesAt,
      contractType: normalisedContractType,
      countryCode,
      description,
      employerMission,
      employerOverview,
      employerWebsiteUrl,
      experienceLevel: normalisedExperienceLevel,
      hoursType: normalisedHoursType,
      locationText,
      postedAt: postedAt || null,
      requirements,
      responsibilities,
      salaryText: salaryNotStated ? null : salaryText,
      summary,
      title,
      workplaceType: normalisedWorkplaceType,
    },
  };
}
