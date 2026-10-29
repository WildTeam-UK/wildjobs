import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

export function createTrustedClient() {
  const { url } = getSupabaseConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey?.startsWith("sb_secret_")) {
    throw new Error("SUPABASE_SECRET_KEY is missing or invalid.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
