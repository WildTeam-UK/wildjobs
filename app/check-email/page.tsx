import type { Metadata } from "next";
import Link from "next/link";

import { getSafeNextPath } from "@/lib/auth/redirects";

export const metadata: Metadata = { title: "Check your email" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = getSafeNextPath(params.next);

  return (
    <main className="auth-page">
      <section className="auth-panel shell">
        <div className="auth-panel__intro">
          <p className="eyebrow">One more step</p>
          <h1>Check your email to finish creating your account.</h1>
          <p>
            Open the confirmation email from WildJobs in the same browser if you can. The link will verify
            your address and securely sign you in.
          </p>
        </div>
        <div className="auth-card">
          <p className="eyebrow">No email yet?</p>
          <p className="auth-card__guidance">
            Give it a few minutes and check your spam folder. For privacy, this page does not reveal whether
            an address already has an account.
          </p>
          <p className="auth-card__switch">
            Already confirmed? <Link href={{ pathname: "/sign-in", query: { next } }}>Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
