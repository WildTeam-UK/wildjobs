import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account-nav";
import { createClient } from "@/lib/supabase/server";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/sign-in?next=/account");

  const email = typeof data.claims.email === "string" ? data.claims.email : undefined;

  return (
    <>
      <aside className="fixture-notice account-preview-notice">
        <div className="shell">
          <strong>Your account is connected.</strong> Saved jobs and preferences are still design examples
          until the next build stage.
        </div>
      </aside>
      <AccountNav email={email} />
      {children}
    </>
  );
}
