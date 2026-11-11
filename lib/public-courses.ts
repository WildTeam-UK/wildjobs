import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { DEFAULT_COURSE_THEME_COLOUR, type Course } from "@/lib/courses";
import { createPublicClient } from "@/lib/supabase/public";
import { cachePublicData } from "./public-data-cache";

const loadPublicCourses = cachePublicData("courses", async (): Promise<readonly Course[]> => {
  const { data, error } = await createPublicClient()
    .from("courses")
    .select("slug, title, short_title, summary, public_url, theme_colour")
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
    themeColour: course.theme_colour ?? DEFAULT_COURSE_THEME_COLOUR,
    title: course.title,
    trainingUrl: course.public_url,
  }));
});

export const getPublicCourses = cache(async () => {
  await connection();
  return loadPublicCourses();
});
