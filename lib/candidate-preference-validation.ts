export const experienceOptions = [
  { label: "Open to different levels", value: "open" },
  { label: "Entry level", value: "entry" },
  { label: "Developing career", value: "developing" },
  { label: "Experienced professional", value: "experienced" },
  { label: "Leadership", value: "leadership" },
] as const;

export const workplaceOptions = [
  { label: "Remote", value: "remote" },
  { label: "Hybrid", value: "hybrid" },
  { label: "On-site", value: "on_site" },
] as const;

export const hoursOptions = [
  { label: "Full time", value: "full_time" },
  { label: "Part time", value: "part_time" },
] as const;

export const contractOptions = [
  { label: "Permanent", value: "permanent" },
  { label: "Fixed term", value: "fixed_term" },
  { label: "Temporary", value: "temporary" },
  { label: "Internship", value: "internship" },
  { label: "Apprenticeship", value: "apprenticeship" },
] as const;

export type ExperienceLevel = (typeof experienceOptions)[number]["value"];
export type WorkplaceType = (typeof workplaceOptions)[number]["value"];
export type HoursType = (typeof hoursOptions)[number]["value"];
export type ContractType = (typeof contractOptions)[number]["value"];

export type CandidatePreferenceInput = Readonly<{
  careerAreaIds: readonly number[];
  contractTypes: readonly ContractType[];
  experienceLevel: ExperienceLevel;
  hoursTypes: readonly HoursType[];
  preferredLocation: string | null;
  workplaceTypes: readonly WorkplaceType[];
}>;

function choiceValues<T extends string>(
  formData: FormData,
  name: string,
  allowed: readonly T[],
): readonly T[] | undefined {
  const values = formData.getAll(name);
  if (values.some((value) => typeof value !== "string" || !allowed.includes(value as T))) {
    return undefined;
  }
  return [...new Set(values as string[])] as T[];
}

const experienceLevels = experienceOptions.map((option) => option.value);
const workplaceTypes = workplaceOptions.map((option) => option.value);
const hoursTypes = hoursOptions.map((option) => option.value);
const contractTypes = contractOptions.map((option) => option.value);

export function validateCandidatePreferences(
  formData: FormData,
): { data: CandidatePreferenceInput; error?: never } | { data?: never; error: string } {
  if (formData.get("intent") === "clear") {
    return {
      data: {
        careerAreaIds: [],
        contractTypes: [],
        experienceLevel: "open",
        hoursTypes: [],
        preferredLocation: null,
        workplaceTypes: [],
      },
    };
  }

  const preferredLocationValue = formData.get("preferredLocation");
  const experienceLevelValue = formData.get("experienceLevel");
  const preferredLocation = typeof preferredLocationValue === "string" ? preferredLocationValue.trim() : "";

  if (preferredLocation.length > 120) {
    return { error: "Keep your preferred location to 120 characters or fewer." };
  }

  if (
    typeof experienceLevelValue !== "string" ||
    !experienceLevels.includes(experienceLevelValue as ExperienceLevel)
  ) {
    return { error: "Choose a valid experience level." };
  }

  const selectedWorkplaceTypes = choiceValues(formData, "workplaceTypes", workplaceTypes);
  const selectedHoursTypes = choiceValues(formData, "hoursTypes", hoursTypes);
  const selectedContractTypes = choiceValues(formData, "contractTypes", contractTypes);
  if (!selectedWorkplaceTypes || !selectedHoursTypes || !selectedContractTypes) {
    return { error: "Choose only the available working arrangements." };
  }

  const rawCareerAreaIds = formData.getAll("careerAreaIds");
  if (rawCareerAreaIds.length > 24 || rawCareerAreaIds.some((value) => typeof value !== "string")) {
    return { error: "Choose only the available career areas." };
  }
  const careerAreaIds = [...new Set(rawCareerAreaIds.map(Number))];
  if (careerAreaIds.some((value) => !Number.isSafeInteger(value) || value < 1)) {
    return { error: "Choose only the available career areas." };
  }

  return {
    data: {
      careerAreaIds,
      contractTypes: selectedContractTypes,
      experienceLevel: experienceLevelValue as ExperienceLevel,
      hoursTypes: selectedHoursTypes,
      preferredLocation: preferredLocation || null,
      workplaceTypes: selectedWorkplaceTypes,
    },
  };
}
