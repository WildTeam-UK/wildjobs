const requiredEnvironmentVariables = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

type SupabaseConfig = {
  publishableKey: string;
  url: string;
};

export function getSupabaseConfig(): SupabaseConfig {
  // These exact property accesses are required so Next.js can inline public
  // environment variables into the browser bundle.
  const values = {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  const missingVariables = requiredEnvironmentVariables.filter((name) => !values[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVariables.join(", ")}`);
  }

  const url = values.NEXT_PUBLIC_SUPABASE_URL as string;
  const publishableKey = values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
  }

  const isLocalSupabase = parsedUrl.hostname === "127.0.0.1" || parsedUrl.hostname === "localhost";

  if (parsedUrl.protocol !== "https:" && !(isLocalSupabase && parsedUrl.protocol === "http:")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must use HTTPS, except for local development");
  }

  return { publishableKey, url };
}
