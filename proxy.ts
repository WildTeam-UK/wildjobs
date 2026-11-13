import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // This public image route verifies stored branding itself and never reads a session.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/employer-logo(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
