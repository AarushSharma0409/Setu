"use client";

import { Button, ErrorState, FormField, PageContainer, Input } from "@setu/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { publicApi, type PublicUser } from "../../lib/api-client";

export default function DevAuthPage() {
  const searchParams = useSearchParams();
  const isCreateAccount = searchParams.get("intent") === "signup";
  const [email, setEmail] = useState("dev.user@setu.test");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await publicApi.devLogin({
        email,
        name: "Development User",
      });
      sessionStorage.setItem("setu_public_access_token", result.accessToken);
      setUser(result.user);
      const returnTo = searchParams.get("returnTo");
      if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
        window.location.assign(returnTo);
      }
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Development login failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer className="setu-auth-page">
      <section className="setu-auth-shell">
        <div className="setu-auth-story">
          <Link className="setu-auth-home-link" href="/">
            <span aria-hidden="true">←</span> Back to Setu
          </Link>
          <div>
            <p className="setu-auth-kicker">Your local Setu space</p>
            <h1>
              {isCreateAccount
                ? "Start exploring with confidence."
                : "Welcome back to your Setu."}
            </h1>
            <p>
              Discover verified local services, keep track of inquiries, and
              explore insurance journeys in one clear workspace.
            </p>
          </div>
          <div className="setu-auth-story-grid" aria-hidden="true">
            <div>
              <span>01</span>
              <strong>Discover</strong>
              <small>Explore services before you commit.</small>
            </div>
            <div>
              <span>02</span>
              <strong>Connect</strong>
              <small>Keep every inquiry in one place.</small>
            </div>
            <div>
              <span>03</span>
              <strong>Continue</strong>
              <small>Return to the things that matter.</small>
            </div>
          </div>
        </div>
        <div className="setu-auth-panel">
          <div className="setu-auth-panel-topline">
            <span>Development access</span>
            <span className="setu-auth-status">Local only</span>
          </div>
          <div className="setu-auth-mode-tabs" aria-label="Account action">
            <Link
              className={!isCreateAccount ? "is-active" : ""}
              href="/dev-auth"
            >
              Sign in
            </Link>
            <Link
              className={isCreateAccount ? "is-active" : ""}
              href="/dev-auth?intent=signup"
            >
              Create account
            </Link>
          </div>
          <h2>{isCreateAccount ? "Create a test account" : "Sign in"}</h2>
          <p className="setu-auth-panel-description">
            {isCreateAccount
              ? "Use any test email to create an account and begin exploring the local environment."
              : "Continue with your test email to return to the local Setu workspace."}
          </p>
          <form
            className="setu-auth-form"
            onSubmit={(event) => void submit(event)}
          >
            <FormField
              htmlFor="dev-email"
              label="Email or development account"
              required
            >
              <Input
                id="dev-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="dev.user@setu.test"
                type="email"
                required
              />
            </FormField>
            <Button className="w-full" loading={loading} type="submit">
              {loading
                ? "Continuing"
                : isCreateAccount
                  ? "Create test account"
                  : "Continue to Setu"}
            </Button>
          </form>
          {error ? (
            <div className="mt-4">
              <ErrorState title="Login failed" detail={error} />
            </div>
          ) : null}
          {user ? (
            <p className="setu-auth-success">
              Signed in as {user.email ?? user.phone}
            </p>
          ) : null}
          <p className="setu-auth-legal">
            This screen is for local development. Production customer sign-up
            will use the approved authentication flow.
          </p>
        </div>
      </section>
    </PageContainer>
  );
}
