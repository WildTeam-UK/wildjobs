import Link from "next/link";

import { signOut } from "@/app/auth/actions";

export function AccountNav({ email }: { email?: string }) {
  return (
    <nav className="account-nav shell" aria-label="Candidate account">
      <Link href="/account">Overview</Link>
      <Link href="/account/saved">Saved jobs</Link>
      <Link href="/account/preferences">Preferences</Link>
      <span aria-disabled="true">Alerts · later</span>
      <span className="account-nav__identity">{email ?? "Signed in"}</span>
      <form action={signOut}>
        <button type="submit">Sign out</button>
      </form>
    </nav>
  );
}
