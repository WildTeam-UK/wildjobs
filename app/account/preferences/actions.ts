"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCandidate } from "@/lib/auth/candidate";
import { ensureCandidateProfile } from "@/lib/auth/candidate-profile";
import { validateCandidatePreferences } from "@/lib/candidate-preference-validation";

export async function updateCandidatePreferences(formData: FormData) {
  const result = validateCandidatePreferences(formData);
  if ("error" in result) redirect("/account/preferences?status=error");

  const { supabase, userId } = await requireCandidate("/account/preferences");
  const profileError = await ensureCandidateProfile(supabase, userId);
  if (profileError) redirect("/account/preferences?status=error");

  const { error } = await supabase.rpc("replace_candidate_preferences", {
    p_career_area_ids: [...result.data.careerAreaIds],
    p_contract_types: [...result.data.contractTypes],
    p_experience_level: result.data.experienceLevel,
    p_hours_types: [...result.data.hoursTypes],
    p_preferred_location: result.data.preferredLocation ?? "",
    p_workplace_types: [...result.data.workplaceTypes],
  });

  if (error) {
    console.error("Unable to update candidate preferences", { code: error.code });
    redirect("/account/preferences?status=error");
  }

  revalidatePath("/account");
  revalidatePath("/account/preferences");
  redirect(`/account/preferences?status=${formData.get("intent") === "clear" ? "cleared" : "saved"}`);
}
