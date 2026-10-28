import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { requireStaff } from "@/lib/auth/staff";

export const metadata: Metadata = {
  title: { default: "Staff workspace", template: "%s | WildJobs staff" },
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();

  return (
    <>
      <aside className="staff-preview-notice">
        <div className="shell">
          <strong>Secure staff workspace:</strong> Signed in as {staff.email ?? "WildJobs staff"} (
          {staff.role}). Job review and submission screens still contain clearly labelled examples until their
          next build stage.
        </div>
      </aside>
      <nav className="staff-nav shell" aria-label="Staff workspace">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/sources">Sources</Link>
        <Link href="/admin/jobs">Job review</Link>
        <Link href="/admin/imports">Import runs</Link>
        <Link href="/admin/employers">Employers</Link>
        <Link href="/admin/submissions">Submissions</Link>
      </nav>
      {children}
    </>
  );
}
