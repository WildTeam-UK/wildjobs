import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { JobIntakeInput } from "@/lib/admin/job-intake-validation";
import type { Database } from "@/lib/supabase/database.types";

export async function createJobDraft(supabase: SupabaseClient<Database>, input: JobIntakeInput) {
  return supabase.rpc("create_manual_job_draft", {
    p_application_url: input.applicationUrl,
    p_canonical_url: input.canonicalUrl,
    p_closes_at: input.closesAt,
    p_contract_type: input.contractType ?? "",
    p_country_code: input.countryCode,
    p_description: input.description,
    p_engagement_type: input.engagementType,
    p_employer_name: input.employerName,
    p_employer_slug: input.employerSlug,
    p_employer_website_url: input.employerWebsiteUrl,
    p_experience_level: input.experienceLevel ?? "",
    p_hours_type: input.hoursType ?? "",
    p_job_slug: input.jobSlug,
    p_location_locality: input.locationLocality,
    p_location_region: input.locationRegion,
    p_location_text: input.locationText,
    p_postal_code: input.postalCode,
    p_posted_at: input.postedAt,
    p_requirements: input.requirements,
    p_responsibilities: input.responsibilities,
    p_salary_text: input.salaryText ?? "",
    p_source_id: input.sourceId,
    p_summary: input.summary,
    p_title: input.title,
    p_workplace_type: input.workplaceType ?? "",
  });
}
