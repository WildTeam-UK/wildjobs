import type { ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";
import { requireCandidate } from "@/lib/auth/candidate";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const candidate = await requireCandidate("/account");

  return (
    <>
      <aside className="fixture-notice account-preview-notice">
        <div className="shell">
          <strong>Your account is connected.</strong> Saved jobs are private to this account. Preferences
          remain a design preview until the next build stage.
        </div>
      </aside>
      <AccountNav email={candidate.email} />
      {children}
    </>
  );
}
