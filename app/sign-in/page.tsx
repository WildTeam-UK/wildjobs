import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sign in" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/account";
  const savingJob = params.intent === "save";

  return (
    <main className="auth-page">
      <section className="auth-panel shell">
        <div className="auth-panel__intro">
          <p className="eyebrow">Candidate account</p>
          <h1>{savingJob ? "Save this role and return to it later." : "Welcome back to WildJobs."}</h1>
          <p>
            Your account will keep saved jobs and explicit preferences together. You never need an account to
            browse or apply.
          </p>
          {savingJob ? (
            <p className="intent-note">After signing in, you would return to the same job.</p>
          ) : null}
        </div>
        <div className="auth-card">
          <p className="eyebrow">Sign in with email</p>
          <form>
            <label htmlFor="sign-in-email">Email address</label>
            <input autoComplete="email" id="sign-in-email" name="email" required type="email" />
            <label htmlFor="sign-in-password">Password</label>
            <input
              autoComplete="current-password"
              id="sign-in-password"
              name="password"
              required
              type="password"
            />
            <button className="action" type="button">
              Sign in
            </button>
          </form>
          <p className="auth-card__prototype">
            Design preview only—this form does not send or store anything.
          </p>
          <p className="auth-card__switch">
            New to WildJobs?{" "}
            <Link href={{ pathname: "/create-account", query: { next } }}>Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
