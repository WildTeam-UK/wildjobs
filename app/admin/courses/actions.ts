"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { bootstrapCourseCapabilities } from "@/lib/admin/course-capability-bootstrap";
import { syncApprovedLearnWorldsCourses } from "@/lib/admin/learnworlds-course-sync";
import { requireAdministrator, requireStaff } from "@/lib/auth/staff";
import { isLearnWorldsCourseSyncConfigured } from "@/lib/learnworlds/client";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.coerce.number().int().positive();
function coursePath(courseId: number, status: string) {
  return `/admin/courses/${courseId}?status=${status}`;
}

function refreshCourse(courseId: number) {
  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/jobs");
}

export async function syncLearnWorldsCourses() {
  await requireAdministrator();
  if (!isLearnWorldsCourseSyncConfigured()) redirect("/admin/courses?error=not-configured");

  const supabase = await createClient();
  try {
    await syncApprovedLearnWorldsCourses(supabase);
  } catch {
    console.error("Staff-triggered LearnWorlds course sync failed.");
    redirect("/admin/courses?error=sync-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath("/jobs");
  redirect("/admin/courses?status=synced");
}

export async function generateCourseCapabilitiesNow() {
  await requireAdministrator();
  const supabase = await createClient();
  let result: Awaited<ReturnType<typeof bootstrapCourseCapabilities>>;
  try {
    result = await bootstrapCourseCapabilities(supabase, { force: true });
  } catch {
    console.error("Staff-triggered course capability generation failed.");
    redirect("/admin/courses?error=capability-generation-failed");
  }
  if (result.status === "not_configured") redirect("/admin/courses?error=ai-not-configured");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath("/jobs");
  redirect("/admin/courses?status=capabilities-generated");
}

export async function updateCourseProfile(courseId: number, formData: FormData) {
  await requireStaff();
  const parsedId = idSchema.safeParse(courseId);
  const parsed = z
    .object({
      displayOrder: z.coerce.number().int().min(0).max(32_767),
      imageAlt: z.string().trim().max(240),
      isFilterVisible: z.boolean(),
      publicUrl: z.string().url().startsWith("https://").max(2_000),
      shortTitle: z.string().trim().min(2).max(160),
      summary: z.string().trim().min(10).max(1_000),
      themeColour: z.union([z.literal(""), z.string().regex(/^#[0-9A-Fa-f]{6}$/)]),
    })
    .safeParse({
      displayOrder: formData.get("displayOrder"),
      imageAlt: formData.get("imageAlt"),
      isFilterVisible: formData.get("isFilterVisible") === "on",
      publicUrl: formData.get("publicUrl"),
      shortTitle: formData.get("shortTitle"),
      summary: formData.get("summary"),
      themeColour: formData.get("themeColour"),
    });
  if (!parsedId.success || !parsed.success) redirect(coursePath(courseId, "invalid"));

  const supabase = await createClient();
  if (parsed.data.isFilterVisible) {
    const { count, error } = await supabase
      .from("course_capabilities")
      .select("capability_id", { count: "exact", head: true })
      .eq("course_id", parsedId.data);
    if (error || !count) redirect(coursePath(courseId, "mapping-required"));
  }
  const { error } = await supabase
    .from("courses")
    .update({
      display_order: parsed.data.displayOrder,
      image_alt: parsed.data.imageAlt || null,
      is_filter_visible: parsed.data.isFilterVisible,
      public_url: parsed.data.publicUrl,
      reviewed_at: new Date().toISOString().slice(0, 10),
      short_title: parsed.data.shortTitle,
      summary: parsed.data.summary,
      theme_colour: parsed.data.themeColour || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsedId.data);
  if (error) redirect(coursePath(courseId, "save-failed"));
  refreshCourse(parsedId.data);
  redirect(coursePath(parsedId.data, "saved"));
}

export async function addLearningOutcome(courseId: number, formData: FormData) {
  await requireStaff();
  const parsedId = idSchema.safeParse(courseId);
  const parsed = z
    .object({
      outcomeText: z.string().trim().min(3).max(1_000),
      sourceUrl: z.string().trim().url().startsWith("https://").max(2_000),
    })
    .safeParse({ outcomeText: formData.get("outcomeText"), sourceUrl: formData.get("sourceUrl") });
  if (!parsedId.success || !parsed.success) redirect(coursePath(courseId, "invalid-outcome"));
  const supabase = await createClient();
  const { error } = await supabase.from("course_learning_outcomes").insert({
    confidence: 100,
    course_id: parsedId.data,
    outcome_text: parsed.data.outcomeText,
    policy_version: null,
    provenance: "staff",
    reviewed_at: new Date().toISOString().slice(0, 10),
    source_url: parsed.data.sourceUrl,
  });
  if (error) redirect(coursePath(courseId, "outcome-failed"));
  refreshCourse(parsedId.data);
  redirect(coursePath(parsedId.data, "outcome-added"));
}

export async function removeLearningOutcome(courseId: number, formData: FormData) {
  await requireStaff();
  const parsedId = idSchema.safeParse(courseId);
  const outcomeId = idSchema.safeParse(formData.get("outcomeId"));
  if (!parsedId.success || !outcomeId.success) redirect(coursePath(courseId, "invalid-outcome"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("course_learning_outcomes")
    .delete()
    .eq("id", outcomeId.data)
    .eq("course_id", parsedId.data);
  if (error) redirect(coursePath(courseId, "outcome-failed"));
  refreshCourse(parsedId.data);
  redirect(coursePath(parsedId.data, "outcome-removed"));
}

export async function addCourseCapability(courseId: number, formData: FormData) {
  await requireStaff();
  const parsedId = idSchema.safeParse(courseId);
  const parsed = z
    .object({
      capabilityId: idSchema,
      coverageScore: z.coerce.number().int().min(1).max(100),
      isPrimary: z.boolean(),
      outcomeId: z.union([z.literal(""), z.coerce.number().int().positive()]),
      rationale: z.string().trim().max(1_000),
    })
    .safeParse({
      capabilityId: formData.get("capabilityId"),
      coverageScore: formData.get("coverageScore"),
      isPrimary: formData.get("isPrimary") === "on",
      outcomeId: formData.get("outcomeId"),
      rationale: formData.get("rationale"),
    });
  if (!parsedId.success || !parsed.success) redirect(coursePath(courseId, "invalid-mapping"));
  const supabase = await createClient();
  const { error } = await supabase.from("course_capabilities").upsert(
    {
      capability_id: parsed.data.capabilityId,
      confidence: 100,
      course_id: parsedId.data,
      coverage_score: parsed.data.coverageScore,
      is_primary: parsed.data.isPrimary,
      outcome_id: parsed.data.outcomeId || null,
      policy_version: null,
      provenance: "staff",
      rationale: parsed.data.rationale || null,
      reviewed_at: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "course_id,capability_id" },
  );
  if (error) redirect(coursePath(courseId, "mapping-failed"));
  refreshCourse(parsedId.data);
  redirect(coursePath(parsedId.data, "mapping-saved"));
}

export async function removeCourseCapability(courseId: number, formData: FormData) {
  await requireStaff();
  const parsedId = idSchema.safeParse(courseId);
  const capabilityId = idSchema.safeParse(formData.get("capabilityId"));
  if (!parsedId.success || !capabilityId.success) redirect(coursePath(courseId, "invalid-mapping"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("course_capabilities")
    .delete()
    .eq("course_id", parsedId.data)
    .eq("capability_id", capabilityId.data);
  if (error) redirect(coursePath(courseId, "mapping-failed"));
  const { count } = await supabase
    .from("course_capabilities")
    .select("capability_id", { count: "exact", head: true })
    .eq("course_id", parsedId.data);
  if (!count) {
    await supabase.from("courses").update({ is_filter_visible: false }).eq("id", parsedId.data);
  }
  refreshCourse(parsedId.data);
  redirect(coursePath(parsedId.data, "mapping-removed"));
}

export async function createCapability(courseId: number, formData: FormData) {
  await requireStaff();
  const parsedId = idSchema.safeParse(courseId);
  const parsed = z
    .object({
      aliases: z.string().trim().max(500),
      description: z.string().trim().min(10).max(1_000),
      slug: z
        .string()
        .trim()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .max(100),
      title: z.string().trim().min(2).max(160),
    })
    .safeParse({
      aliases: formData.get("aliases"),
      description: formData.get("description"),
      slug: formData.get("slug"),
      title: formData.get("title"),
    });
  if (!parsedId.success || !parsed.success) redirect(coursePath(courseId, "invalid-capability"));
  const supabase = await createClient();
  const { data: capability, error } = await supabase
    .from("capabilities")
    .insert({
      confidence: 100,
      description: parsed.data.description,
      policy_version: null,
      provenance: "staff",
      slug: parsed.data.slug,
      title: parsed.data.title,
    })
    .select("id")
    .single();
  if (error || !capability) redirect(coursePath(courseId, "capability-failed"));
  const { error: mappingError } = await supabase.from("course_capabilities").insert({
    capability_id: capability.id,
    confidence: 100,
    course_id: parsedId.data,
    coverage_score: 80,
    is_primary: false,
    policy_version: null,
    provenance: "staff",
    rationale: "Created during course review; confirm coverage and connect a learning outcome.",
    reviewed_at: new Date().toISOString().slice(0, 10),
  });
  if (mappingError) redirect(coursePath(courseId, "mapping-failed"));
  const aliases = [
    ...new Set(
      parsed.data.aliases
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ].slice(0, 12);
  if (aliases.length) {
    const { error: aliasError } = await supabase
      .from("capability_aliases")
      .insert(aliases.map((alias) => ({ alias, capability_id: capability.id, provenance: "staff" })));
    if (aliasError) redirect(coursePath(courseId, "alias-failed"));
  }
  refreshCourse(parsedId.data);
  redirect(coursePath(parsedId.data, "capability-created"));
}
