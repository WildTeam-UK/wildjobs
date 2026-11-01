import "server-only";
import { cache } from "react";
import { getCandidateSession, requireCandidate } from "@/lib/auth/candidate";
import { mapDirectoryJobs } from "@/lib/public-jobs";
export type CandidateSaveState = Readonly<{ isSignedIn: boolean; savedJobIds: readonly number[] }>;
export const getCandidateSaveState = cache(async (): Promise<CandidateSaveState> => {
  const session = await getCandidateSession();
  if (!session) return { isSignedIn: false, savedJobIds: [] };
  const { data, error } = await session.supabase
    .from("directory_saved_jobs")
    .select("job_id")
    .eq("user_id", session.userId);
  if (error) throw new Error("Saved jobs could not be loaded.");
  return { isSignedIn: true, savedJobIds: data.map((j) => j.job_id) };
});
export const getCandidateSavedJobs = cache(async () => {
  const session = await requireCandidate("/account/saved");
  const { data, error } = await session.supabase
    .from("directory_saved_jobs")
    .select("saved_at,directory_jobs!inner(*)")
    .eq("user_id", session.userId)
    .order("saved_at", { ascending: false });
  if (error) throw new Error("Saved jobs could not be loaded.");
  return mapDirectoryJobs(data.map((row) => row.directory_jobs));
});
