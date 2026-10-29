import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import { createPublicClient } from "./supabase/public";

export type PublicCareerArea = Readonly<{
  id: number;
  slug: string;
  title: string;
  description: string;
  displayOrder: number;
}>;

function publicReadError(error: { code?: string; message: string }) {
  console.error("Unable to load public career areas", {
    code: error.code,
    message: error.message,
  });

  return new Error("Career areas could not be loaded.");
}

export const getPublicCareerAreas = cache(async (): Promise<readonly PublicCareerArea[]> => {
  await connection();
  const client = createPublicClient();
  const { data, error } = await client
    .from("career_areas")
    .select("id, slug, title, description, display_order")
    .eq("is_active", true)
    .order("display_order")
    .order("title");

  if (error) throw publicReadError(error);

  return data.map((area) => ({
    id: area.id,
    slug: area.slug,
    title: area.title,
    description: area.description ?? "Explore current opportunities in this area of conservation.",
    displayOrder: area.display_order,
  }));
});

export const getPublicCareerAreaBySlug = cache(async (slug: string) => {
  const careerAreas = await getPublicCareerAreas();
  return careerAreas.find((area) => area.slug === slug);
});
