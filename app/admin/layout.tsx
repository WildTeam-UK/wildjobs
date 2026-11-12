import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { requireStaff } from "@/lib/auth/staff";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Staff workspace",
    description: "Manage WildJobs jobs, sources, employer information and conservation career guides.",
    staff: true,
  }),
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
          {staff.role}).
        </div>
      </aside>
      <nav className="staff-nav shell" aria-label="Staff workspace">
        <Link href="/admin">Overview</Link>
        <Link href="/admin/jobs">Jobs</Link>
        <Link href="/admin/quality">Quality</Link>
        <Link href="/admin/guides">Career guides</Link>
        {staff.role === "admin" ? <Link href="/admin/sources">Sources</Link> : null}
        <Link href="/admin/courses">Courses</Link>
        <Link href="/admin/organisations">Organisation logos</Link>
      </nav>
      {children}
    </>
  );
}
