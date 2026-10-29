import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found shell">
      <p className="eyebrow">Page not found</p>
      <h1>We couldn’t find that page.</h1>
      <p>It may have moved, expired or never existed.</p>
      <Link className="primary-action" href="/">
        Return to WildJobs
      </Link>
    </main>
  );
}
