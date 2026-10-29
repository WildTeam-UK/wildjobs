import "server-only";

import { cache } from "react";

import { getCandidateSession, requireCandidate } from "@/lib/auth/candidate";
import { mapPublicJob } from "@/lib/public-job-mapper";
import { publicJobFields } from "@/lib/public-jobs";

export type CandidateSaveState = Readonly<{
  isSignedIn: boolean;
  savedJobIds: readonly number[];
}>;

function privateReadError(context: string, error: { code?: string; message: string }) {
  console.error(`Unable to ${context} candidate saved jobs`, {
    code: error.code,
    message: error.message,
  });

  return new Error("Saved jobs could not be loaded.");
}

export const getCandidateSaveState = cache(async (): Promise<CandidateSaveState> => {
  const session = await getCandidateSession();
  if (!session) return { isSignedIn: false, savedJobIds: [] };

  const { data, error } = await session.supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("user_id", session.userId);

  if (error) throw privateReadError("load", error);

  return { isSignedIn: true, savedJobIds: data.map((record) => record.job_id) };
});

export const getCandidateSavedJobs = cache(async () => {
  const session = await requireCandidate("/account/saved");
  const { data, error } = await session.supabase
    .from("saved_jobs")
    .select(`saved_at, jobs!inner(${publicJobFields})`)
    .eq("user_id", session.userId)
    .order("saved_at", { ascending: false });

  if (error) throw privateReadError("load", error);

  return data.map((record) => mapPublicJob(record.jobs));
});
