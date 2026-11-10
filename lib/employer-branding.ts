import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import { findOrganisationLogo } from "./organisation-logo";

export async function repairEmployerLogo(db: SupabaseClient<Database>, name: string, website: string) {
  // Branding has its own failure boundary and never gates a vacancy or profile.
  try {
    const current = await db
      .from("directory_organisations")
      .select("logo_url,website_url")
      .eq("name", name)
      .single();
    if (current.error || current.data.logo_url || current.data.website_url !== website) return false;
    const logo = await findOrganisationLogo(name, website, true);
    if (!logo) return false;
    const saved = await db
      .from("directory_organisations")
      .update({ logo_url: logo })
      .eq("name", name)
      .eq("website_url", website)
      .is("logo_url", null);
    return !saved.error;
  } catch {
    return false;
  }
}
