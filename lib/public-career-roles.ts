import "server-only";
import { cache } from "react";
import { createPublicClient } from "./supabase/public";
import { connection } from "next/server";
import { cachePublicData } from "./public-data-cache";

export function guideSchemaUnavailable(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

const loadPublicRoleAliases = cachePublicData("role-aliases", async () => {
  const result = await createPublicClient()
    .from("directory_role_aliases")
    .select("normalized_title,role_slug");
  if (guideSchemaUnavailable(result.error)) return { aliases: [], schemaReady: false };
  if (result.error) throw new Error("Career role mappings could not be loaded.");
  return { aliases: result.data, schemaReady: true };
});

export const getPublicRoleAliases = cache(async () => {
  await connection();
  return loadPublicRoleAliases();
});
