import "server-only";

import { createHash } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  COURSE_CAPABILITY_POLICY_VERSION,
  generateCourseCapabilities,
} from "@/lib/admin/ai-course-capability-bootstrap";
import { capabilitySlug, normaliseCapabilityName } from "@/lib/admin/course-capability-validation";
import type { Database } from "@/lib/supabase/database.types";

export type CourseCapabilityBootstrapResult =
  | { status: "no_courses" | "not_configured" | "not_due" }
  | { capabilitiesCreated: number; mappingsCreated: number; outcomesCreated: number; status: "completed" };

export function isCourseCapabilityGenerationConfigured() {
  return Boolean(process.env.OPENAI_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

function sourceHash(courses: readonly { id: number; public_url: string; summary: string; title: string }[]) {
  return createHash("sha256")
    .update(JSON.stringify({ courses, policy: COURSE_CAPABILITY_POLICY_VERSION }))
    .digest("hex");
}

export async function bootstrapCourseCapabilities(
  supabase: SupabaseClient<Database>,
  options: { force?: boolean } = {},
): Promise<CourseCapabilityBootstrapResult> {
  if (!isCourseCapabilityGenerationConfigured()) return { status: "not_configured" };
  const { data: courses, error: courseError } = await supabase
    .from("courses")
    .select(
      "id, title, summary, public_url, capability_taxonomy_source_hash, capability_taxonomy_policy_version",
    )
    .eq("is_active", true)
    .order("id");
  if (courseError) throw new Error("Courses could not be loaded for capability generation.");
  if (!courses?.length) return { status: "no_courses" };

  const courseInputs = courses.map(({ id, public_url, summary, title }) => ({
    id,
    public_url,
    summary,
    title,
  }));
  const hash = sourceHash(courseInputs);
  if (
    !options.force &&
    courses.every(
      (course) =>
        course.capability_taxonomy_source_hash === hash &&
        course.capability_taxonomy_policy_version === COURSE_CAPABILITY_POLICY_VERSION,
    )
  ) {
    return { status: "not_due" };
  }

  const { data: capabilities, error: capabilityError } = await supabase
    .from("capabilities")
    .select("id, title, description, is_active, provenance, slug, capability_aliases(alias)")
    .order("title");
  if (capabilityError) throw new Error("Capabilities could not be loaded for course analysis.");
  const existing = (capabilities ?? []).map((capability) => ({
    aliases: capability.capability_aliases.map(({ alias }) => alias),
    description: capability.description,
    id: capability.id,
    title: capability.title,
  }));
  const generated = await generateCourseCapabilities(courseInputs, existing);
  if (!generated.length) throw new Error("No evidence-backed course capabilities were generated.");

  const now = new Date().toISOString();
  const courseIds = courseInputs.map(({ id }) => id);
  const { data: currentMappings, error: mappingReadError } = await supabase
    .from("course_capabilities")
    .select("capability_id, course_id, provenance")
    .in("course_id", courseIds);
  if (mappingReadError) throw new Error("Existing course mappings could not be loaded.");

  const { error: mappingDeleteError } = await supabase
    .from("course_capabilities")
    .delete()
    .in("course_id", courseIds)
    .eq("provenance", "course_summary_ai");
  if (mappingDeleteError) throw new Error("Previous generated mappings could not be replaced.");
  const { error: outcomeDeleteError } = await supabase
    .from("course_learning_outcomes")
    .delete()
    .in("course_id", courseIds)
    .eq("provenance", "course_summary_ai");
  if (outcomeDeleteError) throw new Error("Previous generated outcomes could not be replaced.");

  const capabilityById = new Map((capabilities ?? []).map((capability) => [capability.id, capability]));
  const capabilityByName = new Map<string, number>();
  for (const capability of capabilities ?? []) {
    capabilityByName.set(normaliseCapabilityName(capability.title), capability.id);
    for (const { alias } of capability.capability_aliases) {
      capabilityByName.set(normaliseCapabilityName(alias), capability.id);
    }
  }
  const staffMappings = new Set(
    (currentMappings ?? [])
      .filter(({ provenance }) => provenance !== "course_summary_ai")
      .map(({ capability_id, course_id }) => `${course_id}:${capability_id}`),
  );

  let capabilitiesCreated = 0;
  let outcomesCreated = 0;
  let mappingsCreated = 0;
  const connectedCourseIds = new Set<number>();
  for (const item of generated) {
    let capabilityId =
      item.existing_capability_id ?? capabilityByName.get(normaliseCapabilityName(item.title));
    if (!capabilityId || !capabilityById.has(capabilityId)) {
      const baseSlug = capabilitySlug(item.title);
      let slug = baseSlug;
      let suffix = 2;
      while ((capabilities ?? []).some((capability) => capability.slug === slug))
        slug = `${baseSlug}-${suffix++}`;
      const { data: created, error } = await supabase
        .from("capabilities")
        .insert({
          confidence: item.confidence,
          description: item.description,
          policy_version: COURSE_CAPABILITY_POLICY_VERSION,
          provenance: "course_summary_ai",
          slug,
          title: item.title,
        })
        .select("id, title, description, is_active, provenance, slug, capability_aliases(alias)")
        .single();
      if (error || !created) throw new Error("A generated capability could not be saved.");
      capabilityId = created.id;
      capabilityById.set(created.id, created);
      capabilityByName.set(normaliseCapabilityName(created.title), created.id);
      capabilitiesCreated += 1;
    }
    if (!capabilityById.get(capabilityId)?.is_active) {
      const { error: reactivateError } = await supabase
        .from("capabilities")
        .update({ is_active: true, updated_at: now })
        .eq("id", capabilityId);
      if (reactivateError) throw new Error("A reused capability could not be reactivated.");
    }

    for (const alias of item.aliases) {
      const normalised = normaliseCapabilityName(alias);
      if (!normalised || capabilityByName.has(normalised)) continue;
      const { error } = await supabase.from("capability_aliases").insert({
        alias,
        capability_id: capabilityId,
        provenance: "course_outcome",
      });
      if (!error) capabilityByName.set(normalised, capabilityId);
    }

    const course = courseInputs.find(({ id }) => id === item.course_id)!;
    const { data: outcome, error: outcomeError } = await supabase
      .from("course_learning_outcomes")
      .insert({
        confidence: item.confidence,
        course_id: item.course_id,
        evidence_text: item.evidence,
        outcome_text: item.outcome,
        policy_version: COURSE_CAPABILITY_POLICY_VERSION,
        provenance: "course_summary_ai",
        reviewed_at: null,
        source_url: course.public_url,
      })
      .select("id")
      .single();
    if (outcomeError || !outcome) throw new Error("A generated learning outcome could not be saved.");
    outcomesCreated += 1;

    if (!staffMappings.has(`${item.course_id}:${capabilityId}`)) {
      const { error: mappingError } = await supabase.from("course_capabilities").insert({
        capability_id: capabilityId,
        confidence: item.confidence,
        course_id: item.course_id,
        coverage_score: item.coverage_score,
        is_primary: item.is_primary,
        outcome_id: outcome.id,
        policy_version: COURSE_CAPABILITY_POLICY_VERSION,
        provenance: "course_summary_ai",
        rationale: item.rationale,
        reviewed_at: null,
      });
      if (mappingError) throw new Error("A generated course mapping could not be saved.");
      mappingsCreated += 1;
    }
    connectedCourseIds.add(item.course_id);
  }

  if (connectedCourseIds.size) {
    const { error } = await supabase
      .from("courses")
      .update({ is_filter_visible: true, updated_at: now })
      .in("id", [...connectedCourseIds]);
    if (error) throw new Error("Generated course filters could not be enabled.");
  }
  const { error: hashError } = await supabase
    .from("courses")
    .update({
      capability_taxonomy_generated_at: now,
      capability_taxonomy_policy_version: COURSE_CAPABILITY_POLICY_VERSION,
      capability_taxonomy_source_hash: hash,
      updated_at: now,
    })
    .in("id", courseIds);
  if (hashError) throw new Error("Course capability generation state could not be saved.");

  const { data: generatedCapabilities, error: generatedReadError } = await supabase
    .from("capabilities")
    .select("id, course_capabilities(capability_id)")
    .eq("provenance", "course_summary_ai");
  if (generatedReadError) throw new Error("Generated capabilities could not be checked for reuse.");
  const orphanIds = (generatedCapabilities ?? [])
    .filter((capability) => capability.course_capabilities.length === 0)
    .map(({ id }) => id);
  for (const orphanId of orphanIds) {
    const { error: orphanDeleteError } = await supabase.from("capabilities").delete().eq("id", orphanId);
    if (orphanDeleteError) {
      const { error: deactivateError } = await supabase
        .from("capabilities")
        .update({ is_active: false, updated_at: now })
        .eq("id", orphanId);
      if (deactivateError) throw new Error("An unused generated capability could not be retired.");
    }
  }

  return { capabilitiesCreated, mappingsCreated, outcomesCreated, status: "completed" };
}
