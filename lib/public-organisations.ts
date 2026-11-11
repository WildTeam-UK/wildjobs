import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createPublicClient } from "./supabase/public";
import { cachePublicData, PUBLIC_DATA_PAGE_SIZE } from "./public-data-cache";

const getOrganisationPage = cachePublicData("organisations", async (from: number) => {
  const { data, error } = await createPublicClient()
    .from("directory_organisations")
    .select("name,logo_url,website_url")
    .order("name")
    .range(from, from + PUBLIC_DATA_PAGE_SIZE - 1);
  if (error) throw new Error("Organisation logos could not be loaded.");
  return data;
});

export const getPublicOrganisations = cache(async () => {
  await connection();
  const records: Awaited<ReturnType<typeof getOrganisationPage>> = [];
  for (let from = 0; ; from += PUBLIC_DATA_PAGE_SIZE) {
    const page = await getOrganisationPage(from);
    records.push(...page);
    if (page.length < PUBLIC_DATA_PAGE_SIZE) return records;
  }
});
