"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ensureCandidateProfile } from "@/lib/auth/candidate-profile";
import { clearPendingSaveIntent, rememberPendingSaveIntent } from "@/lib/auth/pending-intent";
import { buildAuthPath, getSafeNextPath } from "@/lib/auth/redirects";
import { addSaveStatus, getSaveJobIntent } from "@/lib/auth/save-intent";
import { saveRequestedJob } from "@/lib/auth/save-request";
import { hasAcceptedTerms, validateCredentials } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.protocol === "https:" || parsedOrigin.hostname === "localhost") {
        return parsedOrigin.origin;
      }
    } catch {
      // Fall through to the platform-provided deployment URL.
    }
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";
}

export async function signIn(formData: FormData) {
  const next = getSafeNextPath(formData.get("next"));
  const saveIntent = getSaveJobIntent({
    intent: formData.get("intent"),
    job: formData.get("job"),
    next,
  });
  const result = validateCredentials(formData);

  if (result.error) {
    redirect(
      buildAuthPath("/sign-in", {
        error: result.error,
        intent: saveIntent ? "save" : undefined,
        job: saveIntent?.jobSlug,
        next,
      }),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(result.data);

  if (error || !data.user) {
    redirect(
      buildAuthPath("/sign-in", {
        error: "invalid-credentials",
        intent: saveIntent ? "save" : undefined,
        job: saveIntent?.jobSlug,
        next,
      }),
    );
  }

  const profileError = await ensureCandidateProfile(supabase, data.user.id);

  if (profileError) {
    await supabase.auth.signOut({ scope: "local" });
    redirect(
      buildAuthPath("/sign-in", {
        error: "profile-unavailable",
        intent: saveIntent ? "save" : undefined,
        job: saveIntent?.jobSlug,
        next,
      }),
    );
  }

  await clearPendingSaveIntent();
  revalidatePath("/", "layout");
  if (saveIntent) {
    const status = await saveRequestedJob(supabase, data.user.id, saveIntent);
    revalidatePath("/account/saved");
    redirect(addSaveStatus(next, status));
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const next = getSafeNextPath(formData.get("next"));
  const saveIntent = getSaveJobIntent({
    intent: formData.get("intent"),
    job: formData.get("job"),
    next,
  });
  const result = validateCredentials(formData);

  if (result.error) {
    redirect(
      buildAuthPath("/create-account", {
        error: result.error,
        intent: saveIntent ? "save" : undefined,
        job: saveIntent?.jobSlug,
        next,
      }),
    );
  }

  if (!hasAcceptedTerms(formData)) {
    redirect(
      buildAuthPath("/create-account", {
        error: "terms-required",
        intent: saveIntent ? "save" : undefined,
        job: saveIntent?.jobSlug,
        next,
      }),
    );
  }

  const origin = await getRequestOrigin();
  const confirmUrl = new URL("/auth/confirm", origin);
  confirmUrl.searchParams.set("next", next);
  if (saveIntent) {
    confirmUrl.searchParams.set("intent", "save");
    confirmUrl.searchParams.set("job", saveIntent.jobSlug);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...result.data,
    options: { emailRedirectTo: confirmUrl.toString() },
  });

  if (error || !data.user) {
    redirect(
      buildAuthPath("/create-account", {
        error: "signup-unavailable",
        intent: saveIntent ? "save" : undefined,
        job: saveIntent?.jobSlug,
        next,
      }),
    );
  }

  if (!saveIntent) await clearPendingSaveIntent();

  if (data.session) {
    const profileError = await ensureCandidateProfile(supabase, data.user.id);

    if (profileError) {
      await supabase.auth.signOut({ scope: "local" });
      redirect(
        buildAuthPath("/sign-in", {
          error: "profile-unavailable",
          intent: saveIntent ? "save" : undefined,
          job: saveIntent?.jobSlug,
          next,
        }),
      );
    }

    await clearPendingSaveIntent();
    revalidatePath("/", "layout");
    if (saveIntent) {
      const status = await saveRequestedJob(supabase, data.user.id, saveIntent);
      revalidatePath("/account/saved");
      redirect(addSaveStatus(next, status));
    }

    redirect(next);
  }

  if (saveIntent) await rememberPendingSaveIntent(saveIntent);

  const checkEmailParams = new URLSearchParams({ next });
  if (saveIntent) {
    checkEmailParams.set("intent", "save");
    checkEmailParams.set("job", saveIntent.jobSlug);
  }
  redirect(`/check-email?${checkEmailParams}`);
}

export async function signOut() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect(buildAuthPath("/sign-in", { status: "signed-out" }));
  }

  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect(buildAuthPath("/sign-in", { status: "signed-out" }));
}
