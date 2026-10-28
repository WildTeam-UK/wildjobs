import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Staff workspace", template: "%s | WildJobs staff" },
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <aside className="staff-preview-notice">
        <div className="shell">
          <strong>Staff design preview:</strong> No access controls, database records or publishing actions
          are connected.
        </div>
      </aside>
      <nav className="staff-nav shell" aria-label="Staff workspace">
        <Link href="/admin/jobs">Job review</Link>
        <Link href="/admin/imports">Import runs</Link>
        <Link href="/admin/employers">Employers</Link>
        <Link href="/admin/submissions">Submissions</Link>
      </nav>
      {children}
    </>
  );
}
