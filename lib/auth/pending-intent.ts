import "server-only";

import { cookies } from "next/headers";

import { getSaveJobIntent, type SaveJobIntent } from "@/lib/auth/save-intent";

const pendingIntentCookie = "wildjobs_pending_save";
const cookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function serialiseIntent(intent: SaveJobIntent) {
  return new URLSearchParams({ intent: "save", job: intent.jobSlug, next: intent.next }).toString();
}

function parseIntent(value: string | undefined) {
  if (!value) return null;

  const params = new URLSearchParams(value);
  return getSaveJobIntent({
    intent: params.get("intent"),
    job: params.get("job"),
    next: params.get("next"),
  });
}

export async function rememberPendingSaveIntent(intent: SaveJobIntent) {
  const cookieStore = await cookies();
  cookieStore.set(pendingIntentCookie, serialiseIntent(intent), cookieOptions);
}

export async function readPendingSaveIntent() {
  const cookieStore = await cookies();
  return parseIntent(cookieStore.get(pendingIntentCookie)?.value);
}

export async function clearPendingSaveIntent() {
  const cookieStore = await cookies();
  cookieStore.set(pendingIntentCookie, "", { ...cookieOptions, maxAge: 0 });
}
