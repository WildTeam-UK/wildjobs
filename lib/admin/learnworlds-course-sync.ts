import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchApprovedLearnWorldsCourses, isLearnWorldsCourseSyncConfigured } from "@/lib/learnworlds/client";
import type { Database } from "@/lib/supabase/database.types";

export type CourseSyncResult =
  | { status: "not_configured" | "not_due" }
  | { coursesDisabled: number; coursesSynced: number; status: "completed" }
  | { errorCode: "course_sync_failed"; status: "failed" };

function courseSlug(id: string, title: string) {
  const base = (id || title)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-GB")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return base || "course";
}

async function recordCourseSyncState(
  supabase: SupabaseClient<Database>,
  values: Database["public"]["Tables"]["source_import_automation"]["Update"],
) {
  const { error } = await supabase.from("source_import_automation").update(values).eq("id", true);
  if (error) throw new Error("The course sync state could not be recorded.");
}

async function syncApprovedCourses(supabase: SupabaseClient<Database>) {
  const { approvedCourseIds, courses } = await fetchApprovedLearnWorldsCourses();
  const approvedIds = [...approvedCourseIds];
  const { data: existing, error: existingError } = await supabase
    .from("courses")
    .select(
      "availability_status, is_active, learnworlds_course_id, provenance, public_url, reviewed_at, short_title, slug, summary, title",
    )
    .in("learnworlds_course_id", approvedIds);
  if (existingError) throw new Error("Approved courses could not be read.");

  const existingById = new Map((existing ?? []).map((course) => [course.learnworlds_course_id, course]));
  const syncedAt = new Date().toISOString();
  const reviewedAt = syncedAt.slice(0, 10);
  const foundIds = new Set(courses.map((course) => course.id));
  const rows: Database["public"]["Tables"]["courses"]["Insert"][] = courses.map((course) => {
    const current = existingById.get(course.id);
    return {
      availability_status: course.availabilityStatus,
      is_active: course.availabilityStatus === "available",
      learnworlds_course_id: course.id,
      learnworlds_synced_at: syncedAt,
      provenance: current?.provenance ?? "LearnWorlds API; approved course allowlist",
      public_url: course.publicUrl,
      reviewed_at: current?.reviewed_at ?? reviewedAt,
      short_title: current?.short_title ?? course.title,
      slug: current?.slug ?? courseSlug(course.id, course.title),
      summary: current?.summary ?? course.summary,
      title: course.title,
      updated_at: syncedAt,
    };
  });

  if (rows.length) {
    const { error } = await supabase.from("courses").upsert(rows, { onConflict: "learnworlds_course_id" });
    if (error) throw new Error("Approved courses could not be saved.");
  }

  const missingIds = approvedIds.filter((id) => !foundIds.has(id) && existingById.has(id));
  if (missingIds.length) {
    const { error } = await supabase
      .from("courses")
      .update({
        availability_status: "unavailable",
        is_active: false,
        learnworlds_synced_at: syncedAt,
        updated_at: syncedAt,
      })
      .in("learnworlds_course_id", missingIds);
    if (error) throw new Error("Unavailable courses could not be updated.");
  }

  return { coursesDisabled: missingIds.length, coursesSynced: rows.length };
}

export async function syncPeriodicLearnWorldsCourses(
  supabase: SupabaseClient<Database>,
): Promise<CourseSyncResult> {
  if (!isLearnWorldsCourseSyncConfigured()) return { status: "not_configured" };

  const { data: claimed, error: claimError } = await supabase.rpc("claim_periodic_course_sync", {
    interval_hours: 6,
  });
  if (claimError) throw new Error("The scheduled course sync could not be claimed.");
  if (!claimed) return { status: "not_due" };

  try {
    const result = await syncApprovedCourses(supabase);
    await recordCourseSyncState(supabase, {
      last_course_sync_completed_at: new Date().toISOString(),
      last_course_sync_error_code: null,
      last_course_sync_status: "completed",
      updated_at: new Date().toISOString(),
    });
    return { ...result, status: "completed" };
  } catch {
    console.error("Scheduled LearnWorlds course sync failed.");
    await recordCourseSyncState(supabase, {
      last_course_sync_completed_at: new Date().toISOString(),
      last_course_sync_error_code: "course_sync_failed",
      last_course_sync_status: "failed",
      updated_at: new Date().toISOString(),
    });
    return { errorCode: "course_sync_failed", status: "failed" };
  }
}
