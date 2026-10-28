import Link from "next/link";

export function AccountNav() {
  return (
    <nav className="account-nav shell" aria-label="Candidate account">
      <Link href="/account">Overview</Link>
      <Link href="/account/saved">Saved jobs</Link>
      <Link href="/account/preferences">Preferences</Link>
      <span aria-disabled="true">Alerts · later</span>
    </nav>
  );
}
