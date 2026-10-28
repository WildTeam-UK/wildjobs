import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

export async function ensureCandidateProfile(supabase: SupabaseClient<Database>, userId: string) {
  const { error } = await supabase
    .from("candidate_profiles")
    .upsert({ user_id: userId }, { ignoreDuplicates: true, onConflict: "user_id" });

  return error;
}
