import type { ReactNode } from "react";
import { AccountNav } from "@/components/account-nav";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <aside className="fixture-notice account-preview-notice">
        <div className="shell">
          <strong>Account design preview:</strong> Nothing is saved and authentication is not connected yet.
        </div>
      </aside>
      <AccountNav />
      {children}
    </>
  );
}
