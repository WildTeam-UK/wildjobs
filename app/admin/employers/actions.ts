"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { validateEmployerProfile } from "@/lib/admin/employer-profile-validation";
import { requireStaff } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type EmployerProfileActionState = { error: string | null };

export async function updateEmployerProfile(
  employerId: number,
  _previousState: EmployerProfileActionState,
  formData: FormData,
): Promise<EmployerProfileActionState> {
  await requireStaff();
  if (!Number.isSafeInteger(employerId) || employerId < 1) {
    return { error: "The employer record is invalid." };
  }

  const result = validateEmployerProfile(formData);
  if (!result.data) return { error: result.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_employer_review_profile", {
    p_employer_id: employerId,
    p_mission: result.data.mission,
    p_overview: result.data.overview,
    p_website_url: result.data.websiteUrl,
  });

  if (error) {
    if (error.code === "42501") {
      return { error: "An administrator must update this employer profile." };
    }
    return { error: "The employer profile could not be saved. Nothing was changed; please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/employers");
  revalidatePath(`/admin/employers/${employerId}`);
  revalidatePath("/admin/jobs");
  redirect(`/admin/employers/${employerId}?status=updated`);
}
