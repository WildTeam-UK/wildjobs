import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found shell">
      <p className="eyebrow">Role not found</p>
      <h1>This opportunity is no longer here.</h1>
      <p>It may have closed, moved or never existed in this prototype.</p>
      <Link className="primary-action" href="/">
        Browse available jobs
      </Link>
    </main>
  );
}
