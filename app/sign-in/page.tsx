import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { getSaveJobIntent } from "@/lib/auth/save-intent";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const messages: Record<string, string> = {
  confirmation: "That confirmation link is invalid or has expired. Please sign in or create a new account.",
  "invalid-credentials": "The email address or password was not recognised.",
  "invalid-email": "Enter a valid email address.",
  "password-short": "Your password must be between 10 and 128 characters.",
  "profile-unavailable": "We could not prepare your WildJobs profile. Please try signing in again.",
};

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = getSafeNextPath(params.next);
  const saveIntent = getSaveJobIntent(params);
  const savingJob = Boolean(saveIntent);
  const error = typeof params.error === "string" ? params.error : undefined;
  const status = typeof params.status === "string" ? params.status : undefined;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) redirect(next);

  return (
    <main className="auth-page">
      <section className="auth-panel shell">
        <div className="auth-panel__intro">
          <p className="eyebrow">Candidate account</p>
          <h1>{savingJob ? "Save this role and return to it later." : "Welcome back to WildJobs."}</h1>
          <p>
            Your account keeps saved jobs and explicit preferences together. You never need an account to
            browse or apply.
          </p>
          {savingJob ? (
            <p className="intent-note">After signing in, this job will be saved and you will return to it.</p>
          ) : null}
        </div>
        <div className="auth-card">
          <p className="eyebrow">Sign in with email</p>
          {status === "signed-out" ? (
            <p className="auth-card__message" role="status">
              You have been signed out.
            </p>
          ) : null}
          {error && messages[error] ? (
            <p className="auth-card__message auth-card__message--error" role="alert">
              {messages[error]}
            </p>
          ) : null}
          <form action={signIn}>
            <input name="next" type="hidden" value={next} />
            {saveIntent ? (
              <>
                <input name="intent" type="hidden" value="save" />
                <input name="job" type="hidden" value={saveIntent.jobSlug} />
              </>
            ) : null}
            <label htmlFor="sign-in-email">Email address</label>
            <input
              autoComplete="email"
              id="sign-in-email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
            <label htmlFor="sign-in-password">Password</label>
            <input
              autoComplete="current-password"
              id="sign-in-password"
              maxLength={128}
              minLength={10}
              name="password"
              required
              type="password"
            />
            <SubmitButton idleLabel="Sign in" pendingLabel="Signing in…" />
          </form>
          <p className="auth-card__prototype">
            Your password is handled by Supabase Auth and is never stored in the WildJobs database.
          </p>
          <p className="auth-card__switch">
            New to WildJobs?{" "}
            <Link
              href={{
                pathname: "/create-account",
                query: saveIntent ? { intent: "save", job: saveIntent.jobSlug, next } : { next },
              }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
