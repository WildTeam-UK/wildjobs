import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { buildAuthPath, getSafeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

export type CandidateSession = {
  email?: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
};

export const getCandidateSession = cache(async (): Promise<CandidateSession | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) return null;

  return {
    email: typeof data.claims.email === "string" ? data.claims.email : undefined,
    supabase,
    userId,
  };
});

export async function requireCandidate(next = "/account") {
  const session = await getCandidateSession();
  if (!session) redirect(buildAuthPath("/sign-in", { next: getSafeNextPath(next) }));
  return session;
}
