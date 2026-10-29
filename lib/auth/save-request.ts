import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { SaveJobIntent } from "@/lib/auth/save-intent";
import type { Database } from "@/lib/supabase/database.types";

export async function saveRequestedJob(
  supabase: SupabaseClient<Database>,
  userId: string,
  intent: SaveJobIntent,
) {
  const now = new Date();
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("slug", intent.jobSlug)
    .eq("status", "published")
    .lte("published_at", now.toISOString())
    .gte("closes_at", now.toISOString().slice(0, 10))
    .is("withdrawn_at", null)
    .maybeSingle();

  if (jobError || !job) return "error" as const;

  const { error } = await supabase.from("saved_jobs").insert({ job_id: job.id, user_id: userId });
  return !error || error.code === "23505" ? ("saved" as const) : ("error" as const);
}
