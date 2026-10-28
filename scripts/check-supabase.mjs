import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
}

const supabase = createClient(url, publishableKey, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

const { count, error } = await supabase.from("career_areas").select("id", { count: "exact", head: true });

if (error) {
  throw new Error(`Supabase connection check failed: ${error.message}`);
}

if (count !== 6) {
  throw new Error(`Expected 6 career areas, but Supabase returned ${count ?? "no count"}`);
}

console.log("Supabase connection verified: 6 career areas are available.");
