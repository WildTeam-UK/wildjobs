import "server-only";

import { cache } from "react";

import type {
  ContractType,
  ExperienceLevel,
  HoursType,
  WorkplaceType,
} from "@/lib/candidate-preference-validation";
import { requireCandidate } from "@/lib/auth/candidate";

export type CareerAreaOption = Readonly<{
  id: number;
  slug: string;
  title: string;
}>;

export type CandidatePreferences = Readonly<{
  careerAreaIds: readonly number[];
  careerAreaTitles: readonly string[];
  contractTypes: readonly ContractType[];
  experienceLevel: ExperienceLevel;
  hasPreferences: boolean;
  hoursTypes: readonly HoursType[];
  preferenceCount: number;
  preferredLocation: string;
  workplaceTypes: readonly WorkplaceType[];
}>;

export type CandidatePreferenceData = Readonly<{
  careerAreas: readonly CareerAreaOption[];
  preferences: CandidatePreferences;
}>;

function preferenceReadError(error: { code?: string; message: string }) {
  console.error("Unable to load candidate preferences", { code: error.code, message: error.message });
  return new Error("Job preferences could not be loaded.");
}

export const getCandidatePreferenceData = cache(async (): Promise<CandidatePreferenceData> => {
  const { supabase, userId } = await requireCandidate("/account/preferences");
  const [baseResult, careerAreasResult, careerResult, workplaceResult, hoursResult, contractResult] =
    await Promise.all([
      supabase
        .from("candidate_preferences")
        .select("preferred_location, experience_level")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("career_areas").select("id, slug, title").eq("is_active", true).order("display_order"),
      supabase.from("candidate_career_area_preferences").select("career_area_id").eq("user_id", userId),
      supabase.from("candidate_workplace_preferences").select("workplace_type").eq("user_id", userId),
      supabase.from("candidate_hours_preferences").select("hours_type").eq("user_id", userId),
      supabase.from("candidate_contract_preferences").select("contract_type").eq("user_id", userId),
    ]);

  const error =
    baseResult.error ??
    careerAreasResult.error ??
    careerResult.error ??
    workplaceResult.error ??
    hoursResult.error ??
    contractResult.error;
  if (error) throw preferenceReadError(error);

  const careerAreas = careerAreasResult.data ?? [];
  const careerAreaIds = (careerResult.data ?? []).map((record) => record.career_area_id);
  const selectedCareerAreaIds = new Set(careerAreaIds);
  const careerAreaTitles = careerAreas
    .filter((careerArea) => selectedCareerAreaIds.has(careerArea.id))
    .map((careerArea) => careerArea.title);
  const workplaceTypes = (workplaceResult.data ?? []).map((record) => record.workplace_type as WorkplaceType);
  const hoursTypes = (hoursResult.data ?? []).map((record) => record.hours_type as HoursType);
  const contractTypes = (contractResult.data ?? []).map((record) => record.contract_type as ContractType);
  const preferredLocation = baseResult.data?.preferred_location?.trim() ?? "";
  const experienceLevel = (baseResult.data?.experience_level ?? "open") as ExperienceLevel;
  const preferenceCount =
    careerAreaIds.length +
    workplaceTypes.length +
    hoursTypes.length +
    contractTypes.length +
    Number(Boolean(preferredLocation)) +
    Number(experienceLevel !== "open");

  return {
    careerAreas,
    preferences: {
      careerAreaIds,
      careerAreaTitles,
      contractTypes,
      experienceLevel,
      hasPreferences: preferenceCount > 0,
      hoursTypes,
      preferenceCount,
      preferredLocation,
      workplaceTypes,
    },
  };
});
