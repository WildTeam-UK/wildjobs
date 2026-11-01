import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveJobIntent } from "./save-intent";
import type { Database } from "@/lib/supabase/database.types";
export async function saveRequestedJob(
  supabase: SupabaseClient<Database>,
  userId: string,
  intent: SaveJobIntent,
) {
  const { data: job, error: jobError } = await supabase
    .from("directory_jobs")
    .select("id")
    .eq("slug", intent.jobSlug)
    .eq("is_active", true)
    .maybeSingle();
  if (jobError || !job) return "error" as const;
  const { error } = await supabase.from("directory_saved_jobs").insert({ job_id: job.id, user_id: userId });
  return !error || error.code === "23505" ? ("saved" as const) : ("error" as const);
}
