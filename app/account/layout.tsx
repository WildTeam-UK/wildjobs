import type { ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";
import { requireCandidate } from "@/lib/auth/candidate";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const candidate = await requireCandidate("/account");

  return (
    <>
      <aside className="fixture-notice account-preview-notice">
        <div className="shell">
          <strong>Your account is connected.</strong> Saved jobs and job preferences are private to this
          account.
        </div>
      </aside>
      <AccountNav email={candidate.email} />
      {children}
    </>
  );
}
