import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signUp } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { getSaveJobIntent } from "@/lib/auth/save-intent";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create an account" };
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const messages: Record<string, string> = {
  "invalid-email": "Enter a valid email address.",
  "password-short": "Choose a password between 10 and 128 characters.",
  "signup-unavailable": "We could not create the account. Please try again in a moment.",
  "terms-required": "You need to accept the terms and acknowledge the privacy notice to create an account.",
};

export default async function CreateAccountPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = getSafeNextPath(params.next);
  const saveIntent = getSaveJobIntent(params);
  const error = typeof params.error === "string" ? params.error : undefined;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims?.sub) redirect(next);

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
          {error && messages[error] ? (
            <p className="auth-card__message auth-card__message--error" role="alert">
              {messages[error]}
            </p>
          ) : null}
          <form action={signUp}>
            <input name="next" type="hidden" value={next} />
            {saveIntent ? (
              <>
                <input name="intent" type="hidden" value="save" />
                <input name="job" type="hidden" value={saveIntent.jobSlug} />
              </>
            ) : null}
            <label htmlFor="create-email">Email address</label>
            <input
              autoComplete="email"
              id="create-email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
            <label htmlFor="create-password">Create a password</label>
            <input
              aria-describedby="password-help"
              autoComplete="new-password"
              id="create-password"
              maxLength={128}
              minLength={10}
              name="password"
              required
              type="password"
            />
            <small id="password-help">Use between 10 and 128 characters.</small>
            <label className="consent-choice">
              <input name="terms" required type="checkbox" />
              <span>I agree to the WildJobs terms and acknowledge the privacy notice.</span>
            </label>
            <SubmitButton idleLabel="Create account" pendingLabel="Creating account…" />
          </form>
          <p className="auth-card__prototype">
            Marketing updates will be offered separately once Brevo consent capture is connected.
          </p>
          <p className="auth-card__switch">
            Already have an account?{" "}
            <Link
              href={{
                pathname: "/sign-in",
                query: saveIntent ? { intent: "save", job: saveIntent.jobSlug, next } : { next },
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
