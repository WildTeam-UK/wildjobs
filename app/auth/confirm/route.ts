import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { ensureCandidateProfile } from "@/lib/auth/candidate-profile";
import { clearPendingSaveIntent, readPendingSaveIntent } from "@/lib/auth/pending-intent";
import { buildAuthPath, getSafeNextPath } from "@/lib/auth/redirects";
import { addSaveStatus, getSaveJobIntent } from "@/lib/auth/save-intent";
import { saveRequestedJob } from "@/lib/auth/save-request";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const code = request.nextUrl.searchParams.get("code");
  const queryIntent = getSaveJobIntent({
    intent: request.nextUrl.searchParams.get("intent"),
    job: request.nextUrl.searchParams.get("job"),
    next: request.nextUrl.searchParams.get("next"),
  });
  const saveIntent =
    queryIntent ?? (request.nextUrl.searchParams.has("next") ? null : await readPendingSaveIntent());
  const next = saveIntent?.next ?? getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const supabase = await createClient();

  const verification =
    tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : code
        ? await supabase.auth.exchangeCodeForSession(code)
        : { error: new Error("Missing confirmation credentials") };

  if (verification.error) {
    return NextResponse.redirect(
      new URL(
        buildAuthPath("/sign-in", {
          error: "confirmation",
          intent: saveIntent ? "save" : undefined,
          job: saveIntent?.jobSlug,
          next,
        }),
        request.url,
      ),
    );
  }

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId || (await ensureCandidateProfile(supabase, userId))) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(
      new URL(
        buildAuthPath("/sign-in", {
          error: "profile-unavailable",
          intent: saveIntent ? "save" : undefined,
          job: saveIntent?.jobSlug,
          next,
        }),
        request.url,
      ),
    );
  }

  await clearPendingSaveIntent();

  if (saveIntent) {
    const status = await saveRequestedJob(supabase, userId, saveIntent);
    return NextResponse.redirect(new URL(addSaveStatus(next, status), request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
