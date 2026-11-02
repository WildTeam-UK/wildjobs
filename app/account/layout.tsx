import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AccountNav } from "@/components/account-nav";
import { requireCandidate } from "@/lib/auth/candidate";

export const metadata: Metadata = { robots: { index: false, follow: false } };

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
