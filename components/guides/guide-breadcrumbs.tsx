import Link from "next/link";
import type { GuideContent } from "@/lib/guide-content";
import { guideBreadcrumbs } from "@/lib/guide-seo";

export function GuideBreadcrumbs({ guide }: { guide?: GuideContent }) {
  const crumbs = guideBreadcrumbs(guide);
  return (
    <nav className="guide-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {crumbs.map((crumb, i) => (
          <li key={crumb.path}>
            {i ? <span aria-hidden="true">/</span> : null}
            {i === crumbs.length - 1 ? (
              <span aria-current="page">{crumb.name}</span>
            ) : (
              <Link href={crumb.path}>{crumb.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
