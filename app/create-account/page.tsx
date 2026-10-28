import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Create an account" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CreateAccountPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/account";

  return (
    <main className="auth-page">
      <section className="auth-panel shell">
        <div className="auth-panel__intro">
          <p className="eyebrow">Create your WildJobs account</p>
          <h1>Make returning to the right role easier.</h1>
          <ul>
            <li>Save opportunities and keep an eye on closing dates.</li>
            <li>Choose job preferences you can inspect and change.</li>
            <li>Browse and apply without giving us unnecessary information.</li>
          </ul>
        </div>
        <div className="auth-card">
          <p className="eyebrow">Your account details</p>
          <form>
            <label htmlFor="create-email">Email address</label>
            <input autoComplete="email" id="create-email" name="email" required type="email" />
            <label htmlFor="create-password">Create a password</label>
            <input
              aria-describedby="password-help"
              autoComplete="new-password"
              id="create-password"
              minLength={10}
              name="password"
              required
              type="password"
            />
            <small id="password-help">
              Use at least 10 characters. Final security rules will be confirmed with authentication.
            </small>
            <label className="consent-choice">
              <input name="terms" required type="checkbox" />
              <span>I agree to the WildJobs terms and acknowledge the privacy notice.</span>
            </label>
            <label className="consent-choice">
              <input name="marketing" type="checkbox" />
              <span>
                Send me useful WildTeam careers and training updates. Optional, and easy to unsubscribe.
              </span>
            </label>
            <button className="action" type="button">
              Create account
            </button>
          </form>
          <p className="auth-card__prototype">
            Design preview only—no account is created and no marketing preference is sent to Brevo.
          </p>
          <p className="auth-card__switch">
            Already have an account? <Link href={{ pathname: "/sign-in", query: { next } }}>Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
