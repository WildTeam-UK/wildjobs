import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import type { Course } from "@/lib/courses";
import { createPublicClient } from "@/lib/supabase/public";

export const getPublicCourses = cache(async (): Promise<readonly Course[]> => {
  await connection();
  const { data, error } = await createPublicClient()
    .from("courses")
    .select("slug, title, short_title, summary, public_url, course_capabilities!inner(capability_id)")
    .eq("is_active", true)
    .eq("is_filter_visible", true)
    .eq("availability_status", "available")
    .order("title");

  if (error) {
    console.error("Unable to load active course filters", { code: error.code, message: error.message });
    throw new Error("Course filters could not be loaded.");
  }

  return data.map((course) => ({
    shortTitle: course.short_title,
    slug: course.slug,
    summary: course.summary,
    title: course.title,
    trainingUrl: course.public_url,
  }));
});
